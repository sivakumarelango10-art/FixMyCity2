import { prisma } from '@/lib/db';

/**
 * Formats a sequence number into the FMC-YYYY-NNNNNN tracking format.
 */
export function formatTrackingNumber(sequence: number, year: number = new Date().getFullYear()): string {
  const padded = String(sequence).padStart(6, '0');
  return `FMC-${year}-${padded}`;
}

/**
 * Atomically generates the next complaint tracking sequence and tracking number
 * using the PostgreSQL sequence attached to complaints.tracking_seq.
 */
export async function getNextTrackingNumber(
  dbClient: typeof prisma = prisma,
  year: number = new Date().getFullYear()
): Promise<{ trackingSeq: number; trackingNumber: string; trackingYear: number }> {
  const result = await dbClient.$queryRaw<{ nextval: string | number | bigint }[]>`
    SELECT nextval(pg_get_serial_sequence('complaints', 'tracking_seq')) AS nextval;
  `;

  const rawVal = result[0]?.nextval;
  const seq = Number(rawVal);

  if (!seq || Number.isNaN(seq)) {
    throw new Error('Failed to generate next complaint tracking sequence from database');
  }

  return {
    trackingSeq: seq,
    trackingNumber: formatTrackingNumber(seq, year),
    trackingYear: year,
  };
}
