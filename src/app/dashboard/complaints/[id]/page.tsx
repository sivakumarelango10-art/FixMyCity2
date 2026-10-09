import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getSignedPhotoUrl } from '@/lib/storage';
import { CATEGORY_DEFINITIONS } from '@/lib/domain/categories';
import { DynamicStaticMap } from '@/components/maps/dynamic-static-map';
import { ComplaintActionsClient } from './complaint-actions-client';
import { ComplaintStatus, EventType } from '@prisma/client';
import {
  ArrowLeft,
  CalendarBlank,
  MapPin,
  Sparkle,
  CheckCircle,
  ClockAfternoon,
  Camera,
  Check,
  ShieldCheck,
  Buildings,
} from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CitizenComplaintDetailPage({ params }: PageProps) {
  const user = await requireRole('CITIZEN');
  const { id } = await params;

  // Load complaint ensuring owner authorization
  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      department: true,
      photos: true,
      events: {
        where: { visibility: 'PUBLIC' }, // Citizens can NEVER see INTERNAL notes
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!complaint || complaint.citizenId !== user.id) {
    notFound();
  }

  // Resolve signed URLs for photos
  const evidencePhotos = await Promise.all(
    complaint.photos
      .filter((p) => p.kind === 'EVIDENCE')
      .map(async (p) => ({
        ...p,
        signedUrl: await getSignedPhotoUrl(p.storagePath),
      }))
  );

  const resolutionPhotos = await Promise.all(
    complaint.photos
      .filter((p) => p.kind === 'RESOLUTION')
      .map(async (p) => ({
        ...p,
        signedUrl: await getSignedPhotoUrl(p.storagePath),
      }))
  );

  // Check if citizen has already rated this resolution version
  const existingFeedback = await prisma.complaintEvent.findFirst({
    where: {
      complaintId: complaint.id,
      type: EventType.FEEDBACK,
      resolutionVersion: complaint.resolutionVersion,
    },
  });

  const categoryMeta = CATEGORY_DEFINITIONS[complaint.category];

  const statusBadges: Record<ComplaintStatus, { label: string; bg: string; text: string }> = {
    DRAFT: { label: 'Draft', bg: 'bg-gray-100', text: 'text-gray-700' },
    SUBMITTED: { label: 'Submitted', bg: 'bg-sky-100 dark:bg-sky-950/60', text: 'text-sky-800 dark:text-sky-300' },
    UNDER_REVIEW: { label: 'Under Review', bg: 'bg-indigo-100 dark:bg-indigo-950/60', text: 'text-indigo-800 dark:text-indigo-300' },
    ASSIGNED: { label: 'Assigned', bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-800 dark:text-amber-300' },
    IN_PROGRESS: { label: 'In Progress', bg: 'bg-cyan-100 dark:bg-cyan-950/60', text: 'text-cyan-800 dark:text-cyan-300' },
    RESOLVED: { label: 'Resolved', bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-800 dark:text-emerald-300' },
    REOPENED: { label: 'Reopened', bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-800 dark:text-rose-300' },
    REJECTED: { label: 'Rejected', bg: 'bg-red-100 dark:bg-red-950/60', text: 'text-red-800 dark:text-red-300' },
  };

  const badge = statusBadges[complaint.status] || statusBadges.SUBMITTED;

  // Linear progression steps
  const workflowSteps = [
    { key: 'SUBMITTED', label: 'Submitted' },
    { key: 'UNDER_REVIEW', label: 'Reviewed' },
    { key: 'ASSIGNED', label: 'Assigned' },
    { key: 'IN_PROGRESS', label: 'In Progress' },
    { key: 'RESOLVED', label: 'Resolved' },
  ];

  const currentStepIndex = (() => {
    switch (complaint.status) {
      case 'SUBMITTED':
        return 0;
      case 'UNDER_REVIEW':
        return 1;
      case 'ASSIGNED':
        return 2;
      case 'IN_PROGRESS':
        return 3;
      case 'RESOLVED':
        return 4;
      case 'REOPENED':
        return 2;
      default:
        return 0;
    }
  })();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back button & Tracking Header */}
      <div className="space-y-4">
        <Link
          href="/dashboard/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
        >
          <ArrowLeft size={14} weight="bold" /> Back to My Complaints
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-black text-[var(--primary)]">
                {complaint.trackingNumber}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${badge.bg} ${badge.text}`}
              >
                {badge.label}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tight mt-1">
              {complaint.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
            <CalendarBlank size={14} />
            <span>
              Reported:{' '}
              {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Path Stepper */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xs">
        <div className="grid grid-cols-5 gap-2 text-center text-xs">
          {workflowSteps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex || complaint.status === 'RESOLVED';
            const isCurrent = idx === currentStepIndex && complaint.status !== 'RESOLVED';

            return (
              <div key={step.key} className="space-y-2">
                <div
                  className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isCompleted
                      ? 'bg-[var(--success)] text-white shadow-xs'
                      : isCurrent
                        ? 'bg-[var(--primary)] text-white ring-4 ring-[var(--primary-light)]'
                        : 'bg-[var(--surface-hover)] text-[var(--text-muted)] border border-[var(--border)]'
                  }`}
                >
                  {isCompleted ? <Check size={14} weight="bold" /> : idx + 1}
                </div>
                <span
                  className={`block text-[11px] font-bold ${
                    isCompleted || isCurrent ? 'text-[var(--foreground)]' : 'text-[var(--text-muted)]'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Details vs Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Details & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-3 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Problem Description
            </h2>
            <p className="text-xs text-[var(--foreground)] whitespace-pre-line leading-relaxed">
              {complaint.description}
            </p>
          </div>

          {/* AI Advisory Box (Clearly Labeled as Advisory) */}
          {complaint.aiExplanation && (
            <div className="rounded-2xl border border-teal-200 bg-teal-50/70 dark:border-teal-900/60 dark:bg-teal-950/30 p-5 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkle size={16} weight="fill" className="text-teal-700 dark:text-teal-300" />
                <span className="text-xs font-black text-teal-900 dark:text-teal-200">
                  AI Advisory Routing & Triage Insight
                </span>
                <span className="rounded bg-teal-200/60 dark:bg-teal-900 px-1.5 py-0.5 text-[9px] font-bold text-teal-800 dark:text-teal-200">
                  Advisory Only
                </span>
              </div>
              <p className="text-xs text-teal-800 dark:text-teal-300">
                {complaint.aiExplanation}
              </p>
            </div>
          )}

          {/* Evidence Photos */}
          {evidencePhotos.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Camera size={16} /> Evidence Photos ({evidencePhotos.length})
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {evidencePhotos.map((photo, idx) => (
                  <div
                    key={photo.id}
                    className="aspect-video rounded-xl overflow-hidden border border-[var(--border)] bg-black/5"
                  >
                    {photo.signedUrl ? (
                      <img
                        src={photo.signedUrl}
                        alt={`Evidence photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--text-muted)]">
                        Photo preview expired
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolution Details & Photos (If present) */}
          {complaint.resolutionSummary && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/30 p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle size={20} weight="fill" className="text-emerald-700 dark:text-emerald-400" />
                <h2 className="text-sm font-black text-emerald-950 dark:text-emerald-200">
                  Official Municipal Resolution Summary
                </h2>
              </div>
              <p className="text-xs text-emerald-900 dark:text-emerald-300 whitespace-pre-line leading-relaxed">
                {complaint.resolutionSummary}
              </p>

              {resolutionPhotos.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block mb-2">
                    Field Repair Evidence Photos
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {resolutionPhotos.map((photo, idx) => (
                      <div
                        key={photo.id}
                        className="aspect-video rounded-xl overflow-hidden border border-emerald-300/50 bg-black/5"
                      >
                        {photo.signedUrl ? (
                          <img
                            src={photo.signedUrl}
                            alt={`Resolution photo ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Interactive Rating & Reopen Actions */}
          <ComplaintActionsClient
            complaintId={complaint.id}
            status={complaint.status}
            resolvedAt={complaint.resolvedAt?.toISOString()}
            hasRatedThisVersion={!!existingFeedback}
            resolutionVersion={complaint.resolutionVersion}
          />

          {/* Public Events Timeline */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <ClockAfternoon size={16} /> Official Timeline (Public Events)
            </h2>

            <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border)]">
              {complaint.events.map((evt) => (
                <div key={evt.id} className="relative pl-8 space-y-1">
                  <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-[var(--primary)] border-2 border-white shadow-xs"></div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-extrabold text-[var(--foreground)]">
                      {evt.type === 'STATUS' && evt.toStatus
                        ? `Status changed to ${evt.toStatus.replace('_', ' ')}`
                        : evt.type === 'ASSIGNMENT'
                          ? 'Grievance assigned to department'
                          : evt.type === 'FEEDBACK'
                            ? `Citizen feedback: ${evt.rating ? `${evt.rating} Stars` : 'Submitted'}`
                            : 'Official update'}
                    </span>
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {new Date(evt.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {evt.body && (
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{evt.body}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Location & Meta */}
        <div className="space-y-6">
          {/* Location Card with Map */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <MapPin size={16} className="text-[var(--primary)]" /> Defect Location
            </h2>

            <DynamicStaticMap
              coordinates={{
                latitude: Number(complaint.latitude),
                longitude: Number(complaint.longitude),
              }}
              className="h-44 w-full"
            />

            <div className="space-y-1 text-xs">
              <strong className="text-[var(--foreground)] block">{complaint.address}</strong>
              <div className="font-mono text-[10px] text-[var(--text-muted)]">
                Lat: {Number(complaint.latitude).toFixed(5)} • Lng: {Number(complaint.longitude).toFixed(5)}
              </div>
            </div>
          </div>

          {/* Department Meta */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Buildings size={16} className="text-[var(--primary)]" /> Responsible Agency
            </h2>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-[var(--text-muted)] block text-[11px]">Category</span>
                <strong className="text-[var(--foreground)]">
                  {categoryMeta?.label || complaint.category}
                </strong>
              </div>

              <div>
                <span className="text-[var(--text-muted)] block text-[11px]">Department</span>
                <strong className="text-[var(--primary)]">
                  {complaint.department?.name || 'General Civic Administration'}
                </strong>
              </div>

              <div>
                <span className="text-[var(--text-muted)] block text-[11px]">Visibility</span>
                <span className="inline-flex items-center gap-1 text-[var(--text-secondary)] font-semibold">
                  <ShieldCheck size={14} className="text-[var(--primary)]" />
                  {complaint.isPublic ? 'Public Map (Opt-In)' : 'Private Grievance'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
