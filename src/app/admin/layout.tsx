import React from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { Logo } from '@/components/brand/logo';
import { DemoBanner } from '@/components/layout/demo-banner';
import {
  SquaresFour,
  ListDashes,
  Buildings,
  UsersThree,
  Receipt,
  CreditCard,
  Megaphone,
  ChartBar,
  ClipboardText,
  SignOut,
  ShieldCheck,
} from '@phosphor-icons/react/dist/ssr';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole('ADMIN');

  const navItems = [
    { label: 'Overview', href: '/admin', icon: SquaresFour },
    { label: 'Complaints', href: '/admin/complaints', icon: ListDashes },
    { label: 'Departments', href: '/admin/departments', icon: Buildings },
    { label: 'User Directory', href: '/admin/users', icon: UsersThree },
    { label: 'Demo Billing', href: '/admin/billing', icon: Receipt },
    { label: 'Payment Methods', href: '/admin/payment-methods', icon: CreditCard },
    { label: 'Announcements', href: '/admin/announcements', icon: Megaphone },
    { label: 'Analytics', href: '/admin/analytics', icon: ChartBar },
    { label: 'Audit Log', href: '/admin/audit', icon: ClipboardText },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <DemoBanner user={user} />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Dark Teal Dense Operations Sidebar */}
        <aside className="w-full md:w-64 border-r border-[#125452] bg-[#0E3D3B] text-teal-50 flex flex-col justify-between p-4 flex-shrink-0">
          <div className="space-y-6">
            <div className="px-2 pt-2 flex items-center justify-between">
              <Logo size="sm" />
              <span className="flex items-center gap-1 rounded bg-teal-800/80 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-teal-200 border border-teal-700">
                <ShieldCheck size={12} weight="bold" />
                Admin
              </span>
            </div>

            <nav className="space-y-1" aria-label="Admin console navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-teal-100 hover:bg-[#165552] hover:text-white transition-colors"
                  >
                    <Icon size={18} weight="bold" className="text-teal-300" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-6 border-t border-teal-800/60 mt-6 px-2">
            <div className="flex items-center justify-between text-xs text-teal-300 mb-3">
              <span className="truncate max-w-[140px] font-semibold">{user.email}</span>
            </div>
            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-teal-900/60 hover:bg-rose-950/80 px-3 py-2 text-xs font-bold text-rose-200 transition-colors border border-teal-800"
              >
                <SignOut size={16} weight="bold" />
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        {/* Admin Content Area */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
