import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, DepartmentCode, ComplaintStatus, ComplaintCategory, Priority, BillService, PaymentMethodCode } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.cloud' });
dotenv.config();

const pool = new Pool({
  connectionString:
    process.env.DIRECT_URL ||
    process.env.DATABASE_URL ||
    'postgresql://fixmycity:fixmycity_dev_pw@localhost:5433/fixmycity_v3?schema=public',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Stable reserved UUIDs for demo personas
export const DEMO_IDS = {
  CITIZEN: '11111111-1111-4111-a111-111111111111',
  ADMIN: '22222222-2222-4222-a222-222222222222',
  ROADS_WORKER: '33333333-3333-4333-a333-333333333333',
  WATER_WORKER: '44444444-4444-4444-a444-444444444444',
};

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'DemoCitizen@2026!';

async function seed() {
  console.log('--- FixMyCity Idempotent Database Seeding ---');

  // Guard: Refuse to seed production without explicit override
  if (process.env.NODE_ENV === 'production' && process.env.DEMO_PROJECT_ISOLATED !== 'true') {
    throw new Error('Refusing to seed in production without DEMO_PROJECT_ISOLATED=true.');
  }

  // 1. SEED DEPARTMENTS
  console.log('1. Seeding 6 Municipal Departments...');
  const departmentsData: Array<{
    code: DepartmentCode;
    name: string;
    description: string;
    contactEmail: string;
  }> = [
    {
      code: 'ROADS',
      name: 'Roads & Infrastructure Department',
      description: 'Asphalt paving, pothole repairs, bridges, footpaths, and roadway safety infrastructure.',
      contactEmail: 'roads.bbmp@demo.fixmycity.app',
    },
    {
      code: 'WATER',
      name: 'Water Supply & Sewerage Board',
      description: 'Potable water pipelines, underground drainage, sewer leakage, and supply metering.',
      contactEmail: 'bwssb.water@demo.fixmycity.app',
    },
    {
      code: 'SANITATION',
      name: 'Solid Waste Management & Sanitation',
      description: 'Domestic refuse collection, street sweeping, dump clearing, and public sanitation blocks.',
      contactEmail: 'sanitation@demo.fixmycity.app',
    },
    {
      code: 'LIGHTING',
      name: 'Street Lighting & Electrical Division',
      description: 'Public streetlight illumination, pole wiring, LED fixtures, and electrical hazard repairs.',
      contactEmail: 'bescom.lighting@demo.fixmycity.app',
    },
    {
      code: 'DRAINAGE',
      name: 'Storm Water Drainage Division',
      description: 'Monsoon storm water drains, canal desilting, culverts, and flood mitigation channels.',
      contactEmail: 'drainage@demo.fixmycity.app',
    },
    {
      code: 'GENERAL',
      name: 'General Civic Administration',
      description: 'Public property maintenance, civic signage, parks, and general municipal coordination.',
      contactEmail: 'admin@demo.fixmycity.app',
    },
  ];

  const departmentMap = new Map<DepartmentCode, string>();

  for (const dept of departmentsData) {
    const record = await prisma.department.upsert({
      where: { code: dept.code },
      create: { ...dept, isActive: true },
      update: { name: dept.name, description: dept.description },
    });
    departmentMap.set(dept.code, record.id);
  }

  // 2. SEED USERS IN SUPABASE AUTH (IF ADMIN KEY CONFIGURED) & LOCAL PROFILES
  console.log('2. Seeding Demo Users & Profiles...');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY;

  if (supabaseUrl && supabaseSecret) {
    try {
      const adminSupabase = createClient(supabaseUrl, supabaseSecret, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const usersToSync = [
        { id: DEMO_IDS.CITIZEN, email: 'citizen@demo.fixmycity.app', name: 'Ravi Kumar (Citizen Demo)' },
        { id: DEMO_IDS.ADMIN, email: 'admin@demo.fixmycity.app', name: 'Priya Sharma (Admin Demo)' },
        { id: DEMO_IDS.ROADS_WORKER, email: 'roads.worker@demo.fixmycity.app', name: 'Suresh Reddy (Roads Worker Demo)' },
        { id: DEMO_IDS.WATER_WORKER, email: 'water.worker@demo.fixmycity.app', name: 'Kavita Nair (Water Worker Demo)' },
      ];

      for (const u of usersToSync) {
        // Try creating or updating user
        await adminSupabase.auth.admin.createUser({
          id: u.id,
          email: u.email,
          password: DEMO_PASSWORD,
          email_confirm: true,
          user_metadata: { full_name: u.name },
        }).catch(() => {
          // If user exists, update password
          return adminSupabase.auth.admin.updateUserById(u.id, {
            password: DEMO_PASSWORD,
          });
        });
      }
      console.log('   ✅ Synced demo users to Supabase Auth.');
    } catch (authSyncErr: any) {
      console.warn('   ⚠️ Could not sync to Supabase Auth admin:', authSyncErr.message);
    }
  }

  // Seed profiles in application DB
  await prisma.profile.upsert({
    where: { id: DEMO_IDS.CITIZEN },
    create: {
      id: DEMO_IDS.CITIZEN,
      email: 'citizen@demo.fixmycity.app',
      fullName: 'Ravi Kumar',
      phone: '+91 98450 12345',
      role: 'CITIZEN',
      isActive: true,
    },
    update: {},
  });

  await prisma.profile.upsert({
    where: { id: DEMO_IDS.ADMIN },
    create: {
      id: DEMO_IDS.ADMIN,
      email: 'admin@demo.fixmycity.app',
      fullName: 'Priya Sharma',
      phone: '+91 98450 54321',
      role: 'ADMIN',
      isActive: true,
    },
    update: {},
  });

  await prisma.profile.upsert({
    where: { id: DEMO_IDS.ROADS_WORKER },
    create: {
      id: DEMO_IDS.ROADS_WORKER,
      email: 'roads.worker@demo.fixmycity.app',
      fullName: 'Suresh Reddy',
      phone: '+91 98450 99881',
      role: 'WORKER',
      departmentId: departmentMap.get('ROADS'),
      isActive: true,
    },
    update: { departmentId: departmentMap.get('ROADS') },
  });

  await prisma.profile.upsert({
    where: { id: DEMO_IDS.WATER_WORKER },
    create: {
      id: DEMO_IDS.WATER_WORKER,
      email: 'water.worker@demo.fixmycity.app',
      fullName: 'Kavita Nair',
      phone: '+91 98450 99882',
      role: 'WORKER',
      departmentId: departmentMap.get('WATER'),
      isActive: true,
    },
    update: { departmentId: departmentMap.get('WATER') },
  });

  // 3. SEED DEMO PAYMENT METHODS & SETTINGS
  console.log('3. Seeding Demo Payment Configuration...');
  await prisma.demoPaymentSettings.upsert({
    where: { id: 'singleton' },
    create: {
      id: 'singleton',
      isPaused: false,
      noticeText: 'DEMO ENVIRONMENT — All payment methods are simulated. No real currency is charged or transferred.',
    },
    update: {}, // Preserve admin modifications on re-run
  });

  const paymentMethodsData: Array<{
    code: PaymentMethodCode;
    displayName: string;
    description: string;
    iconName: string;
    isEnabled: boolean;
    sortOrder: number;
    services: Array<{ service: BillService; isDefault: boolean }>;
  }> = [
    {
      code: 'DEMO_UPI',
      displayName: 'UPI Simulator (Instant Demo)',
      description: 'Simulate instant payment via Virtual Payment Address / QR scan.',
      iconName: 'QrCode',
      isEnabled: true,
      sortOrder: 1,
      services: [
        { service: 'ELECTRICITY', isDefault: true },
        { service: 'WATER', isDefault: true },
        { service: 'PROPERTY_TAX', isDefault: false },
        { service: 'WASTE', isDefault: true },
      ],
    },
    {
      code: 'DEMO_CARD',
      displayName: 'Debit / Credit Card Demo',
      description: 'Simulate Visa, Mastercard, or RuPay simulated transaction.',
      iconName: 'CreditCard',
      isEnabled: true,
      sortOrder: 2,
      services: [
        { service: 'ELECTRICITY', isDefault: false },
        { service: 'WATER', isDefault: false },
        { service: 'PROPERTY_TAX', isDefault: true },
        { service: 'WASTE', isDefault: false },
      ],
    },
    {
      code: 'DEMO_NET_BANKING',
      displayName: 'Net Banking Simulation',
      description: 'Simulate direct bank transfer via authorized nationalized banks.',
      iconName: 'Bank',
      isEnabled: true,
      sortOrder: 3,
      services: [
        { service: 'ELECTRICITY', isDefault: false },
        { service: 'WATER', isDefault: false },
        { service: 'PROPERTY_TAX', isDefault: false },
      ],
    },
    {
      code: 'DEMO_WALLET',
      displayName: 'Civic Wallet Demo',
      description: 'Prepaid municipal balance deduction simulation.',
      iconName: 'Wallet',
      isEnabled: false,
      sortOrder: 4,
      services: [],
    },
    {
      code: 'DEMO_CASH_COUNTER',
      displayName: 'Ward Counter Cash Voucher',
      description: 'Simulate generating cash payment receipt at physical ward office.',
      iconName: 'Money',
      isEnabled: false,
      sortOrder: 5,
      services: [],
    },
  ];

  for (const method of paymentMethodsData) {
    const createdMethod = await prisma.demoPaymentMethod.upsert({
      where: { code: method.code },
      create: {
        code: method.code,
        displayName: method.displayName,
        description: method.description,
        iconName: method.iconName,
        isEnabled: method.isEnabled,
        sortOrder: method.sortOrder,
      },
      update: {
        displayName: method.displayName,
        description: method.description,
        iconName: method.iconName,
      },
    });

    for (const svc of method.services) {
      await prisma.demoPaymentMethodService.upsert({
        where: {
          paymentMethodId_service: {
            paymentMethodId: createdMethod.id,
            service: svc.service,
          },
        },
        create: {
          paymentMethodId: createdMethod.id,
          service: svc.service,
          isDefault: svc.isDefault,
        },
        update: {},
      });
    }
  }

  // 4. SEED DEMO BILLS FOR CITIZEN
  console.log('4. Seeding Demo Bills for Citizen...');
  const billsData: Array<{
    service: BillService;
    periodLabel: string;
    amount: number;
    dueDate: Date;
    status: 'PAID' | 'UNPAID';
    paidAt?: Date;
  }> = [
    {
      service: 'ELECTRICITY',
      periodLabel: 'September 2026',
      amount: 1450.50,
      dueDate: new Date('2026-10-20'),
      status: 'UNPAID',
    },
    {
      service: 'WATER',
      periodLabel: 'Q3 2026',
      amount: 620.00,
      dueDate: new Date('2026-10-25'),
      status: 'UNPAID',
    },
    {
      service: 'PROPERTY_TAX',
      periodLabel: 'FY 2026-2027 (H1)',
      amount: 4850.00,
      dueDate: new Date('2026-11-15'),
      status: 'UNPAID',
    },
    {
      service: 'WASTE',
      periodLabel: 'September 2026',
      amount: 150.00,
      dueDate: new Date('2026-09-30'), // Overdue demo
      status: 'UNPAID',
    },
    {
      service: 'ELECTRICITY',
      periodLabel: 'August 2026',
      amount: 1380.00,
      dueDate: new Date('2026-09-15'),
      status: 'PAID',
      paidAt: new Date('2026-09-10'),
    },
  ];

  const upiMethod = await prisma.demoPaymentMethod.findUnique({
    where: { code: 'DEMO_UPI' },
  });

  for (const b of billsData) {
    const existingBill = await prisma.bill.findFirst({
      where: {
        citizenId: DEMO_IDS.CITIZEN,
        service: b.service,
        periodLabel: b.periodLabel,
      },
    });

    if (!existingBill) {
      const created = await prisma.bill.create({
        data: {
          citizenId: DEMO_IDS.CITIZEN,
          service: b.service,
          periodLabel: b.periodLabel,
          amount: b.amount,
          dueDate: b.dueDate,
          status: b.status,
          paidAt: b.paidAt,
          isDemo: true,
        },
      });

      if (b.status === 'PAID' && upiMethod) {
        await prisma.payment.create({
          data: {
            billId: created.id,
            citizenId: DEMO_IDS.CITIZEN,
            amount: b.amount,
            reference: `DEMO-20260910-${Math.floor(100000 + Math.random() * 900000)}`,
            idempotencyKey: `seed-payment-${created.id}`,
            paymentMethodId: upiMethod.id,
            methodCodeSnapshot: upiMethod.code,
            methodNameSnapshot: upiMethod.displayName,
            status: 'SUCCEEDED',
            createdAt: b.paidAt!,
          },
        });
      }
    }
  }

  // 5. SEED DEMO COMPLAINTS ACROSS BENGALURU
  console.log('5. Seeding Bengaluru Civic Complaints across statuses...');
  const complaintsData = [
    {
      trackingNumber: 'FMC-2026-000001',
      title: 'Deep crater pothole near Indiranagar 100ft Road junction',
      desc: 'Significant pothole causing vehicle diversions and severe two-wheeler skid hazard right before the metro pillar.',
      cat: 'POTHOLES' as ComplaintCategory,
      priority: 'HIGH' as Priority,
      status: 'IN_PROGRESS' as ComplaintStatus,
      dept: 'ROADS' as DepartmentCode,
      lat: 12.9716,
      lng: 77.6412,
      addr: '100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, 560038',
      worker: DEMO_IDS.ROADS_WORKER,
    },
    {
      trackingNumber: 'FMC-2026-000002',
      title: 'Water pipe rupture causing clean water overflow onto main road',
      desc: 'BWSSB distribution line fractured, flooding 5th block for the past 8 hours with thousands of liters lost.',
      cat: 'WATER_LEAKAGE' as ComplaintCategory,
      priority: 'CRITICAL' as Priority,
      status: 'ASSIGNED' as ComplaintStatus,
      dept: 'WATER' as DepartmentCode,
      lat: 12.9352,
      lng: 77.6245,
      addr: '80 Feet Rd, 5th Block, Koramangala, Bengaluru, 560095',
      worker: DEMO_IDS.WATER_WORKER,
    },
    {
      trackingNumber: 'FMC-2026-000003',
      title: 'Overflowing commercial garbage bins near Commercial Street market',
      desc: 'Uncollected refuse spreading across pedestrian walkway, attracting stray animals and blocking shoppers.',
      cat: 'GARBAGE_COLLECTION' as ComplaintCategory,
      priority: 'MEDIUM' as Priority,
      status: 'SUBMITTED' as ComplaintStatus,
      dept: 'SANITATION' as DepartmentCode,
      lat: 12.9822,
      lng: 77.6083,
      addr: 'Tasker Town, Commercial Street, Shivaji Nagar, Bengaluru, 560001',
      worker: null,
    },
    {
      trackingNumber: 'FMC-2026-000004',
      title: 'Flickering streetlights creating dark zone on 11th Main',
      desc: 'Consecutive street lighting poles 42 through 46 are unlit every night after 8 PM, posing pedestrian safety concern.',
      cat: 'STREETLIGHT_FAILURE' as ComplaintCategory,
      priority: 'MEDIUM' as Priority,
      status: 'RESOLVED' as ComplaintStatus,
      dept: 'LIGHTING' as DepartmentCode,
      lat: 12.9250,
      lng: 77.5938,
      addr: '11th Main Rd, 4th Block, Jayanagar, Bengaluru, 560011',
      worker: null,
      resolvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      summary: 'Replacement of faulty photocell timer and LED luminaire completed by BESCOM ward crew.',
    },
    {
      trackingNumber: 'FMC-2026-000005',
      title: 'Clogged storm water drain causing rainwater backflow',
      desc: 'Drainage channel choked with construction debris and silt, resulting in ankle-deep street flooding.',
      cat: 'DRAINAGE_PROBLEMS' as ComplaintCategory,
      priority: 'HIGH' as Priority,
      status: 'UNDER_REVIEW' as ComplaintStatus,
      dept: 'DRAINAGE' as DepartmentCode,
      lat: 13.0033,
      lng: 77.5694,
      addr: 'Margosa Rd, Malleshwaram, Bengaluru, 560003',
      worker: null,
    },
  ];

  for (const c of complaintsData) {
    const existing = await prisma.complaint.findUnique({
      where: { trackingNumber: c.trackingNumber },
    });

    if (!existing) {
      const complaint = await prisma.complaint.create({
        data: {
          trackingNumber: c.trackingNumber,
          trackingYear: 2026,
          citizenId: DEMO_IDS.CITIZEN,
          title: c.title,
          description: c.desc,
          category: c.cat,
          priority: c.priority,
          latitude: c.lat,
          longitude: c.lng,
          address: c.addr,
          publicAreaLabel: c.addr.split(',')[1]?.trim() || 'Bengaluru Central',
          isPublic: true,
          status: c.status,
          departmentId: departmentMap.get(c.dept),
          assignedWorkerId: c.worker,
          aiCategory: c.cat,
          aiPriority: c.priority,
          aiDepartmentCode: c.dept,
          aiExplanation: `Triage keyword match: ${c.cat} routes to ${c.dept} department.`,
          aiSource: 'RULES',
          aiReview: 'ACCEPTED',
          isDemo: true,
          resolvedAt: c.resolvedAt,
          resolutionSummary: c.summary,
        },
      });

      // Insert initial submitted event
      await prisma.complaintEvent.create({
        data: {
          complaintId: complaint.id,
          citizenId: DEMO_IDS.CITIZEN,
          actorId: DEMO_IDS.CITIZEN,
          type: 'STATUS',
          fromStatus: 'DRAFT',
          toStatus: 'SUBMITTED',
          visibility: 'PUBLIC',
          body: 'Complaint filed and registered into Bengaluru municipal system.',
        },
      });

      if (c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS' || c.status === 'RESOLVED') {
        await prisma.complaintEvent.create({
          data: {
            complaintId: complaint.id,
            citizenId: DEMO_IDS.CITIZEN,
            actorId: DEMO_IDS.ADMIN,
            type: 'ASSIGNMENT',
            fromStatus: 'SUBMITTED',
            toStatus: 'ASSIGNED',
            departmentId: departmentMap.get(c.dept),
            visibility: 'PUBLIC',
            body: `Assigned to ${c.dept} department for on-site action.`,
          },
        });
      }

      if (c.status === 'IN_PROGRESS') {
        await prisma.complaintEvent.create({
          data: {
            complaintId: complaint.id,
            citizenId: DEMO_IDS.CITIZEN,
            actorId: c.worker,
            type: 'STATUS',
            fromStatus: 'ASSIGNED',
            toStatus: 'IN_PROGRESS',
            visibility: 'PUBLIC',
            body: 'Field crew arrived on-site and initiated repair operations.',
          },
        });
      }

      if (c.status === 'RESOLVED') {
        await prisma.complaintEvent.create({
          data: {
            complaintId: complaint.id,
            citizenId: DEMO_IDS.CITIZEN,
            actorId: DEMO_IDS.ADMIN,
            type: 'STATUS',
            fromStatus: 'IN_PROGRESS',
            toStatus: 'RESOLVED',
            visibility: 'PUBLIC',
            body: c.summary || 'Work verified and marked resolved by ward supervisor.',
          },
        });
      }
    }
  }

  // 6. SEED DEMO CITY ANNOUNCEMENTS
  console.log('6. Seeding City Announcements...');
  const announcementsData = [
    {
      title: 'Cauvery Water Supply Pipeline Upgrades on October 12',
      summary: 'Scheduled maintenance work will cause intermittent water supply in South Bengaluru wards.',
      body: 'BWSSB will be conducting critical pipeline maintenance and valve replacements along Kanakapura Road and Jayanagar. Residents are advised to store adequate water.',
      category: 'SERVICE_UPDATE' as const,
      status: 'PUBLISHED' as const,
      pinned: true,
      publishedAt: new Date(),
    },
    {
      title: 'Bengaluru Smart Waste Segregation Advisory',
      summary: 'Dry and wet waste separation mandatory for all commercial and residential complexes.',
      body: 'BBMP Solid Waste Management reminds citizens that unsegregated waste will not be collected by municipal compaction trucks. Door-to-door wet waste collection runs daily at 7:00 AM.',
      category: 'ADVISORY' as const,
      status: 'PUBLISHED' as const,
      pinned: false,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      title: 'Monsoon Storm Drain Desilting Campaign Underway',
      summary: 'Pre-monsoon preparedness across East Zone major storm drains.',
      body: 'Engineers are actively desilting tertiary and secondary canals across Bellandur and Mahadevapura. Citizens can report clogged culverts directly on FixMyCity.',
      category: 'MAINTENANCE' as const,
      status: 'PUBLISHED' as const,
      pinned: false,
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const a of announcementsData) {
    const existing = await prisma.announcement.findFirst({
      where: { title: a.title },
    });
    if (!existing) {
      await prisma.announcement.create({
        data: {
          ...a,
          authorId: DEMO_IDS.ADMIN,
          isDemo: true,
        },
      });
    }
  }

  console.log('✅ Seeding completed successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
