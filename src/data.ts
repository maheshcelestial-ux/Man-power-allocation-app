/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Operator {
  id: string;
  name: string;
  employeeId: string;
  department: 'Assembly' | 'Machining';
  skills: {
    [cellId: string]: 'Beginner' | 'Intermediate' | 'Expert';
  };
}

export interface Cell {
  id: string;
  name: string;
  department: 'Assembly' | 'Machining';
  defaultOperatorsRequired: number;
}

export interface PartType {
  id: string;
  name: string;
}

export interface ProductionEntry {
  id: string;
  date: string; // YYYY-MM-DD
  shift: 'A' | 'B' | 'C';
  department: 'Assembly' | 'Machining';
  cellId: string;
  partTypeId: string;
  planned: number;
  actual: number;
  rejection: number;
  downtimes: DowntimeEntry[];
  problems: ProblemEntry[];
}

export interface DowntimeEntry {
  id: string;
  reason: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  totalMinutes: number;
  remarks: string;
}

export interface ProblemEntry {
  id: string;
  category: string;
  description: string;
  rootCause: string;
  countermeasure: string;
  responsiblePerson: string;
  status: 'Open' | 'In Progress' | 'Closed';
}

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  shift: 'A' | 'B' | 'C';
  operatorId: string;
  status: 'Present' | 'Absent' | 'Leave' | 'Training';
}

export interface AllocationRequirement {
  cellId: string;
  requiredCount: number;
}

export interface AllocationResult {
  cellId: string;
  allocatedOperators: {
    operatorId: string;
    operatorName: string;
    skillLevel: 'Beginner' | 'Intermediate' | 'Expert';
  }[];
}

// Predefined lists
export const DOWNTIME_REASONS = [
  'Breakdown',
  'Setup Change',
  'Tool Change',
  'Startup Loss',
  'Minor Stoppage',
  'No Material',
  'No Tool',
  'No Operator',
  'Logistics Delay',
  'Quality Adjustment',
  'MEA Adjustment',
  'Power Failure',
  'Waiting for Inspection',
  'Others'
];

export const PROBLEM_CATEGORIES = [
  'Tooling Failure',
  'Pneumatic Pressure Leak',
  'Material Shortage Assembly Line',
  'Screwdriver Calibration Issue',
  'Pump Body Casting Crack',
  'Leakage Tester Malfunction',
  'Operator Skill Gaps',
  'Packing Logistics Delay',
  'Fixture Alignment Drift',
  'Others'
];

// Seed Data
export const INITIAL_CELLS: Cell[] = [
  { id: 'cell-1', name: 'PT4 Assembly', department: 'Assembly', defaultOperatorsRequired: 3 },
  { id: 'cell-2', name: 'Vista Assembly', department: 'Assembly', defaultOperatorsRequired: 2 },
  { id: 'cell-3', name: 'ETB Assembly', department: 'Assembly', defaultOperatorsRequired: 2 },
  { id: 'cell-4', name: 'JCB Assembly', department: 'Assembly', defaultOperatorsRequired: 2 },
  { id: 'cell-5', name: 'Machining Cell 1', department: 'Machining', defaultOperatorsRequired: 2 },
  { id: 'cell-6', name: 'Machining Cell 2', department: 'Machining', defaultOperatorsRequired: 2 },
  { id: 'cell-7', name: 'Machining Cell 3', department: 'Machining', defaultOperatorsRequired: 1 }
];

export const INITIAL_PARTS: PartType[] = [
  { id: 'part-1', name: 'PT4 Pump' },
  { id: 'part-2', name: 'Vista Pump' },
  { id: 'part-3', name: 'ETB Series' },
  { id: 'part-4', name: 'JCB Main Cast' },
  { id: 'part-5', name: 'Perkins 900' },
  { id: 'part-6', name: 'Custom Product' }
];

export const INITIAL_OPERATORS: Operator[] = [
  {
    id: 'op-1',
    name: 'Mahesh Kumar',
    employeeId: 'EMP-1001',
    department: 'Assembly',
    skills: {
      'cell-1': 'Expert',
      'cell-2': 'Expert',
      'cell-4': 'Expert',
      'cell-3': 'Intermediate',
      'cell-5': 'Beginner'
    }
  },
  {
    id: 'op-2',
    name: 'Rahul Sharma',
    employeeId: 'EMP-1002',
    department: 'Assembly',
    skills: {
      'cell-1': 'Intermediate',
      'cell-3': 'Expert',
      'cell-4': 'Beginner'
    }
  },
  {
    id: 'op-3',
    name: 'Amit Patel',
    employeeId: 'EMP-1003',
    department: 'Assembly',
    skills: {
      'cell-2': 'Expert',
      'cell-1': 'Intermediate',
      'cell-3': 'Beginner'
    }
  },
  {
    id: 'op-4',
    name: 'Ramesh Chawla',
    employeeId: 'EMP-1004',
    department: 'Machining',
    skills: {
      'cell-5': 'Expert',
      'cell-6': 'Expert',
      'cell-7': 'Intermediate'
    }
  },
  {
    id: 'op-5',
    name: 'Vikram Singh',
    employeeId: 'EMP-1005',
    department: 'Machining',
    skills: {
      'cell-5': 'Intermediate',
      'cell-6': 'Intermediate',
      'cell-7': 'Expert'
    }
  },
  {
    id: 'op-6',
    name: 'Suresh Patil',
    employeeId: 'EMP-1006',
    department: 'Assembly',
    skills: {
      'cell-1': 'Beginner',
      'cell-3': 'Expert',
      'cell-4': 'Expert'
    }
  },
  {
    id: 'op-7',
    name: 'Kartik Iyer',
    employeeId: 'EMP-1007',
    department: 'Assembly',
    skills: {
      'cell-2': 'Intermediate',
      'cell-3': 'Intermediate',
      'cell-4': 'Expert'
    }
  },
  {
    id: 'op-8',
    name: 'Anup Nair',
    employeeId: 'EMP-1008',
    department: 'Machining',
    skills: {
      'cell-5': 'Beginner',
      'cell-6': 'Expert',
      'cell-7': 'Expert'
    }
  },
  {
    id: 'op-9',
    name: 'Manish Verma',
    employeeId: 'EMP-1009',
    department: 'Assembly',
    skills: {
      'cell-1': 'Intermediate',
      'cell-2': 'Beginner',
      'cell-4': 'Intermediate'
    }
  },
  {
    id: 'op-10',
    name: 'Deepak Joshi',
    employeeId: 'EMP-1010',
    department: 'Machining',
    skills: {
      'cell-5': 'Expert',
      'cell-6': 'Intermediate'
    }
  },
  {
    id: 'op-11',
    name: 'Rohan Mehra',
    employeeId: 'EMP-1011',
    department: 'Assembly',
    skills: {
      'cell-1': 'Expert',
      'cell-3': 'Expert'
    }
  },
  {
    id: 'op-12',
    name: 'Shyam Sundar',
    employeeId: 'EMP-1012',
    department: 'Assembly',
    skills: {
      'cell-2': 'Expert',
      'cell-4': 'Intermediate'
    }
  }
];

// Production Log History Seeds for past days to compute nice trend and figures
export const INITIAL_PRODUCTION_LOGS: ProductionEntry[] = [
  // June 19, Shift A
  {
    id: 'p-1',
    date: '2026-06-19',
    shift: 'A',
    department: 'Assembly',
    cellId: 'cell-1',
    partTypeId: 'part-1',
    planned: 100,
    actual: 92,
    rejection: 3,
    downtimes: [
      { id: 'dt-1', reason: 'Setup Change', startTime: '08:30', endTime: '09:00', totalMinutes: 30, remarks: 'New fixture setup' },
      { id: 'dt-2', reason: 'No Tool', startTime: '11:15', endTime: '11:45', totalMinutes: 30, remarks: 'Waiting for calibration hex tool' }
    ],
    problems: [
      { id: 'pr-1', category: 'Tooling Failure', description: 'Hex screwdriver slipped', rootCause: 'Bit worn out', countermeasure: 'Replaced with carbide bits', responsiblePerson: 'Mr. Verma', status: 'Closed' }
    ]
  },
  {
    id: 'p-2',
    date: '2026-06-19',
    shift: 'A',
    department: 'Assembly',
    cellId: 'cell-2',
    partTypeId: 'part-2',
    planned: 80,
    actual: 76,
    rejection: 1,
    downtimes: [],
    problems: []
  },
  {
    id: 'p-3',
    date: '2026-06-19',
    shift: 'A',
    department: 'Machining',
    cellId: 'cell-5',
    partTypeId: 'part-4',
    planned: 120,
    actual: 110,
    rejection: 4,
    downtimes: [
      { id: 'dt-3', reason: 'Breakdown', startTime: '10:00', endTime: '10:45', totalMinutes: 45, remarks: 'Hydraulic leak' }
    ],
    problems: []
  },
  // June 19, Shift B
  {
    id: 'p-4',
    date: '2026-06-19',
    shift: 'B',
    department: 'Assembly',
    cellId: 'cell-1',
    partTypeId: 'part-1',
    planned: 100,
    actual: 85,
    rejection: 5,
    downtimes: [
      { id: 'dt-4', reason: 'Logistics Delay', startTime: '15:30', endTime: '16:10', totalMinutes: 40, remarks: 'Forklift battery drained' }
    ],
    problems: []
  },
  {
    id: 'p-5',
    date: '2026-06-19',
    shift: 'B',
    department: 'Machining',
    cellId: 'cell-6',
    partTypeId: 'part-5',
    planned: 90,
    actual: 88,
    rejection: 2,
    downtimes: [],
    problems: []
  },
  // June 20 (Today)
  {
    id: 'p-6',
    date: '2026-06-20',
    shift: 'A',
    department: 'Assembly',
    cellId: 'cell-1',
    partTypeId: 'part-1',
    planned: 100,
    actual: 95,
    rejection: 2,
    downtimes: [
      { id: 'dt-5', reason: 'Minor Stoppage', startTime: '09:00', endTime: '09:12', totalMinutes: 12, remarks: 'Sensor cleaning' }
    ],
    problems: []
  },
  {
    id: 'p-7',
    date: '2026-06-20',
    shift: 'A',
    department: 'Assembly',
    cellId: 'cell-2',
    partTypeId: 'part-2',
    planned: 80,
    actual: 70,
    rejection: 6,
    downtimes: [
      { id: 'dt-6', reason: 'Breakdown', startTime: '11:00', endTime: '12:00', totalMinutes: 60, remarks: 'Air valve leak' }
    ],
    problems: [
      { id: 'pr-2', category: 'Pneumatic Pressure Leak', description: 'Cylinder pressure dropped below 4bar', rootCause: 'Seal worn out', countermeasure: 'Replaced cylinder seals', responsiblePerson: 'J. Fernandes', status: 'In Progress' }
    ]
  },
  {
    id: 'p-8',
    date: '2026-06-20',
    shift: 'A',
    department: 'Machining',
    cellId: 'cell-5',
    partTypeId: 'part-4',
    planned: 120,
    actual: 105,
    rejection: 3,
    downtimes: [
      { id: 'dt-7', reason: 'No Tool', startTime: '08:15', endTime: '09:00', totalMinutes: 45, remarks: 'Carbide insert delay' }
    ],
    problems: []
  }
];

// Helper to load state from localStorage or use initial seeds
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.warn(`Error loading ${key} from storage`, error);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key} to storage`, error);
  }
}

// OEE Calculation Engine
// OEE = Availability * Performance * Quality
export interface OEEStats {
  availability: number; // %
  performance: number; // %
  quality: number; // %
  oee: number; // %
  totalPlanned: number;
  totalActual: number;
  totalRejection: number;
  totalDowntimeMinutes: number;
  totalWorkMinutes: number;
}

export function calculateOEE(entries: ProductionEntry[]): OEEStats {
  let totalPlanned = 0;
  let totalActual = 0;
  let totalRejection = 0;
  let totalDowntimeMinutes = 0;

  // Assume shift length is 480 minutes (8 hours) per entry
  let totalWorkMinutes = entries.length * 480;

  entries.forEach(e => {
    totalPlanned += e.planned;
    totalActual += e.actual;
    totalRejection += e.rejection;
    
    const entryDowntime = e.downtimes.reduce((sum, dt) => sum + dt.totalMinutes, 0);
    totalDowntimeMinutes += entryDowntime;
  });

  if (entries.length === 0) {
    return {
      availability: 0,
      performance: 0,
      quality: 0,
      oee: 0,
      totalPlanned: 0,
      totalActual: 0,
      totalRejection: 0,
      totalDowntimeMinutes: 0,
      totalWorkMinutes: 0
    };
  }

  // 1. Availability = (Planned Running Time - Downtime) / Planned Running Time
  // Planned Running Time = Shift Duration (480 mins)
  const plannedRunningTime = totalWorkMinutes;
  const actualRunningTime = Math.max(0, plannedRunningTime - totalDowntimeMinutes);
  const availability = plannedRunningTime > 0 ? (actualRunningTime / plannedRunningTime) * 100 : 0;

  // 2. Performance = (Actual Produced / (Standard Rate * Actual Running Time))
  // For a unified rate, standard rate is totalPlanned / totalWorkMinutes components/min.
  // Performance = Actual Production / Planned Production (scaled to actual running time/downtime shift loss)
  // Or in industrial standard: Performance = Actual Production / Target for running time.
  // Running target = Planned * (Actual Running Time / Shift Duration)
  // Let's use standard simplified calculation: (Actual Produced / Planned Target) if no downtime,
  // adjusted by availability ratio.
  // Standard MES Performance = (Actual Quantity / Ideal Run Rate in running time)
  // If we assume the planned quantity is the ideal rate for 480 mins, then ideal run rate is planned / 480
  // Ideal targets in running time = (totalPlanned / totalWorkMinutes) * actualRunningTime
  const idealTargetInRunningTime = (totalPlanned / totalWorkMinutes) * actualRunningTime;
  const performance = idealTargetInRunningTime > 0 ? (totalActual / idealTargetInRunningTime) * 100 : 0;

  // 3. Quality = Good Parts / Total Parts
  // Good Parts = Total Actual - Rejection
  const goodParts = Math.max(0, totalActual - totalRejection);
  const quality = totalActual > 0 ? (goodParts / totalActual) * 100 : 100;

  // Overall OEE %
  const oee = (availability / 100) * (performance / 100) * (quality / 100) * 100;

  return {
    availability: Math.min(100, Math.round(availability * 10) / 10),
    performance: Math.min(100, Math.round(performance * 10) / 10),
    quality: Math.min(100, Math.round(quality * 10) / 10),
    oee: Math.min(100, Math.round(oee * 10) / 10),
    totalPlanned,
    totalActual,
    totalRejection,
    totalDowntimeMinutes,
    totalWorkMinutes
  };
}

// SMART MANPOWER ALLOCATION AUTOMATION ALGORITHM
export function runManpowerAllocation(
  date: string,
  shift: 'A' | 'B' | 'C',
  operators: Operator[],
  attendance: AttendanceRecord[],
  cells: Cell[],
  requirements: AllocationRequirement[]
): {
  allocations: AllocationResult[];
  unallocatedOperators: {
    operatorId: string;
    operatorName: string;
    department: 'Assembly' | 'Machining';
  }[];
  criticalSkillShortages: { cellId: string; missingCount: number }[];
  skillUtilizationRate: number;
} {
  // Step 1: Filter Operators who are on site today (Status: Present or Training)
  const presentOpIds = new Set(
    attendance
      .filter(record => record.date === date && record.shift === shift && (record.status === 'Present' || record.status === 'Training'))
      .map(r => r.operatorId)
  );

  const availableOperators = operators.filter(op => presentOpIds.has(op.id));

  // Keep track of who is allocated
  const allocatedOpIds = new Set<string>();

  // Prepare allocation sheet template
  const allocations: AllocationResult[] = requirements
    .filter(req => req.requiredCount > 0)
    .map(req => ({
      cellId: req.cellId,
      allocatedOperators: []
    }));

  const criticalSkillShortages: { cellId: string; missingCount: number }[] = [];

  // Step 2: Build a map. For each running cell and slot needed, find the best skilled available operators.
  // We prioritize 'Expert', then 'Intermediate', then 'Beginner' operators.
  // To satisfy 'prioritizes Expert, balances workload', we do allocation slot-by-slot of all cells.
  // We can fill Expert level slots first across ALL cells, then Intermediate, then Beginner, to distribute talent fairly!
  
  const skillRanks: ('Expert' | 'Intermediate' | 'Beginner')[] = ['Expert', 'Intermediate', 'Beginner'];

  // Let's iterate ranks first to assign Experts first to where they are needed!
  skillRanks.forEach(targetLevel => {
    // Fill until cell requirement is met
    allocations.forEach(alloc => {
      const cellId = alloc.cellId;
      const targetReq = requirements.find(r => r.cellId === cellId)?.requiredCount || 0;
      
      // Let's see how many more operators we need for this cell
      let needed = targetReq - alloc.allocatedOperators.length;

      while (needed > 0) {
        // Find an unallocated operator with 'targetLevel' skill for this cell
        const candidate = availableOperators.find(op => {
          if (allocatedOpIds.has(op.id)) return false;
          // Check if operator possesses this specific level of skill for this cell
          return op.skills[cellId] === targetLevel;
        });

        if (candidate) {
          alloc.allocatedOperators.push({
            operatorId: candidate.id,
            operatorName: candidate.name,
            skillLevel: targetLevel
          });
          allocatedOpIds.add(candidate.id);
          needed--;
        } else {
          break; // No more candidates of this level; we will find lower levels in future iterations
        }
      }
    });
  });

  // What about slots that are still unfilled?
  // Let's do a fallback search where we assign *any* suitable operator who has *any* skill level (Beginner/Intermediate/Expert)
  // for the cell who is not yet allocated (just in case they were skipped during strict matching, e.g., if we had multi-skilled but we did strict loop).
  // Actually, some operators have multiple skills. 
  allocations.forEach(alloc => {
    const cellId = alloc.cellId;
    const targetReq = requirements.find(r => r.cellId === cellId)?.requiredCount || 0;
    let needed = targetReq - alloc.allocatedOperators.length;

    while (needed > 0) {
      // Find candidate with any skill level for this cell (Expert, Intermediate, then Beginner)
      let foundCandidate = false;
      for (const level of skillRanks) {
        const candidate = availableOperators.find(op => !allocatedOpIds.has(op.id) && op.skills[cellId] === level);
        if (candidate) {
          alloc.allocatedOperators.push({
            operatorId: candidate.id,
            operatorName: candidate.name,
            skillLevel: level
          });
          allocatedOpIds.add(candidate.id);
          needed--;
          foundCandidate = true;
          break;
        }
      }
      if (!foundCandidate) {
        // No operator on site has skills for this cell!
        break;
      }
    }

    if (needed > 0) {
      criticalSkillShortages.push({
        cellId,
        missingCount: needed
      });
    }
  });

  // List of unallocated Operators
  const unallocatedOperators = availableOperators
    .filter(op => !allocatedOpIds.has(op.id))
    .map(op => ({
      operatorId: op.id,
      operatorName: op.name,
      department: op.department
    }));

  // Skill utilization rate computation:
  // % of present operators that are actively allocated
  const presentCount = availableOperators.length;
  const allocatedCount = allocatedOpIds.size;
  const skillUtilizationRate = presentCount > 0 ? Math.round((allocatedCount / presentCount) * 100) : 0;

  return {
    allocations,
    unallocatedOperators,
    criticalSkillShortages,
    skillUtilizationRate
  };
}

// Generate automatic manufacturing manager insights
export function generateProductionInsights(entries: ProductionEntry[], cells: Cell[], parts: PartType[]): string[] {
  const insights: string[] = [];
  if (entries.length === 0) return ['No production data entered for this period to compile insights.'];

  // 1. Identify low efficiency production cells (actual < planned)
  const cellStats: { [id: string]: { planned: number; actual: number; cellName: string; rejection: number; downtime: number } } = {};
  
  entries.forEach(e => {
    const cell = cells.find(c => c.id === e.cellId);
    const cellName = cell ? cell.name : 'Unknown Cell';
    if (!cellStats[e.cellId]) {
      cellStats[e.cellId] = { planned: 0, actual: 0, cellName, rejection: 0, downtime: 0 };
    }
    cellStats[e.cellId].planned += e.planned;
    cellStats[e.cellId].actual += e.actual;
    cellStats[e.cellId].rejection += e.rejection;
    cellStats[e.cellId].downtime += e.downtimes.reduce((sum, dt) => sum + dt.totalMinutes, 0);
  });

  // 2. Identify top downtime reasons
  const downtimeMap: { [reason: string]: number } = {};
  entries.forEach(e => {
    e.downtimes.forEach(dt => {
      downtimeMap[dt.reason] = (downtimeMap[dt.reason] || 0) + dt.totalMinutes;
    });
  });

  const sortedDowntimes = Object.entries(downtimeMap).sort((a, b) => b[1] - a[1]);

  // 3. Low performing cell logic
  let lowestRatio = 1.0;
  let lowestCellInfo: typeof cellStats[string] | null = null;
  Object.values(cellStats).forEach(stat => {
    if (stat.planned > 0) {
      const ratio = stat.actual / stat.planned;
      if (ratio < lowestRatio) {
        lowestRatio = ratio;
        lowestCellInfo = stat;
      }
    }
  });

  // Write actual smart insights
  if (lowestCellInfo && lowestRatio < 0.85) {
    const percent = Math.round(lowestRatio * 100);
    insights.push(
      `⚠️ ${lowestCellInfo!.cellName} achieved only ${percent}% of target (${lowestCellInfo!.actual}/${lowestCellInfo!.planned} quantity) this period.`
    );
  }

  if (sortedDowntimes.length > 0) {
    const topReason = sortedDowntimes[0][0];
    const topMinutes = sortedDowntimes[0][1];
    insights.push(
      `⏱️ Top productivity loss vector: "${topReason}" accounted for ${topMinutes} minutes of total shop floor stoppage.`
    );
  }

  // Large rejection rate analysis
  const cellsWithHighRejection = Object.values(cellStats).filter(s => s.actual > 0 && (s.rejection / s.actual) > 0.05);
  if (cellsWithHighRejection.length > 0) {
    cellsWithHighRejection.forEach(c => {
      const rejectPct = Math.round((c.rejection / c.actual) * 100);
      insights.push(
        `🛑 High Quality Risk: ${c.cellName} reported a warning rejection rate of ${rejectPct}% (${c.rejection} parts rejected).`
      );
    });
  }

  // Active status problems
  const openProblems = entries.flatMap(e => e.problems).filter(p => p.status !== 'Closed');
  if (openProblems.length > 0) {
    insights.push(`🔧 Handover Alert: There are ${openProblems.length} open maintenance/process logs on the shop floor under monitoring.`);
  }

  // Generic reassuring insight if metrics are excellent
  if (insights.length === 0) {
    insights.push(`✅ Lean Flow Achieved: All manufacturing cells operating within standard target variance (>90% compliance).`);
  }

  return insights;
}
