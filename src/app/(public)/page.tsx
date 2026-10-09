import React from 'react';
import Link from 'next/link';
import {
  Megaphone,
  MapPin,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Lightning,
  Drop,
  RoadHorizon,
  Trash,
  ClockAfternoon,
  Sparkle,
} from '@phosphor-icons/react/dist/ssr';

export default function HomePage() {
  const workflowSteps = [
    {
      step: '01',
      title: 'Report Issue',
      desc: 'Submit geolocation, photo evidence, and title. Advisory AI classifies your request automatically.',
      icon: MapPin,
    },
    {
      step: '02',
      title: 'Review & Assignment',
      desc: 'Municipal administrators triage verified reports to active ward teams and assigned workers.',
      icon: ClockAfternoon,
    },
    {
      step: '03',
      title: 'Worker Resolution',
      desc: 'Field crew arrives, initiates work, uploads before/after verification evidence, and resolves.',
      icon: Lightning,
    },
    {
      step: '04',
      title: 'Citizen Verification',
      desc: 'Receive live updates, inspect the resolution summary, and provide a 1–5 star rating or reopen.',
      icon: CheckCircle,
    },
  ];

  const serviceCategories = [
    { name: 'Roads & Potholes', dept: 'ROADS', icon: RoadHorizon, desc: 'Pothole repairs, asphalt damage, road safety' },
    { name: 'Water & Pipeline', dept: 'WATER', icon: Drop, desc: 'Pipeline leakage, contamination, supply pressure' },
    { name: 'Sanitation & Waste', dept: 'SANITATION', icon: Trash, desc: 'Garbage accumulation, street sweeping, dump clearing' },
    { name: 'Street Lighting', dept: 'LIGHTING', icon: Lightning, desc: 'Broken streetlights, pole wiring, dark stretches' },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-[var(--border)] bg-gradient-to-b from-[var(--surface)] to-[var(--background)] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1 text-xs font-semibold text-[var(--primary)] shadow-sm mb-6">
            <Sparkle size={14} weight="fill" className="text-amber-500" />
            <span>Bengaluru Civic Services Platform • Demo 2026</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[var(--foreground)] max-w-4xl mx-auto leading-[1.1]">
            Your City. <span className="text-[var(--primary)]">Your Voice.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-normal leading-relaxed">
            One City. One Platform. Every Service. Report civic complaints, track repair timelines in realtime, and access simulated municipal utility bill payments across Bengaluru.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard/report"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-7 py-3.5 text-base font-bold text-white shadow-md hover:bg-[var(--primary-hover)] transition-all"
            >
              <Megaphone size={20} weight="bold" />
              Report a Problem
            </Link>
            <Link
              href="/map"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-7 py-3.5 text-base font-bold text-[var(--foreground)] hover:bg-[var(--surface-hover)] transition-all shadow-sm"
            >
              <MapPin size={20} weight="bold" />
              Explore Public Map
            </Link>
          </div>

          {/* Demonstration Notice & Portal Shortcuts */}
          <div className="mt-14 max-w-3xl mx-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-4 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
              <span className="flex items-center gap-1.5 text-[var(--primary)]">
                <ShieldCheck size={16} weight="bold" />
                Three Portals In One System
              </span>
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Ready for Review</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <Link
                href="/login"
                className="group rounded-xl border border-[var(--border)] p-3.5 hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/20 transition-all"
              >
                <div className="text-xs font-bold text-[var(--primary)]">Citizen Portal</div>
                <div className="text-sm font-extrabold text-[var(--foreground)] mt-0.5">/dashboard</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">Submit reports, track timeline, demo billing</div>
              </Link>
              <Link
                href="/login"
                className="group rounded-xl border border-[var(--border)] p-3.5 hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/20 transition-all"
              >
                <div className="text-xs font-bold text-[#008C9A]">Admin Console</div>
                <div className="text-sm font-extrabold text-[var(--foreground)] mt-0.5">/admin</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">Triage, allocate workers, payment method settings</div>
              </Link>
              <Link
                href="/login"
                className="group rounded-xl border border-[var(--border)] p-3.5 hover:border-[var(--primary)] hover:bg-[var(--primary-light)]/20 transition-all"
              >
                <div className="text-xs font-bold text-[#A35F00]">Worker Portal</div>
                <div className="text-sm font-extrabold text-[var(--foreground)] mt-0.5">/worker</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">Claim queue tasks, upload evidence, resolve</div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Progress Section */}
      <section className="py-20 bg-[var(--surface)] border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-2">
              Transparent Resolution Flow
            </h2>
            <h3 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
              From Report to Verified Resolution
            </h3>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              Every complaint moves through strict state verification with real-time updates and public accountability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {workflowSteps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="relative rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-extrabold text-[var(--primary)] bg-[var(--primary-light)] px-2.5 py-1 rounded-md">
                        Stage {item.step}
                      </span>
                      <div className="p-2 rounded-xl bg-[var(--surface)] text-[var(--primary)] border border-[var(--border)]">
                        <Icon size={20} weight="duotone" />
                      </div>
                    </div>
                    <h4 className="text-base font-bold text-[var(--foreground)] mb-2">
                      {item.title}
                    </h4>
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Municipal Services Overview */}
      <section className="py-20 bg-[var(--background)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--primary)] mb-2">
                Municipal Departments
              </h2>
              <h3 className="text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
                Unified Civic Categories
              </h3>
            </div>
            <Link
              href="/services"
              className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--primary)] hover:underline"
            >
              Browse all categories <ArrowRight size={16} weight="bold" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {serviceCategories.map((cat, idx) => {
              const Icon = cat.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm hover:border-[var(--primary)] transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] flex items-center justify-center mb-4">
                    <Icon size={26} weight="duotone" />
                  </div>
                  <h4 className="text-base font-bold text-[var(--foreground)] mb-1">
                    {cat.name}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mb-4">
                    {cat.desc}
                  </p>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-[var(--background)] text-[var(--text-muted)] border border-[var(--border)]">
                    Dept: {cat.dept}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
