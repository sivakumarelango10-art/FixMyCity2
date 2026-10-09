'use client';

import React, { useState, useTransition } from 'react';
import {
  Play,
  CheckCircle,
  ChatCircleText,
  HandGrabbing,
  Spinner,
  WarningCircle,
} from '@phosphor-icons/react';
import {
  workerClaimTask,
  workerStartTask,
  workerAddNote,
  workerResolveTask,
} from '@/actions/worker-complaints';
import { EventVisibility } from '@prisma/client';

interface Props {
  complaintId: string;
  status: string;
  isAssignedToMe: boolean;
  isUnassigned: boolean;
}

export function TaskActionPanel({
  complaintId,
  status,
  isAssignedToMe,
  isUnassigned,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Note Modal
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteBody, setNoteBody] = useState('');
  const [noteVisibility, setNoteVisibility] = useState<EventVisibility>(EventVisibility.PUBLIC);

  // Resolve Modal
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionSummary, setResolutionSummary] = useState('');

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleClaim = () => {
    clearMessages();
    startTransition(async () => {
      const res = await workerClaimTask({ complaintId });
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to claim task');
      } else {
        setSuccessMsg('You have successfully claimed this task.');
        window.location.reload();
      }
    });
  };

  const handleStartWork = () => {
    clearMessages();
    startTransition(async () => {
      const res = await workerStartTask({ complaintId });
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to start task');
      } else {
        setSuccessMsg('Work status changed to IN PROGRESS.');
        window.location.reload();
      }
    });
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    startTransition(async () => {
      const res = await workerAddNote({
        complaintId,
        body: noteBody,
        visibility: noteVisibility,
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to add note');
      } else {
        setSuccessMsg('Note posted successfully.');
        setShowNoteModal(false);
        setNoteBody('');
        window.location.reload();
      }
    });
  };

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    startTransition(async () => {
      const res = await workerResolveTask({
        complaintId,
        resolutionSummary,
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to resolve task');
      } else {
        setSuccessMsg('Complaint marked as RESOLVED! Thank you for your service.');
        setShowResolveModal(false);
        setResolutionSummary('');
        window.location.reload();
      }
    });
  };

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <WarningCircle size={16} weight="fill" className="text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle size={16} weight="fill" className="text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {/* Claim button if unassigned */}
        {isUnassigned && (
          <button
            onClick={handleClaim}
            disabled={isPending}
            data-testid="worker-claim-btn"
            className="inline-flex items-center gap-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isPending ? <Spinner size={14} className="animate-spin" /> : <HandGrabbing size={16} weight="bold" />}
            Claim Task
          </button>
        )}

        {/* Start Work button */}
        {(isAssignedToMe || isUnassigned) && (status === 'ASSIGNED' || status === 'REOPENED') && (
          <button
            onClick={handleStartWork}
            disabled={isPending}
            data-testid="worker-start-btn"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-4 py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isPending ? <Spinner size={14} className="animate-spin" /> : <Play size={16} weight="bold" />}
            Start Work On Site
          </button>
        )}

        {/* In Progress Actions */}
        {isAssignedToMe && status === 'IN_PROGRESS' && (
          <>
            <button
              onClick={() => {
                clearMessages();
                setShowResolveModal(true);
              }}
              data-testid="worker-resolve-btn"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2.5 text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <CheckCircle size={16} weight="bold" />
              Mark Resolved
            </button>

            <button
              onClick={() => {
                clearMessages();
                setShowNoteModal(true);
              }}
              data-testid="worker-add-note-btn"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground)] px-4 py-2.5 text-xs font-bold transition-all cursor-pointer"
            >
              <ChatCircleText size={16} weight="bold" />
              Post Progress Note
            </button>
          </>
        )}

        {/* Can also add notes if already in progress or reopened */}
        {isAssignedToMe && status !== 'IN_PROGRESS' && status !== 'RESOLVED' && (
          <button
            onClick={() => {
              clearMessages();
              setShowNoteModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground)] px-3 py-2 text-xs font-bold transition-all cursor-pointer"
          >
            <ChatCircleText size={16} weight="bold" />
            Add Note
          </button>
        )}
      </div>

      {/* RESOLVE TASK MODAL */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            data-testid="resolve-modal"
            className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-black text-[var(--foreground)]">
                Record Field Resolution
              </h3>
              <button
                onClick={() => setShowResolveModal(false)}
                className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                  Resolution Summary * (Minimum 10 characters)
                </label>
                <textarea
                  required
                  rows={4}
                  data-testid="resolution-summary-input"
                  placeholder="Detail the work carried out on site (e.g. Asphalt patch applied, cold mix compacted, road surface levelled and debris cleared)..."
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2.5 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none leading-relaxed"
                />
                <span className="text-[10px] text-[var(--text-muted)] block mt-1">
                  This summary will be visible to the citizen and recorded in the municipal public audit log.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || resolutionSummary.trim().length < 10}
                  data-testid="submit-resolve-btn"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Spinner size={14} className="animate-spin" />}
                  Submit Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD NOTE MODAL */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            data-testid="worker-note-modal"
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-black text-[var(--foreground)]">Post Field Note</h3>
              <button
                onClick={() => setShowNoteModal(false)}
                className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleNoteSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                  Note Content *
                </label>
                <textarea
                  required
                  rows={3}
                  data-testid="worker-note-input"
                  placeholder="e.g. Field team arrived at location with asphalt roller..."
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                  Audience & Visibility
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 text-xs text-[var(--foreground)]">
                    <input
                      type="radio"
                      name="note-visibility"
                      value={EventVisibility.PUBLIC}
                      checked={noteVisibility === EventVisibility.PUBLIC}
                      onChange={() => setNoteVisibility(EventVisibility.PUBLIC)}
                    />
                    <span>
                      <strong>Public Timeline:</strong> Visible to reporting citizen and sends progress alert
                    </span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[var(--foreground)]">
                    <input
                      type="radio"
                      name="note-visibility"
                      value={EventVisibility.INTERNAL}
                      checked={noteVisibility === EventVisibility.INTERNAL}
                      onChange={() => setNoteVisibility(EventVisibility.INTERNAL)}
                    />
                    <span>
                      <strong>Internal Note:</strong> Visible only to municipal staff and administrators
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || noteBody.trim().length < 3}
                  data-testid="submit-worker-note-btn"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Spinner size={14} className="animate-spin" />}
                  Post Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
