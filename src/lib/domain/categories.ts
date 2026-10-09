import { ComplaintCategory, DepartmentCode } from '@prisma/client';

export interface CategoryMetadata {
  code: ComplaintCategory;
  label: string;
  departmentCode: DepartmentCode;
  departmentName: string;
  description: string;
  iconName: string;
}

export const CATEGORY_DEFINITIONS: Record<ComplaintCategory, CategoryMetadata> = {
  POTHOLES: {
    code: 'POTHOLES',
    label: 'Potholes',
    departmentCode: 'ROADS',
    departmentName: 'Roads & Infrastructure Department',
    description: 'Road surface craters, bitumen deterioration, and crater hazards',
    iconName: 'RoadHorizon',
  },
  ROAD_DAMAGE: {
    code: 'ROAD_DAMAGE',
    label: 'Road Damage',
    departmentCode: 'ROADS',
    departmentName: 'Roads & Infrastructure Department',
    description: 'Cracked pavement, sinkholes, broken kerbs, or divider damage',
    iconName: 'WarningCircle',
  },
  TRAFFIC_INFRASTRUCTURE: {
    code: 'TRAFFIC_INFRASTRUCTURE',
    label: 'Traffic Infrastructure',
    departmentCode: 'ROADS',
    departmentName: 'Roads & Infrastructure Department',
    description: 'Traffic signals, missing road signs, pedestrian crossings, barricades',
    iconName: 'TrafficSignal',
  },
  WATER_LEAKAGE: {
    code: 'WATER_LEAKAGE',
    label: 'Water Leakage',
    departmentCode: 'WATER',
    departmentName: 'Water Supply & Sewerage Board',
    description: 'Burst main pipes, leaking valves, contaminated water, supply failure',
    iconName: 'Drop',
  },
  GARBAGE_COLLECTION: {
    code: 'GARBAGE_COLLECTION',
    label: 'Garbage Collection',
    departmentCode: 'SANITATION',
    departmentName: 'Solid Waste Management & Sanitation',
    description: 'Uncollected domestic waste, overflowing bins, missed collection trucks',
    iconName: 'Trash',
  },
  PUBLIC_SANITATION: {
    code: 'PUBLIC_SANITATION',
    label: 'Public Sanitation',
    departmentCode: 'SANITATION',
    departmentName: 'Solid Waste Management & Sanitation',
    description: 'Open defecation spots, unclean public toilets, animal carcass removal',
    iconName: 'Broom',
  },
  STREETLIGHT_FAILURE: {
    code: 'STREETLIGHT_FAILURE',
    label: 'Streetlight Failure',
    departmentCode: 'LIGHTING',
    departmentName: 'Street Lighting & Electrical Division',
    description: 'Dark streets, flickering fixtures, dangling wires, timer malfunction',
    iconName: 'Lightning',
  },
  DRAINAGE_PROBLEMS: {
    code: 'DRAINAGE_PROBLEMS',
    label: 'Drainage Problems',
    departmentCode: 'DRAINAGE',
    departmentName: 'Storm Water Drainage Division',
    description: 'Clogged drains, flood water accumulation, missing manhole covers',
    iconName: 'Waves',
  },
  PUBLIC_PROPERTY_DAMAGE: {
    code: 'PUBLIC_PROPERTY_DAMAGE',
    label: 'Public Property Damage',
    departmentCode: 'GENERAL',
    departmentName: 'General Civic Administration',
    description: 'Damaged park benches, broken bus shelters, defaced public structures',
    iconName: 'Buildings',
  },
  OTHER: {
    code: 'OTHER',
    label: 'Other Civic Grievance',
    departmentCode: 'GENERAL',
    departmentName: 'General Civic Administration',
    description: 'Other non-emergency municipal complaints requiring administration review',
    iconName: 'Question',
  },
};

export const CATEGORY_OPTIONS = Object.values(CATEGORY_DEFINITIONS);

export function getDepartmentForCategory(category: ComplaintCategory): DepartmentCode {
  return CATEGORY_DEFINITIONS[category]?.departmentCode ?? 'GENERAL';
}
