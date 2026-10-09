import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  MapPin,
  Clock,
  ArrowLeft,
  CheckCircle,
  FileText,
  ShieldCheck,
  Lock,
} from '@phosphor-icons/react/dist/ssr';
import { DynamicStaticMap } from '@/components/maps/dynamic-static-map';
import { TaskActionPanel } from './task-action-panel';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function WorkerTaskDetailPage({ params }: PageProps) {
  const worker = await requireRole('WORKER');
  const { id } = await params;

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: {
      citizen: { select: { fullName: true, phone: true } },
      department: true,
      assignedWorker: { select: { id: true, fullName: true } },
      photos: true,
      events: {
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!complaint) {
    notFound();
  }

  // Enforce department boundary check
  if (complaint.departmentId !== worker.departmentId) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
          <Lock size={32} weight="bold" />
        </div>
        <h2 className="text-xl font-black text-[var(--foreground)]">Department Access Restricted</h2>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          This task is assigned to <strong>{complaint.department?.name || 'another department'}</strong>.
          Under ward jurisdiction security policies, workers can only view and manage tasks in their assigned department ({worker.department?.name}).
        </p>
        <Link
          href="/worker"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:underline pt-2"
        >
          <ArrowLeft size={14} weight="bold" /> Return to My Work Console
        </Link>
      </div>
    );
  }

  const isAssignedToMe = complaint.assignedWorkerId === worker.id;
  const isUnassigned = complaint.assignedWorkerId === null;
  const isAssignedToOther = !!complaint.assignedWorkerId && complaint.assignedWorkerId !== worker.id;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/worker/my-tasks"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
        >
          <ArrowLeft size={16} weight="bold" /> Back to My Tasks
        </Link>

        <span className="font-mono text-xs font-bold text-[var(--primary)]">
          {complaint.trackingNumber}
        </span>
      </div>

      {/* Main Task Header Card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-black uppercase text-[var(--primary)] bg-[var(--surface-hover)] border border-[var(--border)] px-2.5 py-0.5 rounded-md">
                {complaint.category.replace('_', ' ')}
              </span>
              <span className="rounded bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2.5 py-0.5 text-[10px] font-black uppercase">
                {complaint.priority} PRIORITY
              </span>
              <span className="rounded bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 px-2.5 py-0.5 text-[10px] font-black uppercase">
                {complaint.status.replace('_', ' ')}
              </span>
            </div>

            <h1 className="text-2xl font-black text-[var(--foreground)]">{complaint.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {complaint.address}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={14} /> Created{' '}
                {new Date(complaint.createdAt).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Assignment Status Notice */}
          <div className="text-right text-xs">
            {isAssignedToMe ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
                <CheckCircle size={14} weight="fill" /> Assigned to You
              </span>
            ) : isUnassigned ? (
              <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-900/60">
                Unclaimed Queue Item
              </span>
            ) : isAssignedToOther ? (
              <span className="inline-flex items-center gap-1 text-amber-700 font-bold bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                Officer: {complaint.assignedWorker?.fullName}
              </span>
            ) : null}
          </div>
        </div>

        {/* Action Panel for Starting, Claiming, Resolving */}
        <div className="pt-4 border-t border-[var(--border)]">
          <TaskActionPanel
            complaintId={complaint.id}
            status={complaint.status}
            isAssignedToMe={isAssignedToMe}
            isUnassigned={isUnassigned}
          />
        </div>
      </div>

      {/* Description & Citizen Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-3 shadow-xs">
            <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
              <FileText size={16} /> Grievance Description
            </h2>
            <p className="text-sm text-[var(--foreground)] leading-relaxed whitespace-pre-wrap">
              {complaint.description}
            </p>
          </div>

          {/* Map Location */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-3 shadow-xs">
            <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
              <MapPin size={16} /> Incident Location
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">{complaint.address}</p>
            <div className="rounded-xl overflow-hidden border border-[var(--border)] h-[240px]">
              <DynamicStaticMap
                coordinates={{
                  latitude: Number(complaint.latitude),
                  longitude: Number(complaint.longitude),
                }}
              />
            </div>
          </div>

          {/* Timeline & Notes */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 shadow-xs">
            <h2 className="text-sm font-black uppercase tracking-wider text-[var(--text-muted)]">
              Operational History & Field Notes ({complaint.events.length})
            </h2>

            <div className="space-y-3 divide-y divide-[var(--border)]">
              {complaint.events.map((ev) => (
                <div key={ev.id} className="pt-3 first:pt-0 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--foreground)]">
                        {ev.type === 'STATUS'
                          ? `Status: ${ev.toStatus}`
                          : ev.type === 'ASSIGNMENT'
                            ? 'Assignment'
                            : 'Field Note'}
                      </span>
                      {ev.visibility === 'INTERNAL' && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
                          Staff Internal
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)]">
                      {new Date(ev.createdAt).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  {ev.body && (
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{ev.body}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Reporter Details & Metadata */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-3 shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
              Reporting Citizen
            </h3>
            <div className="space-y-1 text-xs">
              <strong className="block text-sm text-[var(--foreground)]">
                {complaint.citizen.fullName}
              </strong>
              {complaint.citizen.phone && (
                <span className="text-[var(--text-muted)] block">Contact: {complaint.citizen.phone}</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-3 shadow-xs">
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--text-muted)]">
              Ward Jurisdiction
            </h3>
            <div className="space-y-1 text-xs">
              <strong className="block text-sm text-[var(--foreground)]">
                {complaint.department?.name}
              </strong>
              <span className="text-[var(--text-muted)] block">Code: {complaint.department?.code}</span>
            </div>
          </div>

          {complaint.resolutionSummary && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20 p-6 space-y-2 shadow-xs">
              <span className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                <ShieldCheck size={16} weight="bold" /> Resolution Recorded
              </span>
              <p className="text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed">
                {complaint.resolutionSummary}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
