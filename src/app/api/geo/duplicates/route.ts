import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  calculateHaversineDistanceMeters,
  getBoundingBox,
  isValidCoordinate,
  DUPLICATE_DETECTION_RADIUS_METERS,
} from '@/lib/domain/geo';
import { ComplaintCategory } from '@prisma/client';

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get('lat');
    const lngStr = searchParams.get('lng');
    const categoryStr = searchParams.get('category');

    if (!latStr || !lngStr) {
      return NextResponse.json({ error: 'Missing coordinates' }, { status: 400 });
    }

    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lngStr);

    if (!isValidCoordinate({ latitude, longitude })) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    const category = categoryStr as ComplaintCategory;

    // Fast indexed bounding box query
    const box = getBoundingBox({ latitude, longitude }, DUPLICATE_DETECTION_RADIUS_METERS);

    const candidates = await prisma.complaint.findMany({
      where: {
        status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'REOPENED'] },
        ...(category && Object.values(ComplaintCategory).includes(category) ? { category } : {}),
        latitude: {
          gte: box.minLat,
          lte: box.maxLat,
        },
        longitude: {
          gte: box.minLng,
          lte: box.maxLng,
        },
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
        category: true,
        status: true,
      },
    });

    // Compute exact Haversine distance
    const nearby = candidates.filter((c) => {
      const dist = calculateHaversineDistanceMeters(
        { latitude, longitude },
        { latitude: Number(c.latitude), longitude: Number(c.longitude) }
      );
      return dist <= DUPLICATE_DETECTION_RADIUS_METERS;
    });

    return NextResponse.json({
      duplicateCount: nearby.length,
      warning: nearby.length > 0,
      radiusMeters: DUPLICATE_DETECTION_RADIUS_METERS,
    });
  } catch (error) {
    console.error('Duplicate detection error:', error);
    return NextResponse.json({ error: 'Failed to check nearby duplicates' }, { status: 500 });
  }
}
