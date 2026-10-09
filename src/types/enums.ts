/**
 * FixMyCity Client-Safe Domain Enums and Types
 *
 * These TypeScript enums and const objects mirror the Prisma schema enums exactly.
 * They are safe to use in React Client Components without pulling '@prisma/client'
 * or its browser stubs into client bundles.
 */

export const Role = {
  CITIZEN: 'CITIZEN',
  ADMIN: 'ADMIN',
  WORKER: 'WORKER',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const DepartmentCode = {
  ROADS: 'ROADS',
  WATER: 'WATER',
  SANITATION: 'SANITATION',
  LIGHTING: 'LIGHTING',
  DRAINAGE: 'DRAINAGE',
  GENERAL: 'GENERAL',
} as const;
export type DepartmentCode = (typeof DepartmentCode)[keyof typeof DepartmentCode];

export const ComplaintStatus = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  UNDER_REVIEW: 'UNDER_REVIEW',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
  REOPENED: 'REOPENED',
} as const;
export type ComplaintStatus = (typeof ComplaintStatus)[keyof typeof ComplaintStatus];

export const ComplaintCategory = {
  POTHOLES: 'POTHOLES',
  ROAD_DAMAGE: 'ROAD_DAMAGE',
  TRAFFIC_INFRASTRUCTURE: 'TRAFFIC_INFRASTRUCTURE',
  WATER_LEAKAGE: 'WATER_LEAKAGE',
  GARBAGE_COLLECTION: 'GARBAGE_COLLECTION',
  PUBLIC_SANITATION: 'PUBLIC_SANITATION',
  STREETLIGHT_FAILURE: 'STREETLIGHT_FAILURE',
  DRAINAGE_PROBLEMS: 'DRAINAGE_PROBLEMS',
  PUBLIC_PROPERTY_DAMAGE: 'PUBLIC_PROPERTY_DAMAGE',
  OTHER: 'OTHER',
} as const;
export type ComplaintCategory = (typeof ComplaintCategory)[keyof typeof ComplaintCategory];

export const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const PhotoKind = {
  EVIDENCE: 'EVIDENCE',
  RESOLUTION: 'RESOLUTION',
} as const;
export type PhotoKind = (typeof PhotoKind)[keyof typeof PhotoKind];

export const EventType = {
  STATUS: 'STATUS',
  ASSIGNMENT: 'ASSIGNMENT',
  NOTE: 'NOTE',
  FEEDBACK: 'FEEDBACK',
} as const;
export type EventType = (typeof EventType)[keyof typeof EventType];

export const EventVisibility = {
  PUBLIC: 'PUBLIC',
  INTERNAL: 'INTERNAL',
} as const;
export type EventVisibility = (typeof EventVisibility)[keyof typeof EventVisibility];

export const BillService = {
  ELECTRICITY: 'ELECTRICITY',
  WATER: 'WATER',
  PROPERTY_TAX: 'PROPERTY_TAX',
  WASTE: 'WASTE',
} as const;
export type BillService = (typeof BillService)[keyof typeof BillService];

export const BillStatus = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
} as const;
export type BillStatus = (typeof BillStatus)[keyof typeof BillStatus];

export const PaymentMethodCode = {
  DEMO_UPI: 'DEMO_UPI',
  DEMO_CARD: 'DEMO_CARD',
  DEMO_NET_BANKING: 'DEMO_NET_BANKING',
  DEMO_WALLET: 'DEMO_WALLET',
  DEMO_CASH_COUNTER: 'DEMO_CASH_COUNTER',
} as const;
export type PaymentMethodCode = (typeof PaymentMethodCode)[keyof typeof PaymentMethodCode];

export const PaymentStatus = {
  SUCCEEDED: 'SUCCEEDED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const AnnouncementCategory = {
  GENERAL: 'GENERAL',
  SERVICE_UPDATE: 'SERVICE_UPDATE',
  MAINTENANCE: 'MAINTENANCE',
  EMERGENCY: 'EMERGENCY',
  EVENT: 'EVENT',
  ADVISORY: 'ADVISORY',
} as const;
export type AnnouncementCategory = (typeof AnnouncementCategory)[keyof typeof AnnouncementCategory];

export const AnnouncementStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type AnnouncementStatus = (typeof AnnouncementStatus)[keyof typeof AnnouncementStatus];
