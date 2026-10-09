'use client';

import React, { useState, useTransition } from 'react';
import { Role } from '@/types/enums';
import {
  Plus,
  PencilSimple,
  Trash,
  ShieldCheck,
  Wrench,
  User,
  CheckCircle,
  XCircle,
  Buildings,
  WarningCircle,
  Spinner,
} from '@phosphor-icons/react';
import {
  adminCreateUser,
  adminUpdateUserRole,
  adminDeleteUser,
} from '@/actions/admin-users';

interface DepartmentOption {
  id: string;
  name: string;
  code: string;
}

interface UserData {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: Role;
  departmentId: string | null;
  isActive: boolean;
  createdAt: Date | string;
  department: DepartmentOption | null;
}

interface Props {
  initialUsers: UserData[];
  departments: DepartmentOption[];
  currentAdminId: string;
}

export function UserManager({ initialUsers, departments, currentAdminId }: Props) {
  const [users, setUsers] = useState<UserData[]>(initialUsers);
  void users;
  void setUsers;
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isPending, startTransition] = useTransition();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editUser, setEditUser] = useState<UserData | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserData | null>(null);

  // Add Form State
  const [addForm, setAddForm] = useState<{
    fullName: string;
    email: string;
    phone: string;
    role: Role;
    departmentId: string;
    password: string;
  }>({
    fullName: '',
    email: '',
    phone: '',
    role: Role.WORKER,
    departmentId: departments[0]?.id || '',
    password: '',
  });

  // Edit Form State
  const [editForm, setEditForm] = useState<{
    fullName: string;
    phone: string;
    role: Role;
    departmentId: string;
    isActive: boolean;
  }>({
    fullName: '',
    phone: '',
    role: Role.CITIZEN,
    departmentId: '',
    isActive: true,
  });

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const openAdd = () => {
    clearMessages();
    setAddForm({
      fullName: '',
      email: '',
      phone: '',
      role: Role.WORKER,
      departmentId: departments[0]?.id || '',
      password: '',
    });
    setShowAddModal(true);
  };

  const openEdit = (u: UserData) => {
    clearMessages();
    setEditForm({
      fullName: u.fullName,
      phone: u.phone || '',
      role: u.role,
      departmentId: u.departmentId || departments[0]?.id || '',
      isActive: u.isActive,
    });
    setEditUser(u);
  };

  const openDelete = (u: UserData) => {
    clearMessages();
    setDeleteUser(u);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    startTransition(async () => {
      const res = await adminCreateUser({
        email: addForm.email,
        fullName: addForm.fullName,
        phone: addForm.phone || undefined,
        role: addForm.role,
        departmentId: addForm.role === Role.WORKER ? addForm.departmentId : undefined,
        password: addForm.password || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create user');
      } else {
        setSuccessMsg(`User "${addForm.fullName}" added successfully as ${addForm.role}!`);
        setShowAddModal(false);
        window.location.reload();
      }
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    clearMessages();

    startTransition(async () => {
      const res = await adminUpdateUserRole({
        id: editUser.id,
        fullName: editForm.fullName,
        phone: editForm.phone || undefined,
        role: editForm.role,
        departmentId: editForm.role === Role.WORKER ? editForm.departmentId : undefined,
        isActive: editForm.isActive,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to update user');
      } else {
        setSuccessMsg(`User "${editForm.fullName}" updated successfully!`);
        setEditUser(null);
        window.location.reload();
      }
    });
  };

  const handleDeleteSubmit = () => {
    if (!deleteUser) return;
    clearMessages();

    startTransition(async () => {
      const res = await adminDeleteUser(deleteUser.id);
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to delete user');
      } else {
        setSuccessMsg(`User "${deleteUser.fullName}" removed successfully.`);
        setDeleteUser(null);
        window.location.reload();
      }
    });
  };

  const roleBadges: Record<Role, { label: string; bg: string; text: string; icon: typeof User }> = {
    ADMIN: { label: 'Administrator', bg: 'bg-teal-100 dark:bg-teal-900/60', text: 'text-teal-900 dark:text-teal-200', icon: ShieldCheck },
    WORKER: { label: 'Municipal Worker', bg: 'bg-amber-100 dark:bg-amber-900/60', text: 'text-amber-900 dark:text-amber-200', icon: Wrench },
    CITIZEN: { label: 'Citizen', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-800 dark:text-slate-200', icon: User },
  };

  const filtered = initialUsers.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.department?.name.toLowerCase().includes(search.toLowerCase()) ?? false);
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <input
            type="text"
            placeholder="Search by name, email, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[220px] rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs text-[var(--foreground)] placeholder:text-[var(--text-muted)] focus:border-[var(--primary)] focus:outline-none"
          />

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
          >
            <option value="ALL">All Roles ({initialUsers.length})</option>
            <option value="CITIZEN">Citizens</option>
            <option value="WORKER">Municipal Workers</option>
            <option value="ADMIN">Administrators</option>
          </select>
        </div>

        <button
          onClick={openAdd}
          data-testid="add-user-btn"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
        >
          <Plus size={16} weight="bold" />
          Add User / Worker
        </button>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div
          data-testid="user-error-banner"
          className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
        >
          <WarningCircle size={18} weight="fill" className="text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          data-testid="user-success-banner"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          <CheckCircle size={18} weight="fill" className="text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--surface-hover)] text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Assigned Department</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filtered.map((u) => {
                const badge = roleBadges[u.role] || roleBadges.CITIZEN;
                const Icon = badge.icon;
                const isDemo = u.email.endsWith('@demo.fixmycity.app');
                const isSelf = u.id === currentAdminId;

                return (
                  <tr
                    key={u.id}
                    data-testid={`user-row-${u.id}`}
                    className="hover:bg-[var(--surface-hover)]/60 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <strong className="text-[var(--foreground)]">{u.fullName}</strong>
                        {isSelf && (
                          <span className="rounded bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200 px-1.5 py-0.2 text-[9px] font-black">
                            YOU
                          </span>
                        )}
                        {isDemo && (
                          <span className="rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 px-1.5 py-0.2 text-[9px] font-black">
                            DEMO
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">
                        {u.email} {u.phone ? `• ${u.phone}` : ''}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase ${badge.bg} ${badge.text}`}
                      >
                        <Icon size={12} weight="bold" />
                        {badge.label}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {u.department ? (
                        <span className="flex items-center gap-1.5 font-semibold text-[var(--foreground)]">
                          <Buildings size={14} className="text-[var(--primary)]" />
                          <span>{u.department.name}</span>
                          <span className="font-mono text-[10px] text-[var(--text-muted)]">
                            ({u.department.code})
                          </span>
                        </span>
                      ) : (
                        <span className="text-[var(--text-muted)] italic">None</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {u.isActive ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle size={14} weight="fill" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-rose-600">
                          <XCircle size={14} weight="fill" /> Deactivated
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-[11px] text-[var(--text-muted)]">
                      {new Date(u.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(u)}
                          data-testid={`edit-user-${u.id}`}
                          title="Edit role and department"
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] px-2.5 py-1 text-xs font-bold text-[var(--foreground)] transition-colors cursor-pointer"
                        >
                          <PencilSimple size={13} weight="bold" />
                          Edit Role
                        </button>

                        {!isSelf && (
                          <button
                            onClick={() => openDelete(u)}
                            data-testid={`delete-user-${u.id}`}
                            title="Delete user"
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-300 px-2 py-1 text-xs font-bold transition-colors cursor-pointer"
                          >
                            <Trash size={13} weight="bold" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-[var(--text-muted)]">
                    No users found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD USER / WORKER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            data-testid="add-user-modal"
            className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-black text-[var(--foreground)]">
                Add New User or Municipal Worker
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anand Kumar"
                    value={addForm.fullName}
                    onChange={(e) => setAddForm({ ...addForm, fullName: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. anand.worker@fixmycity.app"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                    User Role *
                  </label>
                  <select
                    value={addForm.role}
                    onChange={(e) =>
                      setAddForm({ ...addForm, role: e.target.value as Role })
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-bold text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                  >
                    <option value={Role.WORKER}>Municipal Worker (Field Operations)</option>
                    <option value={Role.CITIZEN}>Citizen (Public User)</option>
                    <option value={Role.ADMIN}>Administrator (Full Console Access)</option>
                  </select>
                </div>
              </div>

              {/* Conditional Department Assignment for Worker */}
              {addForm.role === Role.WORKER && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20 p-4 space-y-2">
                  <label className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                    Assigned Field Department *
                  </label>
                  <select
                    required
                    value={addForm.departmentId}
                    onChange={(e) => setAddForm({ ...addForm, departmentId: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-bold text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    Workers will be authorized to claim and resolve tasks belonging to this ward department.
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                  Initial Password (Optional — default is CivicSecure@2026!)
                </label>
                <input
                  type="password"
                  placeholder="Min 8 characters"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
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
                  data-testid="submit-add-user"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Spinner size={14} className="animate-spin" />}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER / WORKER ROLE MODAL */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            data-testid="edit-user-modal"
            className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-base font-black text-[var(--foreground)]">
                  Edit Role & Assignments: {editUser.fullName}
                </h3>
                <span className="text-[11px] text-[var(--text-muted)]">{editUser.email}</span>
              </div>
              <button
                onClick={() => setEditUser(null)}
                className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.fullName}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                  Account Role *
                </label>
                {editUser.id === currentAdminId ? (
                  <div className="rounded-xl border border-teal-200 bg-teal-50/60 dark:border-teal-900/60 dark:bg-teal-950/20 p-3 text-xs">
                    <strong className="text-teal-900 dark:text-teal-200 block font-bold">
                      ADMINISTRATOR (SELF)
                    </strong>
                    <span className="text-[11px] text-teal-800 dark:text-teal-300">
                      Security policy: You cannot edit and change your own administrator role.
                    </span>
                  </div>
                ) : (
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value as Role })
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-bold text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                  >
                    <option value={Role.CITIZEN}>Citizen (Public User)</option>
                    <option value={Role.WORKER}>Municipal Worker (Field Operations)</option>
                    <option value={Role.ADMIN}>Administrator (Full Console Access)</option>
                  </select>
                )}
              </div>

              {/* Conditional Department Assignment for Worker */}
              {editForm.role === Role.WORKER && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20 p-4 space-y-2">
                  <label className="text-xs font-bold text-amber-900 dark:text-amber-200 block">
                    Assigned Field Department *
                  </label>
                  <select
                    required
                    value={editForm.departmentId}
                    onChange={(e) => setEditForm({ ...editForm, departmentId: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-bold text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    If this worker was previously assigned to another department, their active tasks will be unassigned to maintain ward boundary integrity.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="edit-user-active"
                  disabled={editUser.id === currentAdminId}
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--primary)] disabled:opacity-50"
                />
                <label htmlFor="edit-user-active" className="text-xs font-semibold text-[var(--foreground)]">
                  Account is Active {editUser.id === currentAdminId && '(Self account must remain active)'}
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  data-testid="submit-edit-user"
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

      {/* DELETE USER MODAL */}
      {deleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            data-testid="delete-user-modal"
            className="w-full max-w-md rounded-2xl border border-rose-200 bg-[var(--surface)] p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center gap-2 text-rose-600">
              <WarningCircle size={24} weight="fill" />
              <h3 className="text-base font-black text-[var(--foreground)]">Delete User Account</h3>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to delete <strong>{deleteUser.fullName}</strong> ({deleteUser.email})?
            </p>

            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 p-3 text-xs text-amber-800 dark:text-amber-200">
              If this account has submitted complaints, bills, or official actions, deletion will be blocked by system integrity constraints. You may deactivate the account instead.
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setDeleteUser(null)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={isPending}
                data-testid="confirm-delete-user"
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
