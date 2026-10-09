import React from 'react';
import Link from 'next/link';
import {
  PhoneCall,
  Question,
  ShieldCheck,
  CreditCard,
  Wrench,
} from '@phosphor-icons/react/dist/ssr';

export default function HelpPage() {
  const faqs = [
    {
      q: 'How do I submit a civic grievance or report an issue?',
      a: 'Log into your Citizen Portal account (or use one-click demo login), click "Report Issue", describe the problem, select category, optionally attach up to 3 photos, select location on the interactive map, and submit.',
      icon: Question,
    },
    {
      q: 'How does complaint tracking work?',
      a: 'Every complaint receives a unique tracking number (e.g. FMC-2026-000001). You can track status transitions (Submitted → Under Review → Assigned → In Progress → Resolved) in real time with timestamped milestones.',
      icon: Wrench,
    },
    {
      q: 'Are the utility bill payments real?',
      a: 'No. FixMyCity includes a simulated demo payment system for testing municipal billing workflows (electricity, water, tax). No real payment processors or banking credentials are used or requested.',
      icon: CreditCard,
    },
    {
      q: 'What happens to my privacy and location data?',
      a: 'Your exact home coordinates and personal contact information are strictly private and visible only to assigned municipal field officers. Only opted-in reports appear on the public map with rounded coordinates.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
          Civic Support Center
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
          Help, FAQs & Emergency Contacts
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Answers to common questions regarding grievance reporting, tracking, and municipal services.
        </p>
      </div>

      {/* Emergency Notice Card */}
      <div className="rounded-2xl border-2 border-rose-300 bg-rose-50/80 dark:border-rose-900/60 dark:bg-rose-950/20 p-6 space-y-3">
        <div className="flex items-center gap-3 text-rose-800 dark:text-rose-300">
          <PhoneCall size={28} weight="fill" className="text-rose-600 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-black">All-India Emergency Helpline: Dial 112</h2>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
              FixMyCity is a non-emergency civic infrastructure maintenance portal. For immediate life, medical, fire, or police emergencies, call <strong>112</strong> directly.
            </p>
          </div>
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-4">
        <h2 className="text-xl font-black text-[var(--foreground)]">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((faq, i) => {
            const Icon = faq.icon;
            return (
              <div
                key={i}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-2 shadow-xs"
              >
                <div className="flex items-center gap-2 text-[var(--primary)] font-bold text-sm">
                  <Icon size={18} weight="bold" />
                  <h3>{faq.q}</h3>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{faq.a}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Call to action */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center space-y-4 shadow-xs">
        <h3 className="text-lg font-black text-[var(--foreground)]">Need to report a civic issue now?</h3>
        <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
          Report potholes, garbage accumulation, broken streetlights, or drainage overflow in seconds.
        </p>
        <Link
          href="/dashboard/report"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white px-5 py-2.5 text-xs font-bold shadow-xs transition-all"
        >
          Submit a Report
        </Link>
      </div>
    </div>
  );
}
