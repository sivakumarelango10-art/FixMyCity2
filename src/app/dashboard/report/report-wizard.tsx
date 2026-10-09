'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ComplaintCategory } from '@/types/enums';
import { CATEGORY_DEFINITIONS, CATEGORY_OPTIONS } from '@/lib/domain/categories';
import { Coordinates, DEFAULT_BENGALURU_COORDINATES } from '@/lib/domain/geo';
import { DynamicLocationPicker } from '@/components/maps/dynamic-location-picker';
import { saveDraftComplaint, submitFinalComplaint } from '@/actions/complaints';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import {
  Sparkle,
  Camera,
  MapPin,
  Check,
  WarningCircle,
  Copy,
  ArrowRight,
  ArrowLeft,
  X,
  UploadSimple,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface UploadedPhoto {
  id: string;
  url: string;
  storagePath: string;
}

export function ReportWizard({ userId: _userId }: { userId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Wizard step (1: Details, 2: Category & AI, 3: Evidence, 4: Location & Review)
  const [step, setStep] = useState<number>(1);
  const [draftId, setDraftId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ComplaintCategory>('POTHOLES');
  const [coordinates, setCoordinates] = useState<Coordinates>(DEFAULT_BENGALURU_COORDINATES);
  const [address, setAddress] = useState('MG Road, Bengaluru, Karnataka 560001');
  const [isPublic, setIsPublic] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');

  // AI Advisory state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<{
    category: ComplaintCategory;
    priority: string;
    explanation: string;
    source: string;
    signals: string[];
  } | null>(null);

  // Photos state
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);

  // Duplicate warning
  const [duplicateAlert, setDuplicateAlert] = useState<{ count: number; warning: boolean } | null>(null);

  // Final Success State
  const [submittedTracking, setSubmittedTracking] = useState<string | null>(null);
  const [submittedComplaintId, setSubmittedComplaintId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // LocalStorage text draft restore
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fmc_draft_text');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.address) setAddress(parsed.address);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Save text draft to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        'fmc_draft_text',
        JSON.stringify({ title, description, address })
      );
    } catch {
      // Ignore storage errors
    }
  }, [title, description, address]);

  // Debounced AI classification preview when description >= 20 chars
  useEffect(() => {
    if (description.trim().length < 20 || title.trim().length < 5) return;

    const timer = setTimeout(async () => {
      setAiLoading(true);
      try {
        const res = await fetch('/api/ai/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: title.trim(), description: description.trim() }),
        });
        if (res.ok) {
          const data = await res.json();
          setAiAdvice(data);
          // If citizen hasn't explicitly customized yet, suggest the AI category
          if (step <= 2) {
            setCategory(data.category);
          }
        }
      } catch (err) {
        console.warn('AI preview fetch error:', err);
      } finally {
        setAiLoading(false);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [title, description, step]);

  // Check 150m duplicates when entering Step 4
  useEffect(() => {
    if (step === 4) {
      const checkDuplicates = async () => {
        try {
          const url = `/api/geo/duplicates?lat=${coordinates.latitude}&lng=${coordinates.longitude}&category=${category}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            setDuplicateAlert({ count: data.duplicateCount, warning: data.warning });
          }
        } catch (err) {
          console.warn('Duplicate check failed:', err);
        }
      };
      checkDuplicates();
    }
  }, [step, coordinates, category]);

  // Save / Sync Draft to Database
  const syncDraft = async (): Promise<string> => {
    const res = await saveDraftComplaint({
      draftId: draftId || undefined,
      title: title.trim() || 'Untitled Civic Grievance',
      description: description.trim() || 'Pending grievance details provided by citizen.',
      category,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      address: address.trim(),
      isPublic,
      additionalNotes: additionalNotes.trim() || undefined,
    });

    if (res.complaint.id) {
      setDraftId(res.complaint.id);
      return res.complaint.id;
    }
    throw new Error('Failed to create or update draft');
  };

  // Handle Photo Upload via Supabase Storage Staging + Completion
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length >= 3) {
      toast.error('Maximum 3 evidence photos allowed.');
      return;
    }

    const file = files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be 5MB or less.');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG, and WebP images are supported.');
      return;
    }

    setUploading(true);
    try {
      // 1. Ensure draft is created
      const activeDraftId = draftId || (await syncDraft());

      // 2. Request upload intent
      const intentRes = await fetch('/api/uploads/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaintId: activeDraftId,
          kind: 'EVIDENCE',
          mimeType: file.type,
          sizeBytes: file.size,
          filename: file.name,
        }),
      });

      if (!intentRes.ok) {
        const errData = await intentRes.json();
        throw new Error(errData.error || 'Failed to prepare upload');
      }

      const { uploadUrl, stagingPath, intentId } = await intentRes.json();

      // 3. Upload directly to Supabase storage signed url
      const supabase = createSupabaseBrowserClient();
      const { error: uploadError } = await supabase.storage
        .from('complaint-photos')
        .uploadToSignedUrl(stagingPath, uploadUrl.split('token=')[1] || '', file);

      if (uploadError) {
        // Fallback: direct PUT to signed URL if token split fails
        const directPut = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });
        if (!directPut.ok) {
          throw new Error('Failed to upload file to storage');
        }
      }

      // 4. Complete upload on server (sharp WebP conversion & EXIF strip)
      const completeRes = await fetch('/api/uploads/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intentId }),
      });

      if (!completeRes.ok) {
        const completeErr = await completeRes.json();
        throw new Error(completeErr.error || 'Failed to process image');
      }

      const completeData = await completeRes.json();

      // Create local preview object
      const objectUrl = URL.createObjectURL(file);
      setPhotos((prev) => [
        ...prev,
        {
          id: completeData.photoId,
          url: objectUrl,
          storagePath: completeData.storagePath,
        },
      ]);

      toast.success('Evidence photo uploaded and verified!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      toast.error(msg);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const removePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    toast.info('Photo removed from report.');
  };

  // Step 1 Validation
  const canProceedStep1 = title.trim().length >= 8 && description.trim().length >= 20;

  // Step 4 Final Submission
  const handleSubmitReport = () => {
    startTransition(async () => {
      try {
        const activeDraftId = draftId || (await syncDraft());

        // Save current form state to draft
        await saveDraftComplaint({
          draftId: activeDraftId,
          title: title.trim(),
          description: description.trim(),
          category,
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          address: address.trim(),
          isPublic,
          additionalNotes: additionalNotes.trim() || undefined,
        });

        // Submit final report
        const res = await submitFinalComplaint(activeDraftId);

        setSubmittedTracking(res.trackingNumber);
        setSubmittedComplaintId(res.complaintId);
        localStorage.removeItem('fmc_draft_text');
        toast.success(`Complaint successfully submitted: ${res.trackingNumber}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Submission failed';
        toast.error(msg);
      }
    });
  };

  // Success Screen
  if (submittedTracking && submittedComplaintId) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center space-y-6 shadow-sm">
        <div className="mx-auto w-16 h-16 rounded-full bg-[var(--success-light)] text-[var(--success)] flex items-center justify-center">
          <Check size={36} weight="bold" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--success)]">
            Complaint Registered
          </span>
          <h2 className="text-2xl font-black text-[var(--foreground)] tracking-tight">
            Thank You for Helping Fix Your City!
          </h2>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            Your report has been logged and assigned to the municipal dispatch queue.
            You will receive real-time updates as field staff review and resolve your grievance.
          </p>
        </div>

        {/* Tracking Number Card */}
        <div className="mx-auto max-w-md rounded-2xl border border-[var(--primary)]/30 bg-[var(--primary-light)] p-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--primary)] block">
            Official Tracking Number
          </span>
          <div className="flex items-center justify-center gap-3 mt-1">
            <span className="font-mono text-2xl font-black text-[var(--primary)] tracking-wide">
              {submittedTracking}
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(submittedTracking);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="p-2 rounded-lg bg-[var(--surface)] text-[var(--primary)] hover:bg-[var(--surface-hover)] shadow-xs transition-colors"
              title="Copy tracking number"
            >
              {copied ? <Check size={18} weight="bold" /> : <Copy size={18} weight="bold" />}
            </button>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] block mt-1">
            Use this number to check progress or reference with municipal helpline
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href={`/dashboard/complaints/${submittedComplaintId}`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 text-xs font-bold text-white shadow-xs hover:bg-[var(--primary-hover)] transition-all"
          >
            Track This Issue Now <ArrowRight size={14} weight="bold" />
          </Link>
          <button
            type="button"
            onClick={() => {
              setSubmittedTracking(null);
              setSubmittedComplaintId(null);
              setDraftId(null);
              setTitle('');
              setDescription('');
              setPhotos([]);
              setStep(1);
              router.refresh();
            }}
            className="w-full sm:w-auto rounded-xl border border-[var(--border)] px-6 py-3 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all"
          >
            Report Another Issue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 4-Step Stepper Header */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        {[
          { num: 1, label: 'Details' },
          { num: 2, label: 'Category & AI' },
          { num: 3, label: 'Evidence' },
          { num: 4, label: 'Location & Submit' },
        ].map((s) => (
          <div
            key={s.num}
            onClick={() => {
              if (s.num < step || (s.num === 2 && canProceedStep1)) {
                setStep(s.num);
              }
            }}
            className={`cursor-pointer rounded-xl p-3 border transition-all ${
              step === s.num
                ? 'border-[var(--primary)] bg-[var(--primary-light)] font-black text-[var(--primary)] shadow-xs'
                : step > s.num
                  ? 'border-[var(--border)] bg-[var(--surface)] text-[var(--success)] font-bold'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] opacity-60'
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border border-current">
                {step > s.num ? <Check size={12} weight="bold" /> : s.num}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* STEP 1: Details */}
      {step === 1 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-base font-black text-[var(--foreground)]">Step 1: Problem Details</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Provide a clear title and descriptive explanation of the civic defect.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Grievance Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Hazardous deep pothole near Indiranagar 100ft road junction"
                maxLength={120}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs text-[var(--foreground)] focus:border-[var(--primary)] transition-all shadow-xs"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
                <span>Min 8 characters</span>
                <span>{title.length}/120</span>
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Full Description *
              </label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the problem in detail: when did it happen, hazards to vehicles or pedestrians, approximate depth, ongoing water leakage, etc."
                maxLength={2000}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 text-xs text-[var(--foreground)] focus:border-[var(--primary)] transition-all shadow-xs resize-y"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
                <span>Min 20 characters for automated AI triage</span>
                <span>{description.length}/2000</span>
              </div>
            </div>

            {/* AI Assistant Live Indicator */}
            {aiLoading && (
              <div className="flex items-center gap-2 rounded-xl bg-[var(--primary-light)] p-3 text-xs text-[var(--primary)] border border-[var(--primary)]/20 animate-pulse">
                <Sparkle size={16} weight="fill" />
                <span>AI Assistant is analyzing problem details for department routing...</span>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="button"
              disabled={!canProceedStep1}
              onClick={() => {
                syncDraft();
                setStep(2);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50"
            >
              Continue to Category <ArrowRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Category & AI Recommendation */}
      {step === 2 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-base font-black text-[var(--foreground)]">Step 2: Department Category</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Confirm or adjust the category. The responsible municipal agency will be assigned automatically.
            </p>
          </div>

          {/* AI Recommendation Banner */}
          {aiAdvice && (
            <div className="rounded-2xl border border-teal-200 bg-teal-50/80 dark:border-teal-900/60 dark:bg-teal-950/30 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkle size={16} weight="fill" className="text-teal-600" />
                  <span className="text-xs font-black text-teal-900 dark:text-teal-200">
                    {aiAdvice.source === 'GEMINI' ? 'Gemini AI Assistant Triage' : 'Rule-Based Civic Classifier'}
                  </span>
                </div>
                <span className="rounded-full bg-teal-200/80 dark:bg-teal-900 px-2.5 py-0.5 text-[10px] font-extrabold text-teal-800 dark:text-teal-200">
                  Priority: {aiAdvice.priority}
                </span>
              </div>
              <p className="text-xs text-teal-800 dark:text-teal-300">
                {aiAdvice.explanation}
              </p>
            </div>
          )}

          {/* Category Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORY_OPTIONS.map((cat) => {
              const isSelected = category === cat.code;
              return (
                <button
                  type="button"
                  key={cat.code}
                  onClick={() => setCategory(cat.code)}
                  className={`text-left rounded-xl p-3.5 border transition-all ${
                    isSelected
                      ? 'border-[var(--primary)] bg-[var(--primary-light)] ring-2 ring-[var(--primary)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[var(--foreground)]">{cat.label}</span>
                    {isSelected && <Check size={16} weight="bold" className="text-[var(--primary)]" />}
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-1 line-clamp-2">
                    {cat.description}
                  </p>
                  <span className="text-[10px] font-bold text-[var(--primary)] mt-2 block">
                    Routes to: {cat.departmentName}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all"
            >
              <ArrowLeft size={14} weight="bold" /> Back
            </button>
            <button
              type="button"
              onClick={() => {
                syncDraft();
                setStep(3);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--primary-hover)] transition-all"
            >
              Continue to Photos <ArrowRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Evidence Photos */}
      {step === 3 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-base font-black text-[var(--foreground)]">Step 3: Evidence Photos (Optional)</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Attach up to 3 photographs showing the defect. Images are securely converted to WebP with GPS and EXIF metadata stripped for privacy.
            </p>
          </div>

          {/* Upload Drop Area */}
          <div className="rounded-2xl border-2 border-dashed border-[var(--border)] p-6 text-center space-y-3 bg-[var(--surface-hover)]">
            <div className="mx-auto w-12 h-12 rounded-full bg-[var(--surface)] text-[var(--primary)] flex items-center justify-center border border-[var(--border)] shadow-xs">
              <Camera size={24} weight="bold" />
            </div>

            <div>
              <p className="text-xs font-bold text-[var(--foreground)]">
                Upload grievance photo evidence
              </p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                PNG, JPG, or WebP up to 5MB each (Max 3 photos)
              </p>
            </div>

            <label className="inline-flex items-center gap-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] px-4 py-2 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--surface-hover)] cursor-pointer shadow-xs transition-all">
              <UploadSimple size={16} weight="bold" />
              <span>{uploading ? 'Processing Image...' : 'Select Photo'}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploading || photos.length >= 3}
                onChange={handlePhotoSelect}
                className="hidden"
              />
            </label>
          </div>

          {/* Uploaded Photos Grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, idx) => (
                <div
                  key={photo.id}
                  className="relative aspect-video rounded-xl overflow-hidden border border-[var(--border)] bg-black/5 group"
                >
                  <img
                    src={photo.url}
                    alt={`Evidence ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1 text-white hover:bg-black transition-colors"
                    title="Remove photo"
                  >
                    <X size={14} weight="bold" />
                  </button>
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    Photo {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all"
            >
              <ArrowLeft size={14} weight="bold" /> Back
            </button>
            <button
              type="button"
              onClick={() => {
                syncDraft();
                setStep(4);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--primary-hover)] transition-all"
            >
              Continue to Location <ArrowRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Location, Review & Final Submission */}
      {step === 4 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-6 shadow-xs">
          <div className="space-y-1">
            <h2 className="text-base font-black text-[var(--foreground)]">Step 4: Location & Review</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Pinpoint the defect on the interactive Bengaluru map, verify address, and submit.
            </p>
          </div>

          {/* 150m Duplicate Advisory */}
          {duplicateAlert?.warning && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/40 p-4 space-y-1">
              <div className="flex items-center gap-2">
                <WarningCircle size={18} weight="fill" className="text-amber-600" />
                <span className="text-xs font-black text-amber-950 dark:text-amber-200">
                  Nearby Open Grievance Alert (150m)
                </span>
              </div>
              <p className="text-xs text-amber-900 dark:text-amber-300">
                Notice: {duplicateAlert.count} open report(s) in the same category were detected within 150 meters of this location.
                Your report will still be accepted and linked to ensure rapid municipal attention.
              </p>
            </div>
          )}

          {/* Map Pin Picker */}
          <div>
            <label className="block text-xs font-bold text-[var(--foreground)] mb-2 flex items-center gap-1.5">
              <MapPin size={16} className="text-[var(--primary)]" />
              Pin Incident Location on Map *
            </label>
            <DynamicLocationPicker
              initialCoordinates={coordinates}
              onChange={(coords) => setCoordinates(coords)}
            />
            <div className="flex justify-between text-[11px] text-[var(--text-muted)] mt-1.5 font-mono">
              <span>Latitude: {coordinates.latitude.toFixed(5)}</span>
              <span>Longitude: {coordinates.longitude.toFixed(5)}</span>
            </div>
          </div>

          {/* Editable Street Address */}
          <div>
            <label htmlFor="address" className="block text-xs font-bold text-[var(--foreground)] mb-1">
              Street / Landmark Address *
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Near Metro Pillar 124, 100ft Road, Indiranagar, Bengaluru"
              maxLength={200}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs text-[var(--foreground)] focus:border-[var(--primary)] transition-all shadow-xs"
            />
            <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
              Min 5 characters. Must specify recognizable municipal landmark.
            </span>
          </div>

          <div>
            <label htmlFor="additionalNotes" className="block text-xs font-bold text-[var(--foreground)] mb-1">
              Additional Notes (Optional)
            </label>
            <input
              id="additionalNotes"
              type="text"
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="e.g. Best accessed from side gate or after 10 AM..."
              maxLength={1000}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs text-[var(--foreground)] focus:border-[var(--primary)] transition-all shadow-xs"
            />
          </div>

          {/* Public Map Visibility Toggle */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-4 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[var(--foreground)] block">
                Public Civic Map Visibility (Opt-In)
              </span>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Default is Private. When enabled, only approximate location (~110m box) and issue type are visible on public map.
                Your name, phone number, and private address are never published.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
            </label>
          </div>

          {/* Review Summary Box */}
          <div className="rounded-xl border border-[var(--border)] p-4 space-y-2 bg-[var(--surface)] text-xs">
            <span className="font-extrabold uppercase tracking-wider text-[var(--text-muted)] text-[10px] block">
              Submission Summary
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-[var(--text-muted)]">Category: </span>
                <strong className="text-[var(--foreground)]">{CATEGORY_DEFINITIONS[category].label}</strong>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Department: </span>
                <strong className="text-[var(--primary)]">{CATEGORY_DEFINITIONS[category].departmentCode}</strong>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Attached Photos: </span>
                <strong className="text-[var(--foreground)]">{photos.length} photos</strong>
              </div>
              <div>
                <span className="text-[var(--text-muted)]">Visibility: </span>
                <strong className="text-[var(--foreground)]">{isPublic ? 'Public Map' : 'Private (Default)'}</strong>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-4 py-2.5 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all"
            >
              <ArrowLeft size={14} weight="bold" /> Back
            </button>
            <button
              type="button"
              disabled={isPending || address.trim().length < 5}
              onClick={handleSubmitReport}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-8 py-3 text-xs font-extrabold text-white shadow-md hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50"
            >
              {isPending ? 'Registering Grievance...' : 'Submit Official Report'}
              <Check size={16} weight="bold" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
