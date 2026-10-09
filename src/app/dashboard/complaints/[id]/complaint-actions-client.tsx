'use client';

import React, { useState, useTransition } from 'react';
import { rateComplaintResolution, reopenComplaint } from '@/actions/complaints';
import { Star, ArrowCounterClockwise } from '@phosphor-icons/react';
import { toast } from 'sonner';

interface ComplaintActionsClientProps {
  complaintId: string;
  status: string;
  resolvedAt?: string | null;
  hasRatedThisVersion: boolean;
  resolutionVersion: number;
}

export function ComplaintActionsClient({
  complaintId,
  status,
  resolvedAt,
  hasRatedThisVersion,
  resolutionVersion: _resolutionVersion,
}: ComplaintActionsClientProps) {
  const [isPending, startTransition] = useTransition();

  // Rating state
  const [rating, setRating] = useState<number>(5);
  const [ratingComment, setRatingComment] = useState('');
  const [rated, setRated] = useState(hasRatedThisVersion);

  // Reopen state
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');

  if (status !== 'RESOLVED') {
    return null;
  }

  // Check 30-day window
  const isWithin30Days = resolvedAt
    ? (Date.now() - new Date(resolvedAt).getTime()) / (1000 * 60 * 60 * 24) <= 30
    : false;

  const handleRate = () => {
    startTransition(async () => {
      try {
        await rateComplaintResolution(complaintId, rating, ratingComment.trim() || undefined);
        setRated(true);
        toast.success('Thank you for rating municipal resolution!');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to submit rating';
        toast.error(msg);
      }
    });
  };

  const handleReopen = () => {
    if (reopenReason.trim().length < 10) {
      toast.error('Reopening reason must be at least 10 characters.');
      return;
    }

    startTransition(async () => {
      try {
        await reopenComplaint(complaintId, reopenReason.trim());
        setShowReopenModal(false);
        toast.success('Complaint reopened and routed back to municipal operations.');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to reopen complaint';
        toast.error(msg);
      }
    });
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5 shadow-xs">
      <div className="space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--success)]">
          Resolution Feedback & Citizen Actions
        </span>
        <h3 className="text-base font-black text-[var(--foreground)]">
          Is the problem satisfactorily resolved?
        </h3>
      </div>

      {/* Rating Section */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-4 space-y-3">
        <span className="text-xs font-bold text-[var(--foreground)] block">
          Rate Municipal Resolution Quality
        </span>

        {rated ? (
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--success)]">
            <span>Feedback recorded for this resolution cycle. Thank you!</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 text-amber-500 hover:scale-110 transition-transform"
                >
                  <Star size={24} weight={star <= rating ? 'fill' : 'regular'} />
                </button>
              ))}
              <span className="text-xs font-bold text-[var(--text-muted)] ml-2">
                {rating} out of 5 stars
              </span>
            </div>

            <input
              type="text"
              value={ratingComment}
              onChange={(e) => setRatingComment(e.target.value)}
              placeholder="Optional feedback comment on the repair..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--foreground)]"
            />

            <button
              type="button"
              disabled={isPending}
              onClick={handleRate}
              className="rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50"
            >
              {isPending ? 'Submitting...' : 'Submit Resolution Rating'}
            </button>
          </div>
        )}
      </div>

      {/* Reopen Section */}
      {isWithin30Days && (
        <div className="pt-2">
          {!showReopenModal ? (
            <button
              type="button"
              onClick={() => setShowReopenModal(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--error)]/30 text-[var(--error)] bg-[var(--error-light)] px-4 py-2.5 text-xs font-bold hover:bg-[var(--error)] hover:text-white transition-all shadow-xs"
            >
              <ArrowCounterClockwise size={15} weight="bold" />
              Not Satisfied? Reopen Complaint (Within 30 Days)
            </button>
          ) : (
            <div className="rounded-xl border border-[var(--error)]/30 bg-[var(--error-light)] p-4 space-y-3">
              <span className="text-xs font-black text-[var(--error)] block">
                Provide Reason for Reopening Grievance
              </span>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Explain why the repair is incomplete, has deteriorated again, or requires re-inspection by field workers.
              </p>
              <textarea
                rows={3}
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="e.g. Road crater was only temporarily patched with loose stones and has washed away with rain..."
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--foreground)] resize-none"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isPending || reopenReason.trim().length < 10}
                  onClick={handleReopen}
                  className="rounded-xl bg-[var(--error)] text-white px-4 py-2 text-xs font-bold shadow-xs hover:opacity-90 disabled:opacity-50"
                >
                  {isPending ? 'Reopening...' : 'Confirm Reopen'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReopenModal(false)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--foreground)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
