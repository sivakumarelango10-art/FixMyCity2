import React from 'react';
import { prisma } from '@/lib/db';
import {
  MapPin,
  Clock,
  ShieldCheck,
} from '@phosphor-icons/react/dist/ssr';
import { DynamicStaticMap } from '@/components/maps/dynamic-static-map';

export const dynamic = 'force-dynamic';

export default async function PublicMapPage() {
  const publicComplaints = await prisma.complaint.findMany({
    where: {
      isPublic: true,
      status: { not: 'DRAFT' },
    },
    take: 50,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      trackingNumber: true,
      title: true,
      category: true,
      status: true,
      latitude: true,
      longitude: true,
      publicAreaLabel: true,
      isDemo: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--primary)]">
          Live Civic Transparency
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[var(--foreground)] tracking-tight">
          Bengaluru Public Issues Map
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Opt-in public civic reports with privacy-protected approximate ward coordinates.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/60 dark:border-amber-900/60 dark:bg-amber-950/20 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
        <ShieldCheck size={20} className="text-amber-700 flex-shrink-0" />
        <span>
          <strong>Citizen Privacy Notice:</strong> Locations on the public map are generalized to approximate ward areas. Exact private home coordinates and personal contact details are never exposed.
        </span>
      </div>

      {/* Featured Overview Map */}
      {publicComplaints.length > 0 && publicComplaints[0] && (
        <div className="rounded-2xl overflow-hidden border border-[var(--border)] h-[380px] shadow-xs">
          <DynamicStaticMap
            coordinates={{
              latitude: Number(publicComplaints[0].latitude),
              longitude: Number(publicComplaints[0].longitude),
            }}
          />
        </div>
      )}

      {/* Accessible List View */}
      <div className="space-y-4">
        <h2 className="text-base font-black text-[var(--foreground)]">
          Public Issues List ({publicComplaints.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {publicComplaints.map((item) => (
            <div
              key={item.id}
              data-testid={`public-issue-${item.id}`}
              className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs space-y-2 hover:border-[var(--primary)] transition-all"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-[var(--primary)]">
                  {item.trackingNumber}
                </span>
                <span className="rounded bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 px-2 py-0.5 text-[10px] font-black uppercase">
                  {item.status.replace('_', ' ')}
                </span>
              </div>

              <h3 className="text-sm font-bold text-[var(--foreground)]">{item.title}</h3>

              <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
                <span className="flex items-center gap-1">
                  <MapPin size={13} /> {item.publicAreaLabel || 'Bengaluru Ward'}
                </span>
                <span className="flex items-center gap-1 text-[11px]">
                  <Clock size={12} />
                  {new Date(item.createdAt).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>
          ))}

          {publicComplaints.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-[var(--border)] p-12 text-center text-xs text-[var(--text-muted)]">
              No public complaints currently opted-in.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
