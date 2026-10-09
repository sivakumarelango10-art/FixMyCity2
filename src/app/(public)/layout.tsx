import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/brand/logo';
import { SignIn, UserPlus } from '@phosphor-icons/react/dist/ssr';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)]">
      {/* Top Civic Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo size="md" showTagline />

          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-[var(--text-secondary)]">
            <Link href="/services" className="hover:text-[var(--primary)] transition-colors">
              Services
            </Link>
            <Link href="/map" className="hover:text-[var(--primary)] transition-colors">
              Live Map
            </Link>
            <Link href="/updates" className="hover:text-[var(--primary)] transition-colors">
              City Updates
            </Link>
            <Link href="/help" className="hover:text-[var(--primary)] transition-colors">
              Help & FAQ
            </Link>
            <Link href="/about" className="hover:text-[var(--primary)] transition-colors">
              About
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-colors"
            >
              <SignIn size={16} weight="bold" />
              Sign In
            </Link>
            <Link
              href="/register"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[var(--primary-hover)] transition-colors"
            >
              <UserPlus size={16} weight="bold" />
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Main Public Content */}
      <main className="flex-1">{children}</main>

      {/* Civic Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-12 text-sm text-[var(--text-secondary)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <Logo size="sm" />
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                One City. One Platform. Every Service. Modern civic services web platform connecting citizens, administration, and municipal field teams.
              </p>
              <div className="inline-flex items-center gap-2 rounded-md bg-[var(--warning-light)] px-2.5 py-1 text-xs font-medium text-[var(--warning)] border border-[#E6D4B8]">
                <span>Demonstration Edition — Bengaluru, IN</span>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-[var(--foreground)] mb-3">Citizens</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/dashboard/report" className="hover:text-[var(--primary)]">Report an Issue</Link></li>
                <li><Link href="/dashboard/complaints" className="hover:text-[var(--primary)]">Track Complaint</Link></li>
                <li><Link href="/dashboard/bills" className="hover:text-[var(--primary)]">Demo Utility Bills</Link></li>
                <li><Link href="/map" className="hover:text-[var(--primary)]">Public Issues Map</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-[var(--foreground)] mb-3">City Services</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/services" className="hover:text-[var(--primary)]">Municipal Departments</Link></li>
                <li><Link href="/updates" className="hover:text-[var(--primary)]">Public Advisories</Link></li>
                <li><Link href="/help" className="hover:text-[var(--primary)]">Emergency Numbers (112)</Link></li>
                <li><Link href="/about" className="hover:text-[var(--primary)]">Civic Transparency</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-[var(--foreground)] mb-3">Portals & Access</h4>
              <ul className="space-y-2 text-xs">
                <li><Link href="/dashboard" className="hover:text-[var(--primary)]">Citizen Portal</Link></li>
                <li><Link href="/admin" className="hover:text-[var(--primary)]">Admin Console</Link></li>
                <li><Link href="/worker" className="hover:text-[var(--primary)]">Worker Portal</Link></li>
                <li><Link href="/login" className="hover:text-[var(--primary)]">One-Click Demo Login</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-[var(--border)] pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-muted)] gap-4">
            <p>© {new Date().getFullYear()} FixMyCity. Developed for Bengaluru Municipal Services (Demonstration).</p>
            <p>OpenStreetMap & Leaflet Attribution • WCAG AA Accessible Design</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
