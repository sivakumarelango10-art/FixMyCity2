'use client';

import React, { useState, useTransition } from 'react';
import {
  adminUpdatePaymentMethod,
  adminTogglePaymentMethodEnabled,
  adminToggleGlobalPaymentPause,
} from '@/actions/admin-payment-methods';
import { BillService, PaymentMethodCode } from '@prisma/client';
import {
  CreditCard,
  QrCode,
  Bank,
  Wallet,
  Money,
  Pause,
  Play,
  PencilSimple,
  ShieldCheck,
  Eye,
} from '@phosphor-icons/react';
import { toast } from 'sonner';

interface MethodItem {
  id: string;
  code: PaymentMethodCode;
  displayName: string;
  description: string | null;
  iconName: string;
  isEnabled: boolean;
  sortOrder: number;
  services: { service: BillService; isDefault: boolean }[];
}

interface PaymentMethodsManagerProps {
  initialMethods: MethodItem[];
  isPaused: boolean;
}

const ALL_SERVICES: { code: BillService; label: string }[] = [
  { code: 'ELECTRICITY', label: 'Electricity Utility' },
  { code: 'WATER', label: 'Water & Sewerage' },
  { code: 'PROPERTY_TAX', label: 'Property Tax' },
  { code: 'WASTE', label: 'Waste Collection' },
];

function getMethodIcon(code: PaymentMethodCode) {
  switch (code) {
    case 'DEMO_UPI':
      return <QrCode size={20} weight="bold" className="text-teal-600" />;
    case 'DEMO_CARD':
      return <CreditCard size={20} weight="bold" className="text-sky-600" />;
    case 'DEMO_NET_BANKING':
      return <Bank size={20} weight="bold" className="text-indigo-600" />;
    case 'DEMO_WALLET':
      return <Wallet size={20} weight="bold" className="text-amber-600" />;
    case 'DEMO_CASH_COUNTER':
      return <Money size={20} weight="bold" className="text-emerald-600" />;
    default:
      return <CreditCard size={20} weight="bold" />;
  }
}

export function PaymentMethodsManager({
  initialMethods,
  isPaused: initialIsPaused,
}: PaymentMethodsManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [methods, setMethods] = useState<MethodItem[]>(initialMethods);
  const [isPaused, setIsPaused] = useState<boolean>(initialIsPaused);

  // Editing modal state
  const [editingMethod, setEditingMethod] = useState<MethodItem | null>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [editAllowedServices, setEditAllowedServices] = useState<BillService[]>([]);
  const [editDefaultServices, setEditDefaultServices] = useState<BillService[]>([]);

  // Preview service selection
  const [previewService, setPreviewService] = useState<BillService>('ELECTRICITY');

  const handleToggleGlobalPause = () => {
    const nextVal = !isPaused;
    startTransition(async () => {
      try {
        await adminToggleGlobalPaymentPause(nextVal);
        setIsPaused(nextVal);
        toast.success(
          nextVal
            ? 'Demo checkout PAUSED globally. Citizens cannot make simulated payments.'
            : 'Demo checkout RESUMED globally.'
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Action failed';
        toast.error(msg);
      }
    });
  };

  const handleToggleEnabled = (methodId: string, currentEnabled: boolean) => {
    const nextVal = !currentEnabled;
    startTransition(async () => {
      try {
        await adminTogglePaymentMethodEnabled(methodId, nextVal);
        setMethods((prev) =>
          prev.map((m) => (m.id === methodId ? { ...m, isEnabled: nextVal } : m))
        );
        toast.success(`Payment method ${nextVal ? 'enabled' : 'disabled'}.`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Action failed';
        toast.error(msg);
      }
    });
  };

  const openEditModal = (method: MethodItem) => {
    setEditingMethod(method);
    setEditDisplayName(method.displayName);
    setEditDescription(method.description || '');
    setEditSortOrder(method.sortOrder);
    setEditAllowedServices(method.services.map((s) => s.service));
    setEditDefaultServices(method.services.filter((s) => s.isDefault).map((s) => s.service));
  };

  const handleSaveMethod = () => {
    if (!editingMethod) return;

    startTransition(async () => {
      try {
        await adminUpdatePaymentMethod({
          methodId: editingMethod.id,
          displayName: editDisplayName.trim(),
          description: editDescription.trim() || undefined,
          isEnabled: editingMethod.isEnabled,
          sortOrder: editSortOrder,
          allowedServices: editAllowedServices,
          defaultServices: editDefaultServices,
        });

        setMethods((prev) =>
          prev.map((m) =>
            m.id === editingMethod.id
              ? {
                  ...m,
                  displayName: editDisplayName.trim(),
                  description: editDescription.trim() || null,
                  sortOrder: editSortOrder,
                  services: editAllowedServices.map((s) => ({
                    service: s,
                    isDefault: editDefaultServices.includes(s),
                  })),
                }
              : m
          )
        );

        setEditingMethod(null);
        toast.success('Demo payment method configuration saved.');
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Save failed';
        toast.error(msg);
      }
    });
  };

  // Compute methods visible in citizen preview for previewService
  const previewAvailableMethods = isPaused
    ? []
    : methods
        .filter((m) => m.isEnabled && m.services.some((s) => s.service === previewService))
        .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="space-y-8">
      {/* Global Control Bar */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded bg-teal-100 dark:bg-teal-900/60 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-200">
              <ShieldCheck size={12} weight="bold" /> Simulation Only
            </span>
            <span className="text-xs text-[var(--text-muted)]">• No real currency or payment gateways</span>
          </div>
          <h2 className="text-lg font-black text-[var(--foreground)] tracking-tight">
            Admin-Configurable Demo Payment Methods
          </h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Configure the simulated payment options citizens see when paying Electricity, Water, Tax, or Waste bills.
          </p>
        </div>

        {/* Global Pause Switch */}
        <button
          type="button"
          disabled={isPending}
          onClick={handleToggleGlobalPause}
          className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition-all shadow-xs ${
            isPaused
              ? 'bg-rose-600 text-white hover:bg-rose-700'
              : 'border border-[var(--border)] bg-[var(--surface-hover)] text-[var(--foreground)] hover:bg-[var(--border)]'
          }`}
        >
          {isPaused ? <Play size={16} weight="fill" /> : <Pause size={16} weight="fill" />}
          <span>{isPaused ? 'Resume Demo Payments' : 'Pause All Demo Payments'}</span>
        </button>
      </div>

      {/* Grid: Methods List vs Live Citizen Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: 5 Demo Methods Management */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[var(--foreground)]">
              Built-In Simulated Payment Methods ({methods.length})
            </h3>
            <span className="text-[11px] text-[var(--text-muted)]">
              Sorted by display priority
            </span>
          </div>

          <div className="space-y-3">
            {methods.map((method) => {
              const activeCount = method.services.length;
              return (
                <div
                  key={method.id}
                  className={`rounded-2xl border p-5 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    method.isEnabled
                      ? 'border-[var(--border)] bg-[var(--surface)]'
                      : 'border-[var(--border)] bg-[var(--surface-hover)] opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[var(--surface-hover)] flex items-center justify-center border border-[var(--border)] flex-shrink-0">
                      {getMethodIcon(method.code)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-sm font-black text-[var(--foreground)]">
                          {method.displayName}
                        </strong>
                        <span className="font-mono text-[10px] text-[var(--text-muted)]">
                          ({method.code})
                        </span>
                      </div>

                      {method.description && (
                        <p className="text-xs text-[var(--text-secondary)]">
                          {method.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-[var(--text-muted)] font-semibold">
                          Active for:
                        </span>
                        {activeCount === 0 ? (
                          <span className="text-[10px] text-rose-600 font-bold">No services</span>
                        ) : (
                          method.services.map((s) => (
                            <span
                              key={s.service}
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                                s.isDefault
                                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200'
                                  : 'bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)]'
                              }`}
                            >
                              {s.service} {s.isDefault && '(Default)'}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleEnabled(method.id, method.isEnabled)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all border ${
                        method.isEnabled
                          ? 'border-[var(--success)]/40 bg-[var(--success-light)] text-[var(--success)] hover:bg-[var(--success)] hover:text-white'
                          : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--foreground)]'
                      }`}
                    >
                      {method.isEnabled ? 'Enabled' : 'Disabled'}
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(method)}
                      className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-bold text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all shadow-2xs"
                    >
                      <PencilSimple size={13} weight="bold" /> Configure
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Live Citizen Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[var(--foreground)] flex items-center gap-1.5">
              <Eye size={16} className="text-[var(--primary)]" /> Citizen Checkout Preview
            </h3>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4 shadow-xs">
            <div>
              <label className="block text-xs font-bold text-[var(--foreground)] mb-1">
                Select Bill Service to Test
              </label>
              <select
                value={previewService}
                onChange={(e) => setPreviewService(e.target.value as BillService)}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--foreground)]"
              >
                {ALL_SERVICES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Simulated Checkout Box */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[var(--foreground)]">Simulated Checkout</span>
                <span className="text-[10px] text-[var(--text-muted)]">₹ 850.00</span>
              </div>

              {isPaused ? (
                <div className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 p-3 text-center space-y-1">
                  <span className="text-xs font-bold text-rose-700 dark:text-rose-300 block">
                    Demo Payments Paused
                  </span>
                  <p className="text-[10px] text-rose-600 dark:text-rose-400">
                    Administrator has temporarily suspended simulated billing checkouts.
                  </p>
                </div>
              ) : previewAvailableMethods.length === 0 ? (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 p-3 text-center space-y-1">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block">
                    No Methods Active for {previewService}
                  </span>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400">
                    Enable at least one demo method for this service in the configuration list.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                    Select Demo Payment Method:
                  </span>
                  {previewAvailableMethods.map((m, idx) => {
                    const isDefault = m.services.find((s) => s.service === previewService)?.isDefault || idx === 0;
                    return (
                      <div
                        key={m.id}
                        className={`rounded-xl border p-3 flex items-center justify-between text-xs ${
                          isDefault
                            ? 'border-[var(--primary)] bg-[var(--primary-light)] font-bold text-[var(--primary)]'
                            : 'border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {getMethodIcon(m.code)}
                          <span>{m.displayName}</span>
                        </div>
                        {isDefault && (
                          <span className="text-[9px] font-black uppercase text-[var(--primary)]">
                            Default
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                disabled={isPaused || previewAvailableMethods.length === 0}
                className="w-full rounded-xl bg-[var(--primary)] text-white py-2 text-xs font-bold shadow-xs disabled:opacity-40"
              >
                Pay (Demo)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Method Configuration Modal */}
      {editingMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2">
                {getMethodIcon(editingMethod.code)}
                <h4 className="text-base font-black text-[var(--foreground)]">
                  Configure {editingMethod.displayName}
                </h4>
              </div>
              <span className="font-mono text-xs text-[var(--text-muted)]">
                {editingMethod.code}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">
                  Display Name *
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  maxLength={60}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">
                  Helper / Explanatory Description
                </label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  maxLength={200}
                  placeholder="e.g. Instant simulated settlement without gateway redirect..."
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--foreground)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">
                  Sort Order (0 = Top Priority)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editSortOrder}
                  onChange={(e) => setEditSortOrder(parseInt(e.target.value) || 0)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-xs text-[var(--foreground)]"
                />
              </div>

              {/* Service Applicability & Defaults */}
              <div className="space-y-2 pt-1">
                <span className="font-bold text-[var(--foreground)] block">
                  Service Availability & Default Assignment
                </span>
                <div className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-3">
                  {ALL_SERVICES.map((serv) => {
                    const isAllowed = editAllowedServices.includes(serv.code);
                    const isDefault = editDefaultServices.includes(serv.code);

                    return (
                      <div key={serv.code} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isAllowed}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditAllowedServices([...editAllowedServices, serv.code]);
                              } else {
                                setEditAllowedServices(editAllowedServices.filter((s) => s !== serv.code));
                                setEditDefaultServices(editDefaultServices.filter((s) => s !== serv.code));
                              }
                            }}
                            className="rounded text-[var(--primary)]"
                          />
                          <span className="font-semibold text-[var(--foreground)]">{serv.label}</span>
                        </label>

                        {isAllowed && (
                          <label className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--primary)] cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isDefault}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditDefaultServices([...editDefaultServices, serv.code]);
                                } else {
                                  setEditDefaultServices(editDefaultServices.filter((s) => s !== serv.code));
                                }
                              }}
                              className="rounded text-[var(--primary)]"
                            />
                            <span>Set as Default</span>
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] pt-3">
              <button
                type="button"
                onClick={() => setEditingMethod(null)}
                className="rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-bold text-[var(--foreground)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending || editDisplayName.trim().length < 2}
                onClick={handleSaveMethod}
                className="rounded-xl bg-[var(--primary)] text-white px-5 py-2 text-xs font-bold shadow-xs hover:bg-[var(--primary-hover)] disabled:opacity-50"
              >
                {isPending ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
