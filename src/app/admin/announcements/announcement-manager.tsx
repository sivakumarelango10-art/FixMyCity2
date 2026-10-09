'use client';

import React, { useState, useTransition } from 'react';
import { AnnouncementCategory, AnnouncementStatus } from '@/types/enums';
import {
  Plus,
  PencilSimple,
  Trash,
  Megaphone,
  CheckCircle,
  Clock,
  PushPin,
  WarningCircle,
  Spinner,
} from '@phosphor-icons/react';
import {
  adminCreateAnnouncement,
  adminUpdateAnnouncement,
  adminDeleteAnnouncement,
} from '@/actions/admin-announcements';

interface AnnouncementItem {
  id: string;
  title: string;
  summary: string | null;
  body: string;
  category: AnnouncementCategory;
  status: AnnouncementStatus;
  pinned: boolean;
  publishedAt: Date | string | null;
  createdAt: Date | string;
  author: {
    fullName: string;
  };
}

interface Props {
  initialAnnouncements: AnnouncementItem[];
}

export function AnnouncementManager({ initialAnnouncements }: Props) {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  void announcements;
  void setAnnouncements;
  const [isPending, startTransition] = useTransition();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState<AnnouncementItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<AnnouncementItem | null>(null);

  // Form State
  const [form, setForm] = useState<{
    title: string;
    summary: string;
    body: string;
    category: AnnouncementCategory;
    status: AnnouncementStatus;
    pinned: boolean;
  }>({
    title: '',
    summary: '',
    body: '',
    category: AnnouncementCategory.GENERAL,
    status: AnnouncementStatus.PUBLISHED,
    pinned: false,
  });

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const openAdd = () => {
    clearMessages();
    setForm({
      title: '',
      summary: '',
      body: '',
      category: AnnouncementCategory.GENERAL,
      status: AnnouncementStatus.PUBLISHED,
      pinned: false,
    });
    setShowAddModal(true);
  };

  const openEdit = (a: AnnouncementItem) => {
    clearMessages();
    setForm({
      title: a.title,
      summary: a.summary || '',
      body: a.body,
      category: a.category,
      status: a.status,
      pinned: a.pinned,
    });
    setEditItem(a);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    startTransition(async () => {
      const res = await adminCreateAnnouncement(form);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create announcement');
      } else {
        setSuccessMsg(`Announcement "${form.title}" published!`);
        setShowAddModal(false);
        window.location.reload();
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    clearMessages();
    startTransition(async () => {
      const res = await adminUpdateAnnouncement({
        id: editItem.id,
        ...form,
      });
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to update announcement');
      } else {
        setSuccessMsg(`Announcement "${form.title}" updated!`);
        setEditItem(null);
        window.location.reload();
      }
    });
  };

  const handleDeleteSubmit = () => {
    if (!deleteItem) return;
    clearMessages();
    startTransition(async () => {
      const res = await adminDeleteAnnouncement(deleteItem.id);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to delete announcement');
      } else {
        setSuccessMsg(`Announcement "${deleteItem.title}" deleted.`);
        setDeleteItem(null);
        window.location.reload();
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--text-secondary)]">
          Manage official city alerts, advisories, maintenance schedules, and public notices.
        </p>
        <button
          onClick={openAdd}
          data-testid="add-announcement-btn"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
        >
          <Plus size={16} weight="bold" />
          Create Announcement
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <WarningCircle size={18} weight="fill" className="text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle size={18} weight="fill" className="text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="space-y-4">
        {initialAnnouncements.map((a) => (
          <div
            key={a.id}
            data-testid={`announcement-item-${a.id}`}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xs flex flex-col sm:flex-row sm:items-start justify-between gap-4"
          >
            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {a.pinned && (
                  <span className="flex items-center gap-1 rounded bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 px-2 py-0.5 text-[10px] font-black uppercase">
                    <PushPin size={12} weight="fill" /> PINNED
                  </span>
                )}
                <span className="rounded bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 px-2 py-0.5 text-[10px] font-black uppercase">
                  {a.category.replace('_', ' ')}
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
                    a.status === 'PUBLISHED'
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : a.status === 'DRAFT'
                        ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        : 'bg-rose-50 text-rose-800'
                  }`}
                >
                  {a.status}
                </span>
              </div>

              <h3 className="text-base font-black text-[var(--foreground)]">{a.title}</h3>

              {a.summary && (
                <p className="text-xs font-semibold text-[var(--text-secondary)]">{a.summary}</p>
              )}

              <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed whitespace-pre-wrap">
                {a.body}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-[11px] text-[var(--text-muted)] pt-1">
                <span>By {a.author.fullName}</span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />{' '}
                  {new Date(a.createdAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openEdit(a)}
                data-testid={`edit-announcement-${a.id}`}
                className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] px-3 py-1.5 text-xs font-bold text-[var(--foreground)] transition-colors cursor-pointer"
              >
                <PencilSimple size={13} weight="bold" />
                Edit
              </button>
              <button
                onClick={() => setDeleteItem(a)}
                data-testid={`delete-announcement-${a.id}`}
                className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-300 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer"
              >
                <Trash size={13} weight="bold" />
                Delete
              </button>
            </div>
          </div>
        ))}

        {initialAnnouncements.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
            <Megaphone size={32} className="mx-auto text-[var(--text-muted)] mb-2" />
            <p className="text-xs text-[var(--text-muted)]">No city announcements published yet.</p>
          </div>
        )}
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-black text-[var(--foreground)]">New City Announcement</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Water Pipeline Maintenance in Ward 4"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as AnnouncementCategory })
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                  >
                    {Object.values(AnnouncementCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                    Publication Status *
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as AnnouncementStatus })
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                  >
                    <option value={AnnouncementStatus.PUBLISHED}>Published (Live)</option>
                    <option value={AnnouncementStatus.DRAFT}>Draft (Internal Only)</option>
                    <option value={AnnouncementStatus.ARCHIVED}>Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                  Summary (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Brief one-line overview..."
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                  Full Announcement Content *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Comprehensive notice details, affected areas, advisory instructions..."
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ann-pinned"
                  checked={form.pinned}
                  onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                  className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <label htmlFor="ann-pinned" className="text-xs font-semibold text-[var(--foreground)]">
                  Pin to Top of City Feed
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Spinner size={14} className="animate-spin" />}
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-black text-[var(--foreground)]">Edit Announcement</h3>
              <button
                onClick={() => setEditItem(null)}
                className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                    Category *
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as AnnouncementCategory })
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                  >
                    {Object.values(AnnouncementCategory).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                    Publication Status *
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value as AnnouncementStatus })
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                  >
                    <option value={AnnouncementStatus.PUBLISHED}>Published (Live)</option>
                    <option value={AnnouncementStatus.DRAFT}>Draft (Internal Only)</option>
                    <option value={AnnouncementStatus.ARCHIVED}>Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">Summary</label>
                <input
                  type="text"
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">Content *</label>
                <textarea
                  required
                  rows={4}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-ann-pinned"
                  checked={form.pinned}
                  onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
                  className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <label htmlFor="edit-ann-pinned" className="text-xs font-semibold text-[var(--foreground)]">
                  Pin to Top
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setEditItem(null)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Spinner size={14} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-[var(--surface)] p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <WarningCircle size={24} weight="fill" />
              <h3 className="text-base font-black text-[var(--foreground)]">Delete Announcement</h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Are you sure you want to delete <strong>{deleteItem.title}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setDeleteItem(null)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isPending && <Spinner size={14} className="animate-spin" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
