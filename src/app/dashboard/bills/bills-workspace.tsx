'use client';

import React, { useState, useTransition } from 'react';
import {
  CreditCard,
  CheckCircle,
  Clock,
  WarningCircle,
  Receipt,
  Spinner,
  ShieldCheck,
  DeviceMobile,
  Bank,
  Wallet,
  Money,
} from '@phosphor-icons/react';
import { PaymentMethodCode, BillService } from '@/types/enums';

interface BillData {
  id: string;
  service: BillService;
  periodLabel: string;
  amount: string;
  dueDate: Date | string;
  status: 'UNPAID' | 'PAID';
  paidAt: Date | string | null;
  payment?: {
    id: string;
    reference: string;
    methodCodeSnapshot: string;
    methodNameSnapshot: string;
    createdAt: Date | string;
  } | null;
}

interface PaymentMethodOption {
  code: PaymentMethodCode;
  displayName: string;
  description: string | null;
  iconName: string;
  services: { service: BillService; isDefault: boolean }[];
}

interface Props {
  bills: BillData[];
  availableMethods: PaymentMethodOption[];
  isPaymentsPaused: boolean;
}

export function BillsWorkspace({ bills, availableMethods, isPaymentsPaused }: Props) {
  const [selectedBill, setSelectedBill] = useState<BillData | null>(null);
  const [selectedMethodCode, setSelectedMethodCode] = useState<PaymentMethodCode | null>(null);
  const [receiptModal, setReceiptModal] = useState<{
    reference: string;
    amount: string;
    service: string;
    periodLabel: string;
    methodName: string;
    createdAt: Date | string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  const methodIcons: Record<string, typeof CreditCard> = {
    DEMO_UPI: DeviceMobile,
    DEMO_CARD: CreditCard,
    DEMO_NET_BANKING: Bank,
    DEMO_WALLET: Wallet,
    DEMO_CASH_COUNTER: Money,
  };

  const openCheckout = (bill: BillData) => {
    setErrorMsg(null);
    setSelectedBill(bill);
    // Filter methods applicable to this service
    const allowed = availableMethods.filter((m) =>
      m.services.some((s) => s.service === bill.service)
    );
    // Find default for this service or pick first
    const defaultMethod = allowed.find((m) =>
      m.services.some((s) => s.service === bill.service && s.isDefault)
    );
    setSelectedMethodCode(defaultMethod?.code || allowed[0]?.code || null);
    // Generate fresh idempotency key
    setIdempotencyKey(`idem_${bill.id}_${Date.now()}`);
  };

  const handlePay = async () => {
    if (!selectedBill || !selectedMethodCode) return;
    setErrorMsg(null);

    startTransition(async () => {
      try {
        const res = await fetch('/api/demo-payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            billId: selectedBill.id,
            paymentMethodCode: selectedMethodCode,
            idempotencyKey,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error || 'Payment failed');
          return;
        }

        // Show receipt
        setSelectedBill(null);
        setReceiptModal({
          reference: data.payment.reference,
          amount: data.payment.amount,
          service: data.payment.service,
          periodLabel: data.payment.periodLabel,
          methodName: data.payment.methodName,
          createdAt: data.payment.createdAt,
        });
      } catch (err: unknown) {
        setErrorMsg((err as Error).message || 'Network error during simulated payment');
      }
    });
  };

  const viewExistingReceipt = (bill: BillData) => {
    if (!bill.payment) return;
    setReceiptModal({
      reference: bill.payment.reference,
      amount: bill.amount,
      service: bill.service,
      periodLabel: bill.periodLabel,
      methodName: bill.payment.methodNameSnapshot,
      createdAt: bill.payment.createdAt,
    });
  };

  return (
    <div className="space-y-6">
      {/* Simulation Warning Banner */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 dark:border-amber-900/60 dark:bg-amber-950/20 p-4 text-xs flex items-center gap-3">
        <ShieldCheck size={24} className="text-amber-700 flex-shrink-0" />
        <div>
          <strong className="text-amber-900 dark:text-amber-200 block font-bold">
            SIMULATED UTILITY BILLING ENVIRONMENT
          </strong>
          <span className="text-amber-800 dark:text-amber-300">
            FixMyCity utility billing is demonstration-only. No real financial credentials or payment processors are integrated.
          </span>
        </div>
      </div>

      {isPaymentsPaused && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300 flex items-center gap-2">
          <WarningCircle size={18} weight="fill" className="text-rose-600" />
          <span>Notice: Demo payments are currently paused by city administration. Check back soon.</span>
        </div>
      )}

      {/* Bills List */}
      <div className="space-y-3">
        {bills.map((b) => {
          const isOverdue = b.status === 'UNPAID' && new Date(b.dueDate) < new Date();
          return (
            <div
              key={b.id}
              data-testid={`bill-card-${b.id}`}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-black uppercase text-[var(--primary)] bg-[var(--surface-hover)] border border-[var(--border)] px-2.5 py-0.5 rounded-md">
                    {b.service.replace('_', ' ')}
                  </span>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-black uppercase ${
                      b.status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : isOverdue
                          ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {b.status === 'PAID' ? 'PAID' : isOverdue ? 'OVERDUE' : 'UNPAID'}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{b.periodLabel}</span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-[var(--foreground)]">₹{b.amount}</span>
                </div>

                <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> Due Date:{' '}
                    {new Date(b.dueDate).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {b.paidAt && (
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle size={14} weight="fill" /> Paid on{' '}
                      {new Date(b.paidAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>

              <div>
                {b.status === 'UNPAID' ? (
                  <button
                    onClick={() => openCheckout(b)}
                    disabled={isPaymentsPaused}
                    data-testid={`pay-bill-btn-${b.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-4 py-2 text-xs font-bold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    <CreditCard size={15} weight="bold" />
                    Pay Bill (Demo)
                  </button>
                ) : (
                  <button
                    onClick={() => viewExistingReceipt(b)}
                    data-testid={`view-receipt-btn-${b.id}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--foreground)] px-4 py-2 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Receipt size={15} weight="bold" />
                    View Receipt
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CHECKOUT MODAL */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            data-testid="checkout-modal"
            className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h3 className="text-base font-black text-[var(--foreground)]">
                  Simulated Demo Checkout
                </h3>
                <span className="text-xs text-[var(--text-muted)]">
                  {selectedBill.service.replace('_', ' ')} • {selectedBill.periodLabel}
                </span>
              </div>
              <button
                onClick={() => setSelectedBill(null)}
                className="text-xs font-bold text-[var(--text-muted)] hover:text-[var(--foreground)] cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                <WarningCircle size={16} weight="fill" className="text-rose-600 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="rounded-xl bg-[var(--surface-hover)] p-4 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[var(--text-muted)] block font-semibold">AMOUNT DUE</span>
                <span className="text-2xl font-black text-[var(--foreground)]">₹{selectedBill.amount}</span>
              </div>
              <span className="rounded bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200 px-2.5 py-1 text-[10px] font-black uppercase">
                NO REAL CHARGE
              </span>
            </div>

            {/* Select Method from Admin Configured Methods */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[var(--foreground)] block">
                Select Admin-Enabled Demo Payment Method:
              </label>

              {availableMethods
                .filter((m) => m.services.some((s) => s.service === selectedBill.service))
                .map((method) => {
                  const Icon = methodIcons[method.code] || CreditCard;
                  const isSelected = selectedMethodCode === method.code;

                  return (
                    <label
                      key={method.code}
                      data-testid={`method-radio-${method.code}`}
                      className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[var(--primary)] bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10 ring-1 ring-[var(--primary)]'
                          : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-hover)]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="demo-method"
                          value={method.code}
                          checked={isSelected}
                          onChange={() => setSelectedMethodCode(method.code)}
                          className="text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                        <div className="w-8 h-8 rounded-lg bg-[var(--surface-hover)] flex items-center justify-center text-[var(--primary)]">
                          <Icon size={18} weight="bold" />
                        </div>
                        <div>
                          <strong className="text-xs text-[var(--foreground)] block">
                            {method.displayName}
                          </strong>
                          {method.description && (
                            <span className="text-[10px] text-[var(--text-muted)] block">
                              {method.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  );
                })}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setSelectedBill(null)}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePay}
                disabled={isPending || !selectedMethodCode}
                data-testid="confirm-demo-pay-btn"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isPending && <Spinner size={14} className="animate-spin" />}
                Pay ₹{selectedBill.amount} (Demo)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT MODAL */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            data-testid="receipt-modal"
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xl space-y-5"
          >
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <CheckCircle size={28} weight="fill" />
              </div>
              <h3 className="text-lg font-black text-[var(--foreground)]">Simulated Payment Receipt</h3>
              <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/60 inline-block">
                SAMPLE RECEIPT — NOT VALID PROOF OF REAL PAYMENT
              </span>
            </div>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Receipt Reference:</span>
                <strong className="font-mono text-[var(--foreground)]">{receiptModal.reference}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Utility Service:</span>
                <strong className="text-[var(--foreground)]">{receiptModal.service.replace('_', ' ')}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Billing Cycle:</span>
                <strong className="text-[var(--foreground)]">{receiptModal.periodLabel}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Method Snapshot:</span>
                <strong className="text-[var(--foreground)]">{receiptModal.methodName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Amount Processed:</span>
                <strong className="text-base font-black text-[var(--primary)]">₹{receiptModal.amount}</strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-[var(--border)]">
                <span className="text-[var(--text-muted)]">Timestamp:</span>
                <span>{new Date(receiptModal.createdAt).toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  setReceiptModal(null);
                  window.location.reload();
                }}
                data-testid="close-receipt-btn"
                className="rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-6 py-2 text-xs font-bold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
