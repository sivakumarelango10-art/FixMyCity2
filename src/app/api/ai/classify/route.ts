import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { classifyComplaint } from '@/lib/ai/gemini';
import { z } from 'zod';

const classifySchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(20).max(2000),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = classifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const result = await classifyComplaint(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Classification error:', error);
    return NextResponse.json({ error: 'Classification service unavailable' }, { status: 500 });
  }
}
