'use client';

import React, { useState, useTransition } from 'react';
import { BillService } from '@/types/enums';
import {
  Plus,
  CheckCircle,
  Lightning,
  Drop,
  Buildings,
  Trash,
  WarningCircle,
  Spinner,
} from '@phosphor-icons/react';
import { adminCreateBill, adminApprovePayment } from '@/actions/admin-bills';

interface CitizenOption {
  id: string;
  fullName: string;
  email: string;
}

interface BillData {
  id: string;
  service: BillService;
  periodLabel: string;
  amount: string;
  dueDate: Date | string;
  status: 'UNPAID' | 'PAID';
  createdAt: Date | string;
  citizen: {
    fullName: string;
    email: string;
  };
  payment?: {
    id: string;
    reference: string;
    methodCodeSnapshot: string;
    methodNameSnapshot: string;
    isApproved: boolean;
    approvedAt: Date | string | null;
    createdAt: Date | string;
  } | null;
}

interface Props {
  initialBills: BillData[];
  citizens: CitizenOption[];
}

export function BillingManager({ initialBills, citizens }: Props) {
  const [bills, setBills] = useState(initialBills);
  void bills;
  void setBills;
  const [isPending, startTransition] = useTransition();

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState<{
    citizenId: string;
    service: BillService;
    periodLabel: string;
    amount: string;
    dueDate: string;
  }>({
    citizenId: citizens[0]?.id || '',
    service: BillService.ELECTRICITY,
    periodLabel: '',
    amount: '',
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
  });

  const clearMessages = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const openCreateModal = () => {
    clearMessages();
    setForm({
      citizenId: citizens[0]?.id || '',
      service: BillService.ELECTRICITY,
      periodLabel: '',
      amount: '',
      dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
    });
    setShowCreateModal(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    startTransition(async () => {
      const res = await adminCreateBill({
        citizenId: form.citizenId,
        service: form.service,
        periodLabel: form.periodLabel,
        amount: Number(form.amount),
        dueDate: form.dueDate,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to create bill');
      } else {
        setSuccessMsg(`Bill of ₹${form.amount} generated successfully for citizen.`);
        setShowCreateModal(false);
        window.location.reload();
      }
    });
  };

  const handleApprove = (paymentId: string) => {
    clearMessages();
    startTransition(async () => {
      const res = await adminApprovePayment({ paymentId });
      if (!res.success) {
        setErrorMsg(res.error || 'Failed to approve payment');
      } else {
        setSuccessMsg('Payment officially reconciled and approved by treasury.');
        window.location.reload();
      }
    });
  };

  const serviceIcons: Record<BillService, typeof Lightning> = {
    ELECTRICITY: Lightning,
    WATER: Drop,
    PROPERTY_TAX: Buildings,
    WASTE: Trash,
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-[var(--foreground)]">
            Invoices & Settlements Management
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Issue civic utility invoices to citizens and review / approve simulated settlements.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          data-testid="create-bill-btn"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer"
        >
          <Plus size={16} weight="bold" />
          Create Citizen Bill
        </button>
      </div>

      {errorMsg && (
        <div
          data-testid="billing-error-banner"
          className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300"
        >
          <WarningCircle size={18} weight="fill" className="text-rose-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          data-testid="billing-success-banner"
          className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          <CheckCircle size={18} weight="fill" className="text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Bills & Payments Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--surface-hover)] text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3">Citizen</th>
                <th className="px-4 py-3">Service & Period</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Bill Status</th>
                <th className="px-4 py-3">Payment & Snapshot</th>
                <th className="px-4 py-3 text-right">Treasury Approval</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {initialBills.map((b) => {
                const Icon = serviceIcons[b.service] || Lightning;

                return (
                  <tr
                    key={b.id}
                    data-testid={`bill-row-${b.id}`}
                    className="hover:bg-[var(--surface-hover)]/60 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <strong className="text-[var(--foreground)] block">{b.citizen.fullName}</strong>
                      <span className="text-[11px] text-[var(--text-muted)] block">{b.citizen.email}</span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="flex items-center gap-1.5 font-bold text-[var(--foreground)]">
                        <Icon size={14} className="text-[var(--primary)]" />
                        {b.service.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] block mt-0.5">
                        {b.periodLabel}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 font-mono font-black text-sm text-[var(--foreground)]">
                      ₹ {Number(b.amount).toFixed(2)}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
                          b.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}
                      >
                        {b.status}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] block mt-0.5">
                        Due: {new Date(b.dueDate).toLocaleDateString('en-IN')}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      {b.payment ? (
                        <div>
                          <span className="font-mono text-xs font-bold text-[var(--primary)] block">
                            {b.payment.reference}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)] block">
                            {b.payment.methodNameSnapshot}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[var(--text-muted)] italic">Awaiting Payment</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      {b.payment ? (
                        b.payment.isApproved ? (
                          <span
                            data-testid={`approved-badge-${b.payment.id}`}
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 px-2.5 py-1 text-[10px] font-black uppercase"
                          >
                            <CheckCircle size={13} weight="fill" />
                            Approved
                          </span>
                        ) : (
                          <button
                            onClick={() => handleApprove(b.payment!.id)}
                            disabled={isPending}
                            data-testid={`approve-payment-btn-${b.payment.id}`}
                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white px-3 py-1.5 text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            {isPending ? (
                              <Spinner size={13} className="animate-spin" />
                            ) : (
                              <CheckCircle size={13} weight="bold" />
                            )}
                            Approve Payment
                          </button>
                        )
                      ) : (
                        <span className="text-[var(--text-muted)] text-[11px]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {initialBills.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-[var(--text-muted)]">
                    No utility bills generated yet. Click "Create Citizen Bill" above to issue one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE CITIZEN BILL MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            data-testid="create-bill-modal"
            className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-base font-black text-[var(--foreground)]">Issue Citizen Utility Bill</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                  Recipient Citizen *
                </label>
                <select
                  required
                  value={form.citizenId}
                  onChange={(e) => setForm({ ...form, citizenId: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-bold text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                >
                  {citizens.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                    Utility Service *
                  </label>
                  <select
                    value={form.service}
                    onChange={(e) =>
                      setForm({ ...form, service: e.target.value as BillService })
                    }
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                  >
                    <option value={BillService.ELECTRICITY}>Electricity (BESCOM)</option>
                    <option value={BillService.WATER}>Water (BWSSB)</option>
                    <option value={BillService.PROPERTY_TAX}>Property Tax (BBMP)</option>
                    <option value={BillService.WASTE}>Solid Waste Management</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 1450.00"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-bold font-mono text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                  Billing Period Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. March-April 2026 or Q1 2026 Assessment"
                  value={form.periodLabel}
                  onChange={(e) => setForm({ ...form, periodLabel: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--foreground)] block mb-1">
                  Payment Due Date *
                </label>
                <input
                  type="date"
                  required
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-bold text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  data-testid="submit-create-bill-btn"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isPending && <Spinner size={14} className="animate-spin" />}
                  Generate Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
