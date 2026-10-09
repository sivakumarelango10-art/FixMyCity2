import React from 'react';
import Link from 'next/link';
import { requireRole } from '@/lib/auth';
import { Logo } from '@/components/brand/logo';
import { DemoBanner } from '@/components/layout/demo-banner';
import {
  HouseLine,
  Megaphone,
  ListBullets,
  Receipt,
  Bell,
  User,
  Newspaper,
  SignOut,
} from '@phosphor-icons/react/dist/ssr';

export default async function CitizenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole('CITIZEN');

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: HouseLine },
    { label: 'Report Issue', href: '/dashboard/report', icon: Megaphone },
    { label: 'My Complaints', href: '/dashboard/complaints', icon: ListBullets },
    { label: 'Bills (Demo)', href: '/dashboard/bills', icon: Receipt },
    { label: 'City Updates', href: '/dashboard/updates', icon: Newspaper },
    { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
    { label: 'Profile', href: '/dashboard/profile', icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)]">
      <DemoBanner user={user} />

      {/* Citizen Portal Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <span className="inline-flex items-center rounded-md bg-[var(--primary-light)] px-2.5 py-0.5 text-xs font-extrabold text-[var(--primary)]">
              Citizen Portal
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--primary)] transition-colors"
                >
                  <Icon size={16} weight="bold" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/report"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[var(--primary-hover)] transition-colors"
            >
              <Megaphone size={15} weight="bold" />
              Report
            </Link>

            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                aria-label="Sign out"
                className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--surface-hover)] transition-colors"
              >
                <SignOut size={18} weight="bold" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Portal View */}
      <main className="flex-1 pb-16 md:pb-8">{children}</main>

      {/* Mobile Bottom Navigation Bar (WCAG AA Touch Targets >= 44px) */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--surface)] md:hidden shadow-lg"
      >
        <div className="grid grid-cols-5 h-16">
          <Link
            href="/dashboard"
            className="flex flex-col items-center justify-center text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--primary)]"
          >
            <HouseLine size={20} weight="bold" />
            Home
          </Link>
          <Link
            href="/dashboard/complaints"
            className="flex flex-col items-center justify-center text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--primary)]"
          >
            <ListBullets size={20} weight="bold" />
            Track
          </Link>
          <Link
            href="/dashboard/report"
            className="flex flex-col items-center justify-center text-[10px] font-bold text-[var(--primary)]"
          >
            <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center shadow-md -mt-3 border-2 border-white">
              <Megaphone size={20} weight="bold" />
            </div>
            Report
          </Link>
          <Link
            href="/dashboard/bills"
            className="flex flex-col items-center justify-center text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--primary)]"
          >
            <Receipt size={20} weight="bold" />
            Bills
          </Link>
          <Link
            href="/dashboard/profile"
            className="flex flex-col items-center justify-center text-[10px] font-bold text-[var(--text-secondary)] hover:text-[var(--primary)]"
          >
            <User size={20} weight="bold" />
            Profile
          </Link>
        </div>
      </nav>
    </div>
  );
}
