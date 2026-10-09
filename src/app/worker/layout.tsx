import React from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { Logo } from '@/components/brand/logo';
import { DemoBanner } from '@/components/layout/demo-banner';
import {
  Briefcase,
  Tray,
  HourglassHigh,
  CheckCircle,
  Bell,
  User,
  SignOut,
  Wrench,
} from '@phosphor-icons/react/dist/ssr';

export default async function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole('WORKER');

  const navItems = [
    { label: 'Overview', href: '/worker', icon: Briefcase },
    { label: 'My Assigned Tasks', href: '/worker/my-tasks', icon: Wrench },
    { label: 'Department Queue', href: '/worker/queue', icon: Tray },
    { label: 'In Progress', href: '/worker/in-progress', icon: HourglassHigh },
    { label: 'Resolved History', href: '/worker/history', icon: CheckCircle },
    { label: 'Notifications', href: '/worker/notifications', icon: Bell },
    { label: 'My Profile', href: '/worker/account', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <DemoBanner user={user} />

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Worker Utility Sidebar */}
        <aside className="w-full md:w-64 border-r border-[#332412] bg-[#221A0F] text-amber-50 flex flex-col justify-between p-4 flex-shrink-0">
          <div className="space-y-6">
            <div className="px-2 pt-2 flex items-center justify-between">
              <Logo size="sm" />
              <span className="flex items-center gap-1 rounded bg-amber-900/80 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-200 border border-amber-800">
                <Wrench size={12} weight="bold" />
                Worker
              </span>
            </div>

            {/* Department Badge */}
            <div className="rounded-xl bg-amber-950/60 p-3 border border-amber-800/40 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Assigned Ward Dept
              </span>
              <span className="font-extrabold text-amber-100 mt-0.5 block">
                {user.department?.name || 'Department Officer'}
              </span>
              <span className="text-[10px] text-amber-300/80 block mt-0.5">
                Code: {user.department?.code || 'FIELD'}
              </span>
            </div>

            <nav className="space-y-1" aria-label="Worker console navigation">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-amber-200 hover:bg-amber-900/60 hover:text-white transition-colors"
                  >
                    <Icon size={18} weight="bold" className="text-amber-400" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="pt-6 border-t border-amber-800/40 mt-6 px-2">
            <div className="flex items-center justify-between text-xs text-amber-300 mb-3">
              <span className="truncate max-w-[140px] font-semibold">{user.email}</span>
            </div>
            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-950/80 hover:bg-rose-950/80 px-3 py-2 text-xs font-bold text-rose-200 transition-colors border border-amber-900"
              >
                <SignOut size={16} weight="bold" />
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        {/* Worker Content Area */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
