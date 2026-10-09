'use client';

import React, { useState, useTransition } from 'react';
import {
  Plus,
  PencilSimple,
  Trash,
  CheckCircle,
  XCircle,
  Envelope,
  WarningCircle,
  Spinner,
} from '@phosphor-icons/react';
import {
  adminCreateDepartment,
  adminUpdateDepartment,
  adminDeleteDepartment,
  adminToggleDepartmentActive,
} from '@/actions/admin-departments';

interface DepartmentData {
  id: string;
  code: string;
  name: string;
  description: string;
  contactEmail: string | null;
  isActive: boolean;
  _count: {
    profiles: number;
    complaints: number;
  };
}

interface Props {
  initialDepartments: DepartmentData[];
}

export function DepartmentManager({ initialDepartments }: Props) {
  const [departments, setDepartments] = useState<DepartmentData[]>(initialDepartments);
  void departments; // suppress unused state variable warning if updated via router
  void setDepartments;
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editDept, setEditDept] = useState<DepartmentData | null>(null);
  const [deleteDept, setDeleteDept] = useState<DepartmentData | null>(null);

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    contactEmail: '',
    isActive: true,
  });

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const openAdd = () => {
    clearMessages();
    setFormData({
      name: '',
      code: '',
      description: '',
      contactEmail: '',
      isActive: true,
    });
    setShowAddModal(true);
  };

  const openEdit = (dept: DepartmentData) => {
    clearMessages();
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description,
      contactEmail: dept.contactEmail || '',
      isActive: dept.isActive,
    });
    setEditDept(dept);
  };

  const openDelete = (dept: DepartmentData) => {
    clearMessages();
    setDeleteDept(dept);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    startTransition(async () => {
      const res = await adminCreateDepartment({
        name: formData.name,
        code: formData.code.toUpperCase().trim(),
        description: formData.description,
        contactEmail: formData.contactEmail || undefined,
        isActive: formData.isActive,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create department');
      } else {
        setSuccessMsg(`Department "${formData.name}" added successfully!`);
        setShowAddModal(false);
        // Refresh page state
        window.location.reload();
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDept) return;
    clearMessages();

    startTransition(async () => {
      const res = await adminUpdateDepartment({
        id: editDept.id,
        name: formData.name,
        code: formData.code.toUpperCase().trim(),
        description: formData.description,
        contactEmail: formData.contactEmail || undefined,
        isActive: formData.isActive,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to update department');
      } else {
        setSuccessMsg(`Department "${formData.name}" updated successfully!`);
        setEditDept(null);
        window.location.reload();
      }
    });
  };

  const handleDeleteSubmit = () => {
    if (!deleteDept) return;
    clearMessages();

    startTransition(async () => {
      const res = await adminDeleteDepartment(deleteDept.id);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to delete department');
      } else {
        setSuccessMsg(`Department "${deleteDept.name}" deleted successfully!`);
        setDeleteDept(null);
        window.location.reload();
      }
    });
  };

  const handleToggleActive = (dept: DepartmentData) => {
    clearMessages();
    startTransition(async () => {
      const res = await adminToggleDepartmentActive(dept.id, !dept.isActive);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to toggle status');
      } else {
        setSuccessMsg(`Department status updated to ${!dept.isActive ? 'Active' : 'Inactive'}.`);
        window.location.reload();
      }
    });
  };

  const filtered = initialDepartments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.code.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search departments by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
          />
        </div>

        <button
          onClick={openAdd}
          data-testid="add-department-btn"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
        >
          <Plus size={16} weight="bold" />
          Add Department
        </button>
      </div>

      {/* Status Messages */}
      {errorMsg && (
        <div
          data-testid="dept-error-banner"
          className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
        >
          <WarningCircle size={18} weight="fill" className="text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          data-testid="dept-success-banner"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          <CheckCircle size={18} weight="fill" className="text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid of Departments */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((dept) => (
          <div
            key={dept.id}
            data-testid={`department-card-${dept.code}`}
            className={`rounded-2xl border ${
              dept.isActive ? 'border-[var(--border)]' : 'border-rose-200 dark:border-rose-900/40 bg-rose-50/20'
            } bg-[var(--surface)] p-6 space-y-4 shadow-xs flex flex-col justify-between transition-all`}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black uppercase text-[var(--primary)] bg-[var(--surface-hover)] border border-[var(--border)] px-2.5 py-0.5 rounded-md">
                  {dept.code}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(dept)}
                    title={dept.isActive ? 'Deactivate department' : 'Activate department'}
                    className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                      dept.isActive
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400'
                    }`}
                  >
                    {dept.isActive ? (
                      <>
                        <CheckCircle size={13} weight="fill" /> Active
                      </>
                    ) : (
                      <>
                        <XCircle size={13} weight="fill" /> Inactive
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-base font-black text-[var(--foreground)]">{dept.name}</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                  {dept.description}
                </p>
              </div>

              {dept.contactEmail && (
                <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] pt-1">
                  <Envelope size={14} />
                  <span>{dept.contactEmail}</span>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-[var(--border)]">
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="rounded-xl bg-[var(--surface-hover)] p-2">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] block">
                    ACTIVE TASKS
                  </span>
                  <strong className="text-base font-black text-[var(--foreground)]">
                    {dept._count.complaints}
                  </strong>
                </div>
                <div className="rounded-xl bg-[var(--surface-hover)] p-2">
                  <span className="text-[10px] font-bold text-[var(--text-muted)] block">
                    FIELD STAFF
                  </span>
                  <strong className="text-base font-black text-[var(--foreground)]">
                    {dept._count.profiles}
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => openEdit(dept)}
                  data-testid={`edit-dept-${dept.code}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] px-2.5 py-1.5 text-xs font-bold text-[var(--foreground)] transition-colors cursor-pointer"
                >
                  <PencilSimple size={13} weight="bold" />
                  Edit
                </button>
                <button
                  onClick={() => openDelete(dept)}
                  data-testid={`delete-dept-${dept.code}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-300 px-2.5 py-1.5 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Trash size={13} weight="bold" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">
            <p className="text-xs text-[var(--text-muted)]">No departments match your search.</p>
          </div>
        )}
      </div>

      {/* ADD DEPARTMENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            data-testid="add-dept-modal"
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-black text-[var(--foreground)]">Add New Department</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parks & Recreation Division"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                  Unique Code * (uppercase letters/numbers)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PARKS"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs uppercase font-mono text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Public garden maintenance, tree trimming, park benches..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                  Contact Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="parks@demo.fixmycity.app"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="add-active"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <label htmlFor="add-active" className="text-xs font-semibold text-[var(--foreground)]">
                  Department is Active for Civic Complaints
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
                  data-testid="submit-add-dept"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Spinner size={14} className="animate-spin" />}
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DEPARTMENT MODAL */}
      {editDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            data-testid="edit-dept-modal"
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-black text-[var(--foreground)]">
                Edit Department: {editDept.name}
              </h3>
              <button
                onClick={() => setEditDept(null)}
                className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                  Department Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                  Unique Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs uppercase font-mono text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-active"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <label htmlFor="edit-active" className="text-xs font-semibold text-[var(--foreground)]">
                  Department is Active
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setEditDept(null)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  data-testid="submit-edit-dept"
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

      {/* DELETE DEPARTMENT MODAL */}
      {deleteDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            data-testid="delete-dept-modal"
            className="w-full max-w-md rounded-2xl border border-rose-200 bg-[var(--surface)] p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center gap-2 text-rose-600">
              <WarningCircle size={24} weight="fill" />
              <h3 className="text-base font-black text-[var(--foreground)]">
                Delete Department
              </h3>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to delete <strong>{deleteDept.name}</strong> ({deleteDept.code})?
            </p>

            {(deleteDept._count.complaints > 0 || deleteDept._count.profiles > 0) && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-3 text-xs text-amber-800 dark:text-amber-200">
                <strong>Notice:</strong> This department currently has{' '}
                <strong>{deleteDept._count.complaints} complaints</strong> and{' '}
                <strong>{deleteDept._count.profiles} staff members</strong> assigned. Deletion will be
                blocked to preserve data integrity. Please reassign them or deactivate the department instead.
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setDeleteDept(null)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={isPending}
                data-testid="confirm-delete-dept"
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
