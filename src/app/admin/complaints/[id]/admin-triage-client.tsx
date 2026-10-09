'use client';

import React, { useState, useTransition } from 'react';
import { adminAssignComplaint, adminReviewComplaint, adminRejectComplaint, adminAddNote } from '@/actions/admin-complaints';
import { ComplaintCategory, Priority, EventVisibility, ComplaintStatus } from '@/types/enums';
import { CATEGORY_OPTIONS } from '@/lib/domain/categories';
import { X, NotePencil, ArrowRight, Buildings, User } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface DepartmentOption {
  id: string;
  code: string;
  name: string;
  workers: { id: string; fullName: string; email: string }[];
}

interface AdminTriageClientProps {
  complaintId: string;
  currentStatus: ComplaintStatus;
  currentCategory: ComplaintCategory;
  currentPriority: Priority;
  currentDepartmentId: string | null;
  currentAssignedWorkerId: string | null;
  departments: DepartmentOption[];
}

export function AdminTriageClient({
  complaintId,
  currentStatus,
  currentCategory,
  currentPriority,
  currentDepartmentId,
  currentAssignedWorkerId,
  departments,
}: AdminTriageClientProps) {
  const [isPending, startTransition] = useTransition();

  // Assignment state
  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    currentDepartmentId || (departments[0]?.id || '')
  );
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(
    currentAssignedWorkerId || ''
  );
  const [categoryOverride, setCategoryOverride] = useState<ComplaintCategory>(currentCategory);
  const [priorityOverride, setPriorityOverride] = useState<Priority>(currentPriority);
  const [assignNote, setAssignNote] = useState('');

  // Rejection state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Note state
  const [noteBody, setNoteBody] = useState('');
  const [noteVisibility, setNoteVisibility] = useState<EventVisibility>(EventVisibility.INTERNAL);

  // Available workers for currently selected department
  const activeDept = departments.find((d) => d.id === selectedDeptId);
  const availableWorkers = activeDept?.workers || [];

  const handleAssign = () => {
    if (!selectedDeptId) {
      toast.error('Please choose a municipal department.');
      return;
    }

    startTransition(async () => {
      try {
        await adminAssignComplaint({
          complaintId,
          departmentId: selectedDeptId,
          assignedWorkerId: selectedWorkerId || null,
          categoryOverride,
          priorityOverride,
          note: assignNote.trim() || undefined,
        });
        toast.success('Complaint successfully assigned and dispatched!');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Assignment failed';
        toast.error(msg);
      }
    });
  };

  const handleReview = () => {
    startTransition(async () => {
      try {
        await adminReviewComplaint(complaintId);
        toast.success('Complaint marked as Under Review.');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Review action failed';
        toast.error(msg);
      }
    });
  };

  const handleReject = () => {
    if (rejectReason.trim().length < 3) {
      toast.error('Rejection reason must be at least 3 characters.');
      return;
    }

    startTransition(async () => {
      try {
        await adminRejectComplaint(complaintId, rejectReason.trim());
        setShowRejectModal(false);
        toast.success('Complaint rejected and citizen notified.');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Rejection failed';
        toast.error(msg);
      }
    });
  };

  const handleAddNote = () => {
    if (noteBody.trim().length < 2) {
      toast.error('Note text must be at least 2 characters.');
      return;
    }

    startTransition(async () => {
      try {
        await adminAddNote(complaintId, noteBody.trim(), noteVisibility);
        setNoteBody('');
        toast.success(`${noteVisibility} note posted.`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Note failed';
        toast.error(msg);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Quick Action Header for Status Transitions */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--primary)]">
              Operations Dispatch Desk
            </span>
            <h3 className="text-base font-black text-[var(--foreground)]">
              Assign & Triage Grievance
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {currentStatus === 'SUBMITTED' && (
              <button
                type="button"
                disabled={isPending}
                onClick={handleReview}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-1.5 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--border)] transition-all"
              >
                Mark Under Review
              </button>
            )}

            {currentStatus !== 'REJECTED' && currentStatus !== 'RESOLVED' && (
              <button
                type="button"
                onClick={() => setShowRejectModal(true)}
                className="rounded-xl border border-rose-300 text-rose-700 dark:border-rose-900/60 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 text-xs font-bold hover:bg-rose-600 hover:text-white transition-all"
              >
                Reject Grievance
              </button>
            )}
          </div>
        </div>

        {/* Assignment Form Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Target Department */}
          <div>
            <label className="block text-xs font-bold text-[var(--foreground)] mb-1 flex items-center gap-1.5">
              <Buildings size={14} className="text-[var(--primary)]" />
              Assign Department *
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => {
                setSelectedDeptId(e.target.value);
                setSelectedWorkerId('');
              }}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)]"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Optional Individual Worker from Selected Dept */}
          <div>
            <label className="block text-xs font-bold text-[var(--foreground)] mb-1 flex items-center gap-1.5">
              <User size={14} className="text-[var(--primary)]" />
              Direct Worker Assignment (Optional)
            </label>
            <select
              value={selectedWorkerId}
              onChange={(e) => setSelectedWorkerId(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)]"
            >
              <option value="">Leave in shared department queue</option>
              {availableWorkers.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.fullName} ({w.email})
                </option>
              ))}
            </select>
          </div>

          {/* Category Override */}
          <div>
            <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
              Category Override
            </label>
            <select
              value={categoryOverride}
              onChange={(e) => setCategoryOverride(e.target.value as ComplaintCategory)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)]"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Override */}
          <div>
            <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
              Priority Override
            </label>
            <select
              value={priorityOverride}
              onChange={(e) => setPriorityOverride(e.target.value as Priority)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)]"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        {/* Note / Instructions to Staff */}
        <div>
          <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
            Dispatch Instructions / Note
          </label>
          <input
            type="text"
            value={assignNote}
            onChange={(e) => setAssignNote(e.target.value)}
            placeholder="e.g. Inspect pothole and clear debris before evening peak traffic..."
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--foreground)]"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={isPending}
            onClick={handleAssign}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50"
          >
            {isPending ? 'Dispatching...' : 'Dispatch / Assign Grievance'}
            <ArrowRight size={14} weight="bold" />
          </button>
        </div>
      </div>

      {/* Internal / Public Note Form */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-[var(--foreground)] flex items-center gap-1.5">
            <NotePencil size={16} className="text-[var(--primary)]" />
            Post Administrative Note
          </span>

          {/* Visibility toggle: PUBLIC vs INTERNAL */}
          <div className="flex items-center gap-3 text-xs font-bold">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="noteVisibility"
                checked={noteVisibility === EventVisibility.INTERNAL}
                onChange={() => setNoteVisibility(EventVisibility.INTERNAL)}
                className="text-[var(--primary)]"
              />
              <span className="text-amber-800 dark:text-amber-300">Internal (Staff Only)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="noteVisibility"
                checked={noteVisibility === EventVisibility.PUBLIC}
                onChange={() => setNoteVisibility(EventVisibility.PUBLIC)}
                className="text-[var(--primary)]"
              />
              <span className="text-[var(--primary)]">Public (Citizen Sees)</span>
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <textarea
            id="admin-note-textarea"
            data-testid="admin-note-textarea"
            rows={2}
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            placeholder={
              noteVisibility === EventVisibility.INTERNAL
                ? 'Write confidential staff notes, materials required, inspector initials...'
                : 'Write official citizen progress update displayed in the public tracking timeline...'
            }
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--foreground)] resize-none"
          />

          <div className="flex justify-end">
            <button
              type="button"
              data-testid="post-note-btn"
              disabled={isPending || noteBody.trim().length < 2}
              onClick={handleAddNote}
              className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] hover:bg-[var(--primary)] hover:text-white px-4 py-2 text-xs font-bold text-[var(--foreground)] transition-all shadow-2xs disabled:opacity-50"
            >
              Post {noteVisibility} Note
            </button>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-black text-rose-700 dark:text-rose-400">
                Reject Civic Grievance
              </h4>
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:bg-[var(--surface-hover)]"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)]">
              Specify the official municipal rejection rationale. This explanation will be delivered to the citizen.
            </p>

            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Duplicate of active issue FMC-2026-000014 on same stretch; or private property outside municipal jurisdiction."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--foreground)] resize-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-bold text-[var(--foreground)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending || rejectReason.trim().length < 3}
                onClick={handleReject}
                className="rounded-xl bg-rose-600 text-white px-4 py-2 text-xs font-bold shadow-xs hover:bg-rose-700 disabled:opacity-50"
              >
                {isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
