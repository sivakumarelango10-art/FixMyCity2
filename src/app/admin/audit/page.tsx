import React from 'react';
import { requireRole } from '@/lib/auth';
import { prisma } from '@/lib/db';
// No unused imports

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage() {
  await requireRole('ADMIN');

  const auditLogs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      actor: true,
    },
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="border-b border-[var(--border)] pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-teal-800 dark:text-teal-400">
          Governance & Compliance
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tracking-tight mt-1">
          System Audit Trail ({auditLogs.length} events)
        </h1>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Append-only immutable record of all administrative triage, status transitions, and payment configuration changes.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border)] bg-[var(--surface-hover)] text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity Type</th>
                <th className="px-4 py-3">Entity ID</th>
                <th className="px-4 py-3">Metadata Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[var(--surface-hover)]/60 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-[11px] text-[var(--text-muted)]">
                    {new Date(log.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {log.actor ? (
                      <span className="font-semibold text-[var(--foreground)]">
                        {log.actor.fullName} ({log.actor.role})
                      </span>
                    ) : (
                      <span className="text-[var(--text-muted)] italic">System Automator</span>
                    )}
                  </td>

                  <td className="px-4 py-3 font-mono font-bold text-[var(--primary)] whitespace-nowrap">
                    {log.action}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-[var(--text-secondary)]">
                    {log.entityType}
                  </td>

                  <td className="px-4 py-3 font-mono text-[11px] text-[var(--text-muted)] whitespace-nowrap">
                    {log.entityId ? `${log.entityId.slice(0, 12)}...` : 'N/A'}
                  </td>

                  <td className="px-4 py-3 max-w-[260px] truncate text-[11px] font-mono text-[var(--text-muted)]">
                    {log.metadata ? JSON.stringify(log.metadata) : 'None'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
