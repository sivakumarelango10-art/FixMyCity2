import { ComplaintCategory, Priority, DepartmentCode } from '@prisma/client';
import { getDepartmentForCategory } from './categories';

export interface ClassificationResult {
  category: ComplaintCategory;
  priority: Priority;
  departmentCode: DepartmentCode;
  explanation: string;
  source: 'GEMINI' | 'RULES';
  signals: string[];
}

interface RuleDefinition {
  category: ComplaintCategory;
  keywords: string[];
  priorityIndicators?: {
    critical?: string[];
    high?: string[];
    low?: string[];
  };
}

const RULES: RuleDefinition[] = [
  {
    category: 'POTHOLES',
    keywords: ['pothole', 'pot hole', 'crater', 'asphalt hole', 'road pit', 'surface depression'],
    priorityIndicators: {
      critical: ['huge', 'massive', 'accident', 'deep crater', 'bike skid', 'fatal', 'hazard'],
      high: ['busy road', 'main road', 'traffic jam', 'vehicle damage', 'deep'],
      low: ['small', 'minor', 'side lane'],
    },
  },
  {
    category: 'ROAD_DAMAGE',
    keywords: ['road broken', 'tar broken', 'kerb broken', 'divider broken', 'sinkhole', 'cave in', 'collapsed road', 'pavement crack'],
    priorityIndicators: {
      critical: ['sinkhole', 'cave in', 'collapse', 'blocked highway'],
      high: ['divider broken', 'dangerous turn'],
    },
  },
  {
    category: 'TRAFFIC_INFRASTRUCTURE',
    keywords: ['traffic light', 'traffic signal', 'signal not working', 'stop sign', 'zebra crossing', 'speed breaker', 'barricade'],
    priorityIndicators: {
      critical: ['major junction', 'collision', 'deadly intersection', 'signal failure'],
      high: ['peak hour', 'rush hour', 'blinking red'],
    },
  },
  {
    category: 'WATER_LEAKAGE',
    keywords: ['water leak', 'burst pipe', 'pipe burst', 'drinking water', 'pipeline leak', 'gushing water', 'water supply', 'contamination'],
    priorityIndicators: {
      critical: ['main pipe burst', 'flooding houses', 'severely contaminated', 'poisonous'],
      high: ['huge wastage', 'drinking water wasted', 'no supply for days'],
    },
  },
  {
    category: 'GARBAGE_COLLECTION',
    keywords: ['garbage', 'trash', 'waste', 'dump', 'overflowing bin', 'debris', 'litter', 'rubbish', 'collection truck', 'waste pile'],
    priorityIndicators: {
      critical: ['near school', 'near hospital', 'toxic waste', 'fire hazard'],
      high: ['stray dogs', 'rotting', 'foul smell', '1 week'],
    },
  },
  {
    category: 'PUBLIC_SANITATION',
    keywords: ['sanitation', 'public toilet', 'open defecation', 'urinal', 'sewage smell', 'dead animal', 'carcass', 'septic'],
    priorityIndicators: {
      critical: ['carcass decaying', 'epidemic', 'disease risk'],
      high: ['clogged toilet', 'unbearable stench'],
    },
  },
  {
    category: 'STREETLIGHT_FAILURE',
    keywords: ['streetlight', 'street light', 'lamp post', 'light not working', 'dark street', 'flickering light', 'no light', 'electrical wire'],
    priorityIndicators: {
      critical: ['dangling live wire', 'sparking', 'electric shock risk'],
      high: ['completely pitch dark', 'women safety', 'crime hotspot'],
    },
  },
  {
    category: 'DRAINAGE_PROBLEMS',
    keywords: ['drain', 'drainage', 'gutter', 'manhole', 'sewer', 'clogged drain', 'storm water', 'waterlogging', 'overflowing drain'],
    priorityIndicators: {
      critical: ['open manhole', 'child risk', 'severe flooding into homes'],
      high: ['monsoon rain', 'mosquito breeding', 'knee deep water'],
    },
  },
  {
    category: 'PUBLIC_PROPERTY_DAMAGE',
    keywords: ['park bench', 'bus shelter', 'public wall', 'railing', 'statue', 'monument', 'playground equipment', 'government property'],
    priorityIndicators: {
      critical: ['bus stop roof falling', 'imminent collapse'],
      high: ['vandalism', 'broken iron railing'],
    },
  },
];

/**
 * Deterministic rule-based classifier for complaints.
 * Scans title and description for keywords and priority indicators.
 */
export function classifyWithRules(input: {
  title: string;
  description: string;
}): ClassificationResult {
  const combinedText = `${input.title} ${input.description}`.toLowerCase();
  const matchedSignals: string[] = [];

  let bestCategory: ComplaintCategory = 'OTHER';
  let bestScore = 0;
  let detectedPriority: Priority = 'MEDIUM';
  let matchedRule: RuleDefinition | null = null;

  for (const rule of RULES) {
    let score = 0;
    for (const kw of rule.keywords) {
      if (combinedText.includes(kw)) {
        score += kw.split(' ').length > 1 ? 3 : 2;
        matchedSignals.push(kw);
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestCategory = rule.category;
      matchedRule = rule;
    }
  }

  // Determine priority based on matched indicators
  if (matchedRule?.priorityIndicators) {
    if (matchedRule.priorityIndicators.critical?.some((w) => combinedText.includes(w))) {
      detectedPriority = 'CRITICAL';
    } else if (matchedRule.priorityIndicators.high?.some((w) => combinedText.includes(w))) {
      detectedPriority = 'HIGH';
    } else if (matchedRule.priorityIndicators.low?.some((w) => combinedText.includes(w))) {
      detectedPriority = 'LOW';
    }
  }

  const departmentCode = getDepartmentForCategory(bestCategory);

  const explanation =
    bestScore > 0
      ? `Suggested by rule-based classifier based on matched civic signals: "${matchedSignals.slice(0, 3).join(', ')}".`
      : 'Suggested by rule-based classifier (General Civic Administration default).';

  return {
    category: bestCategory,
    priority: detectedPriority,
    departmentCode,
    explanation,
    source: 'RULES',
    signals: Array.from(new Set(matchedSignals)),
  };
}
