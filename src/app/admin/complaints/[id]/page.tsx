import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getSignedPhotoUrl } from '@/lib/storage';
import { CATEGORY_DEFINITIONS } from '@/lib/domain/categories';
import { DynamicStaticMap } from '@/components/maps/dynamic-static-map';
import { AdminTriageClient } from './admin-triage-client';
import { ComplaintStatus, Priority, EventVisibility } from '@prisma/client';
import {
  ArrowLeft,
  CalendarBlank,
  MapPin,
  Sparkle,
  Buildings,
  User,
  ClockAfternoon,
  Camera,
  ShieldCheck,
  LockKey,
} from '@phosphor-icons/react/dist/ssr';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminComplaintDetailPage({ params }: PageProps) {
  await requireRole('ADMIN');
  const { id } = await params;

  const [complaint, departments] = await Promise.all([
    prisma.complaint.findUnique({
      where: { id },
      include: {
        department: true,
        assignedWorker: true,
        citizen: true,
        photos: true,
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    }),
    prisma.department.findMany({
      where: { isActive: true },
      include: {
        profiles: {
          where: { role: 'WORKER', isActive: true },
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!complaint) {
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

  const priorityBadges: Record<Priority, { label: string; bg: string; text: string }> = {
    LOW: { label: 'Low', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300' },
    MEDIUM: { label: 'Medium', bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-800 dark:text-blue-300' },
    HIGH: { label: 'High', bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-800 dark:text-amber-300' },
    CRITICAL: { label: 'Critical', bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-800 dark:text-rose-300' },
  };

  const sBadge = statusBadges[complaint.status] || statusBadges.SUBMITTED;
  const pBadge = priorityBadges[complaint.priority] || priorityBadges.MEDIUM;
  const _catMeta = CATEGORY_DEFINITIONS[complaint.category];

  const deptOptions = departments.map((d) => ({
    id: d.id,
    code: d.code,
    name: d.name,
    workers: d.profiles,
  }));

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Back button */}
      <div>
        <Link
          href="/admin/complaints"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-teal-400 hover:underline"
        >
          <ArrowLeft size={14} weight="bold" /> Back to Dispatch Queue
        </Link>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-black text-[var(--primary)]">
              {complaint.trackingNumber}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${sBadge.bg} ${sBadge.text}`}>
              {sBadge.label}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${pBadge.bg} ${pBadge.text}`}>
              Priority: {pBadge.label}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--foreground)] tracking-tight mt-1">
            {complaint.title}
          </h1>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <CalendarBlank size={14} />
          <span>
            Logged: {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>

      {/* Operations Triage Component */}
      <AdminTriageClient
        complaintId={complaint.id}
        currentStatus={complaint.status}
        currentCategory={complaint.category}
        currentPriority={complaint.priority}
        currentDepartmentId={complaint.departmentId}
        currentAssignedWorkerId={complaint.assignedWorkerId}
        departments={deptOptions}
      />

      {/* 2-Column Grid: Details vs Metadata & Location */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Details, AI, Photos, Events */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-2 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Grievance Narrative
            </h3>
            <p className="text-xs text-[var(--foreground)] whitespace-pre-line leading-relaxed">
              {complaint.description}
            </p>
          </div>

          {/* AI Advisory Routing Box */}
          {complaint.aiExplanation && (
            <div className="rounded-2xl border border-teal-200 bg-teal-50/70 dark:border-teal-900/60 dark:bg-teal-950/30 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkle size={18} weight="fill" className="text-teal-700 dark:text-teal-300" />
                  <span className="text-xs font-black text-teal-950 dark:text-teal-200">
                    AI Triage Recommendation ({complaint.aiSource || 'RULES'})
                  </span>
                </div>
                <span className="rounded bg-teal-200/60 dark:bg-teal-900 px-2 py-0.5 text-[9px] font-black text-teal-800 dark:text-teal-200">
                  AI Suggestion: {complaint.aiPriority}
                </span>
              </div>
              <p className="text-xs text-teal-900 dark:text-teal-300 leading-relaxed">
                {complaint.aiExplanation}
              </p>
            </div>
          )}

          {/* Evidence Photos */}
          {evidencePhotos.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                <Camera size={16} /> Citizen Evidence Photos ({evidencePhotos.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {evidencePhotos.map((photo, idx) => (
                  <div key={photo.id} className="aspect-video rounded-xl overflow-hidden border border-[var(--border)] bg-black/5">
                    {photo.signedUrl ? (
                      <img
                        src={photo.signedUrl}
                        alt={`Evidence ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-[var(--text-muted)]">
                        Expired
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolution Photos (if resolved) */}
          {resolutionPhotos.length > 0 && (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50/60 dark:border-emerald-900/60 dark:bg-emerald-950/30 p-6 space-y-4 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                Field Repair Evidence Photos ({resolutionPhotos.length})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {resolutionPhotos.map((photo, idx) => (
                  <div key={photo.id} className="aspect-video rounded-xl overflow-hidden border border-emerald-300/60 bg-black/5">
                    {photo.signedUrl ? (
                      <img
                        src={photo.signedUrl}
                        alt={`Resolution ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complete Event History (Including INTERNAL staff notes) */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <ClockAfternoon size={16} /> Complete Audit & Event History (Public & Internal)
            </h3>

            <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--border)]">
              {complaint.events.map((evt) => (
                <div key={evt.id} className="relative pl-8 space-y-1">
                  <div
                    className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-xs ${
                      evt.visibility === EventVisibility.INTERNAL ? 'bg-amber-600' : 'bg-[var(--primary)]'
                    }`}
                  ></div>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-[var(--foreground)]">
                        {evt.type === 'STATUS' && evt.toStatus
                          ? `Status: ${evt.toStatus.replace('_', ' ')}`
                          : evt.type === 'ASSIGNMENT'
                            ? 'Department Assignment'
                            : evt.type === 'FEEDBACK'
                              ? `Citizen Rating: ${evt.rating}/5 Stars`
                              : 'Administrative Note'}
                      </span>
                      {evt.visibility === EventVisibility.INTERNAL && (
                        <span className="flex items-center gap-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 px-1.5 py-0.2 text-[9px] font-bold">
                          <LockKey size={10} weight="bold" /> Internal Staff
                        </span>
                      )}
                    </div>

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
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5 bg-[var(--surface-hover)] p-2 rounded-lg">
                      {evt.body}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Citizen Info, Location, Assignment */}
        <div className="space-y-6">
          {/* Defect Location Map */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <MapPin size={16} className="text-[var(--primary)]" /> Location Coordinates
            </h3>

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
                {Number(complaint.latitude).toFixed(5)}, {Number(complaint.longitude).toFixed(5)}
              </div>
            </div>
          </div>

          {/* Citizen Reporter Card */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3 shadow-xs text-xs">
            <h3 className="font-bold uppercase tracking-wider text-[var(--text-muted)] text-[10px] flex items-center gap-1.5">
              <User size={14} className="text-[var(--primary)]" /> Citizen Contact
            </h3>
            <div className="space-y-1">
              <strong className="text-sm font-black text-[var(--foreground)] block">
                {complaint.citizen.fullName}
              </strong>
              <span className="text-[var(--text-secondary)] block">{complaint.citizen.email}</span>
              {complaint.citizen.phone && (
                <span className="text-[var(--text-secondary)] block">Phone: {complaint.citizen.phone}</span>
              )}
            </div>
          </div>

          {/* Department & Staff Assignment Card */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3 shadow-xs text-xs">
            <h3 className="font-bold uppercase tracking-wider text-[var(--text-muted)] text-[10px] flex items-center gap-1.5">
              <Buildings size={14} className="text-[var(--primary)]" /> Current Assignment
            </h3>

            <div>
              <span className="text-[var(--text-muted)] block text-[10px]">Department</span>
              <strong className="text-[var(--primary)]">
                {complaint.department?.name || 'Unassigned'}
              </strong>
            </div>

            <div>
              <span className="text-[var(--text-muted)] block text-[10px]">Assigned Worker</span>
              <strong className="text-[var(--foreground)]">
                {complaint.assignedWorker?.fullName || 'Shared Department Queue'}
              </strong>
            </div>

            <div>
              <span className="text-[var(--text-muted)] block text-[10px]">Public Visibility</span>
              <span className="inline-flex items-center gap-1 text-[var(--text-secondary)] font-semibold mt-0.5">
                <ShieldCheck size={14} className="text-[var(--primary)]" />
                {complaint.isPublic ? 'Opted-In to Public Map' : 'Private (Owner Only)'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
