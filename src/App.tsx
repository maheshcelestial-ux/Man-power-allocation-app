/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Activity,
  Users,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  Plus,
  Trash2,
  Edit2,
  Settings,
  Calendar,
  Clock,
  FileText,
  Sliders,
  Download,
  LayoutDashboard,
  Sun,
  Moon,
  UserCheck,
  X,
  Play,
  Briefcase,
  AlertCircle,
  Undo
} from 'lucide-react';
import {
  Operator,
  Cell,
  PartType,
  ProductionEntry,
  DowntimeEntry,
  ProblemEntry,
  AttendanceRecord,
  AllocationRequirement,
  AllocationResult,
  DOWNTIME_REASONS,
  PROBLEM_CATEGORIES,
  INITIAL_CELLS,
  INITIAL_PARTS,
  INITIAL_OPERATORS,
  INITIAL_PRODUCTION_LOGS,
  loadFromStorage,
  saveToStorage,
  calculateOEE,
  runManpowerAllocation,
  generateProductionInsights
} from './data';

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => 
    loadFromStorage<boolean>('spmas_dark_mode', false)
  );

  // Active Role state
  const [activeRole, setActiveRole] = useState<'Production Manager' | 'Production Supervisor' | 'Assembly Supervisor' | 'Machining Supervisor' | 'Admin'>(
    'Production Manager'
  );

  // Core collections in state, persisted through localStorage
  const [cells, setCells] = useState<Cell[]>(() => loadFromStorage<Cell[]>('spmas_cells', INITIAL_CELLS));
  const [parts, setParts] = useState<PartType[]>(() => loadFromStorage<PartType[]>('spmas_parts', INITIAL_PARTS));
  const [operators, setOperators] = useState<Operator[]>(() => loadFromStorage<Operator[]>('spmas_operators', INITIAL_OPERATORS));
  const [productionLogs, setProductionLogs] = useState<ProductionEntry[]>(() => loadFromStorage<ProductionEntry[]>('spmas_production_logs', INITIAL_PRODUCTION_LOGS));
  
  // Attendance and Manpower states
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    // Generate initial attendance logs for general demo if empty
    const saved = localStorage.getItem('spmas_attendance');
    if (saved) return JSON.parse(saved);

    // Initial default attendance for June 20, 2026 Shift A
    const initialAtt: AttendanceRecord[] = INITIAL_OPERATORS.map((op, idx) => ({
      id: `att-seed-${idx}`,
      date: '2026-06-20',
      shift: 'A',
      operatorId: op.id,
      status: idx % 6 === 0 ? 'Absent' : idx % 8 === 0 ? 'Leave' : 'Present'
    }));
    return initialAtt;
  });

  const [allocationRequirements, setAllocationRequirements] = useState<AllocationRequirement[]>(() => {
    const saved = localStorage.getItem('spmas_requirements');
    if (saved) return JSON.parse(saved);
    
    // Seed standard requirements based on cells
    return INITIAL_CELLS.map(c => ({
      cellId: c.id,
      requiredCount: c.defaultOperatorsRequired
    }));
  });

  const [allocations, setAllocations] = useState<AllocationResult[]>(() => {
    return loadFromStorage<AllocationResult[]>('spmas_allocations', []);
  });

  // Today context simulation (Static context date/shift for presentation)
  const [simulatedDate, setSimulatedDate] = useState<string>('2026-06-20');
  const [simulatedShift, setSimulatedShift] = useState<'A' | 'B' | 'C'>('A');

  // Input states for Supervisor Entry
  const [entryDate, setEntryDate] = useState<string>('2026-06-20');
  const [entryShift, setEntryShift] = useState<'A' | 'B' | 'C'>('A');
  const [entryDept, setEntryDept] = useState<'Assembly' | 'Machining'>('Assembly');
  const [entryCell, setEntryCell] = useState<string>('cell-1');
  const [entryPart, setEntryPart] = useState<string>('part-1');
  const [entryPlanned, setEntryPlanned] = useState<number>(100);
  const [entryActual, setEntryActual] = useState<number>(90);
  const [entryRejection, setEntryRejection] = useState<number>(0);

  // Downtime form states
  const [dtList, setDtList] = useState<DowntimeEntry[]>([]);
  const [dtReason, setDtReason] = useState<string>(DOWNTIME_REASONS[0]);
  const [dtStart, setDtStart] = useState<string>('08:00');
  const [dtEnd, setDtEnd] = useState<string>('08:30');
  const [dtRemarks, setDtRemarks] = useState<string>('');

  // Daily Repetitive Problem Tracker states
  const [probList, setProbList] = useState<ProblemEntry[]>([]);
  const [probCategory, setProbCategory] = useState<string>(PROBLEM_CATEGORIES[0]);
  const [probDesc, setProbDesc] = useState<string>('');
  const [probCause, setProbCause] = useState<string>('');
  const [probCounter, setProbCounter] = useState<string>('');
  const [probResp, setProbResp] = useState<string>('');
  const [probStatus, setProbStatus] = useState<'Open' | 'In Progress' | 'Closed'>('Open');

  // Admin Crud states
  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  const [newCellName, setNewCellName] = useState<string>('');
  const [newCellDept, setNewCellDept] = useState<'Assembly' | 'Machining'>('Assembly');
  const [newCellReq, setNewCellReq] = useState<number>(2);

  const [editingPartId, setEditingPartId] = useState<string | null>(null);
  const [newPartName, setNewPartName] = useState<string>('');

  const [editingOperatorId, setEditingOperatorId] = useState<string | null>(null);
  const [newOpName, setNewOpName] = useState<string>('');
  const [newOpEmpId, setNewOpEmpId] = useState<string>('');
  const [newOpDept, setNewOpDept] = useState<'Assembly' | 'Machining'>('Assembly');
  const [newOpSkills, setNewOpSkills] = useState<{ [cellId: string]: 'Beginner' | 'Intermediate' | 'Expert' }>({});

  // Active Manager Tab
  const [managerTab, setManagerTab] = useState<'OEE' | 'Manpower' | 'Reports'>('OEE');

  // Report filters state
  const [filterStartDate, setFilterStartDate] = useState<string>('2026-06-19');
  const [filterEndDate, setFilterEndDate] = useState<string>('2026-06-21');
  const [filterShift, setFilterShift] = useState<string>('All');
  const [filterCell, setFilterCell] = useState<string>('All');
  const [filterDept, setFilterDept] = useState<string>('All');

  // Manual Override Allocation State
  const [manualOverrideCellId, setManualOverrideCellId] = useState<string | null>(null);
  const [manualOverrideSlotIndex, setManualOverrideSlotIndex] = useState<number | null>(null);

  // Persists global collections
  useEffect(() => {
    saveToStorage('spmas_dark_mode', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    saveToStorage('spmas_cells', cells);
  }, [cells]);

  useEffect(() => {
    saveToStorage('spmas_parts', parts);
  }, [parts]);

  useEffect(() => {
    saveToStorage('spmas_operators', operators);
  }, [operators]);

  useEffect(() => {
    saveToStorage('spmas_production_logs', productionLogs);
  }, [productionLogs]);

  useEffect(() => {
    saveToStorage('spmas_attendance', attendance);
  }, [attendance]);

  useEffect(() => {
    saveToStorage('spmas_requirements', allocationRequirements);
  }, [allocationRequirements]);

  useEffect(() => {
    saveToStorage('spmas_allocations', allocations);
  }, [allocations]);

  // Adjust Cell Selection based on selected entryDepartment
  useEffect(() => {
    const deptCells = cells.filter(c => c.department === entryDept);
    if (deptCells.length > 0 && !deptCells.find(c => c.id === entryCell)) {
      setEntryCell(deptCells[0].id);
    }
  }, [entryDept, cells, entryCell]);

  // Compute stats on the fly
  const oeeMetrics = useMemo(() => {
    // Filter to simulated date to display relevant shop floor OEE
    const dayLogs = productionLogs.filter(log => log.date === simulatedDate);
    return calculateOEE(dayLogs);
  }, [productionLogs, simulatedDate]);

  // Auto Allocation engine run helper
  const handleAutoAllocate = () => {
    const result = runManpowerAllocation(
      simulatedDate,
      simulatedShift,
      operators,
      attendance,
      cells,
      allocationRequirements
    );
    setAllocations(result.allocations);
    
    // Auto alert if there are shortages
    if (result.criticalSkillShortages.length > 0) {
      const cellNames = result.criticalSkillShortages
        .map(sh => cells.find(c => c.id === sh.cellId)?.name || '')
        .filter(Boolean)
        .join(', ');
      alert(`⚠️ allocation Engine Complete! Noticed Skill Shortage in cells: ${cellNames}. Please review or adjust manually.`);
    }
  };

  // Helper to calculate total runtime of downtime entry in minutes
  const calculateDtMinutes = (startStr: string, endStr: string): number => {
    try {
      const [sh, sm] = startStr.split(':').map(Number);
      const [eh, em] = endStr.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 1440; // wrap around day just in case
      return diff;
    } catch {
      return 0;
    }
  };

  // Setup sample data helper
  const resetToSeeds = () => {
    if (confirm('Are you sure you want to restore defaults? All local modifications will be replaced.')) {
      localStorage.removeItem('spmas_cells');
      localStorage.removeItem('spmas_parts');
      localStorage.removeItem('spmas_operators');
      localStorage.removeItem('spmas_production_logs');
      localStorage.removeItem('spmas_attendance');
      localStorage.removeItem('spmas_requirements');
      localStorage.removeItem('spmas_allocations');
      window.location.reload();
    }
  };

  // Supervisor Form Handlers
  const handleAddDowntime = () => {
    const duration = calculateDtMinutes(dtStart, dtEnd);
    const newDt: DowntimeEntry = {
      id: `dt-${Date.now()}`,
      reason: dtReason,
      startTime: dtStart,
      endTime: dtEnd,
      totalMinutes: duration,
      remarks: dtRemarks || 'No remarks provided'
    };
    setDtList([...dtList, newDt]);
    setDtRemarks('');
  };

  const handleRemoveDowntime = (id: string) => {
    setDtList(dtList.filter(d => d.id !== id));
  };

  const handleAddProblem = () => {
    if (!probDesc.trim()) {
      alert('Please fill out the problem description first.');
      return;
    }
    const newProb: ProblemEntry = {
      id: `prob-${Date.now()}`,
      category: probCategory,
      description: probDesc,
      rootCause: probCause || 'Under investigation',
      countermeasure: probCounter || 'Pending action plan',
      responsiblePerson: probResp || 'TBD',
      status: probStatus
    };
    setProbList([...probList, newProb]);
    setProbDesc('');
    setProbCause('');
    setProbCounter('');
    setProbResp('');
  };

  const handleRemoveProblem = (id: string) => {
    setProbList(probList.filter(p => p.id !== id));
  };

  const handleSaveProductionReport = () => {
    // Validation
    if (entryPlanned <= 0) {
      alert('Planned production quantity must be greater than zero.');
      return;
    }

    const log: ProductionEntry = {
      id: `p-${Date.now()}`,
      date: entryDate,
      shift: entryShift,
      department: entryDept,
      cellId: entryCell,
      partTypeId: entryPart,
      planned: Number(entryPlanned),
      actual: Number(entryActual),
      rejection: Number(entryRejection),
      downtimes: dtList,
      problems: probList
    };

    setProductionLogs([log, ...productionLogs]);
    
    // Highlight message
    alert('✅ Production log submitted successfully and added to history database!');
    
    // Reset forms
    setDtList([]);
    setProbList([]);
    setEntryPlanned(100);
    setEntryActual(90);
    setEntryRejection(0);
  };

  // Attendance Switcher (Grid checkboxes)
  const toggleAttendanceStatus = (opId: string) => {
    const recordIdx = attendance.findIndex(a => a.date === simulatedDate && a.shift === simulatedShift && a.operatorId === opId);
    const statuses: ('Present' | 'Absent' | 'Leave' | 'Training')[] = ['Present', 'Absent', 'Leave', 'Training'];
    
    if (recordIdx >= 0) {
      const current = attendance[recordIdx].status;
      const nextIdx = (statuses.indexOf(current) + 1) % statuses.length;
      const nextStatus = statuses[nextIdx];
      
      const updated = [...attendance];
      updated[recordIdx] = { ...updated[recordIdx], status: nextStatus };
      setAttendance(updated);
    } else {
      const newRec: AttendanceRecord = {
        id: `att-${Date.now()}-${opId}`,
        date: simulatedDate,
        shift: simulatedShift,
        operatorId: opId,
        status: 'Present'
      };
      setAttendance([...attendance, newRec]);
    }
  };

  // Modify individual manual allocation slot
  const handleManualAssign = (cellId: string, slotIdx: number, operatorId: string) => {
    const updated = [...allocations];
    const cellAlloc = updated.find(a => a.cellId === cellId);
    
    if (cellAlloc) {
      const op = operators.find(o => o.id === operatorId);
      if (op) {
        // Remove operator if they are already assigned somewhere else in today's allocation sheet to avoid duplicates
        updated.forEach(a => {
          a.allocatedOperators = a.allocatedOperators.filter(o => o.operatorId !== operatorId);
        });

        const opSkillLevel = op.skills[cellId] || 'Beginner';
        
        // Push or assign to slot
        if (cellAlloc.allocatedOperators[slotIdx]) {
          cellAlloc.allocatedOperators[slotIdx] = {
            operatorId,
            operatorName: op.name,
            skillLevel: opSkillLevel
          };
        } else {
          cellAlloc.allocatedOperators.push({
            operatorId,
            operatorName: op.name,
            skillLevel: opSkillLevel
          });
        }
      }
    } else {
      // Cell alloc profile does not exist yet; build it
      const op = operators.find(o => o.id === operatorId);
      if (op) {
        updated.push({
          cellId,
          allocatedOperators: [{
            operatorId,
            operatorName: op.name,
            skillLevel: op.skills[cellId] || 'Beginner'
          }]
        });
      }
    }
    setAllocations(updated);
    setManualOverrideCellId(null);
    setManualOverrideSlotIndex(null);
  };

  // Reports Query Filter logic
  const filteredReportLogs = useMemo(() => {
    return productionLogs.filter(log => {
      const dateMatch = log.date >= filterStartDate && log.date <= filterEndDate;
      const shiftMatch = filterShift === 'All' || log.shift === filterShift;
      const cellMatch = filterCell === 'All' || log.cellId === filterCell;
      const deptMatch = filterDept === 'All' || log.department === filterDept;
      return dateMatch && shiftMatch && cellMatch && deptMatch;
    });
  }, [productionLogs, filterStartDate, filterEndDate, filterShift, filterCell, filterDept]);

  // Export to CSV helper
  const handleExportCSV = (reportType: string) => {
    let headers: string[] = [];
    let rows: string[][] = [];

    if (reportType === 'production') {
      headers = ['Date', 'Shift', 'Department', 'Cell', 'Part Type', 'Planned Qty', 'Actual Qty', 'Rejection Qty', 'Downtime Total (Mins)'];
      rows = filteredReportLogs.map(log => {
        const cellName = cells.find(c => c.id === log.cellId)?.name || 'Unknown';
        const partName = parts.find(p => p.id === log.partTypeId)?.name || 'Unknown';
        const totalDt = log.downtimes.reduce((sum, d) => sum + d.totalMinutes, 0);
        return [
          log.date,
          log.shift,
          log.department,
          cellName,
          partName,
          log.planned.toString(),
          log.actual.toString(),
          log.rejection.toString(),
          totalDt.toString()
        ];
      });
    } else if (reportType === 'allocation') {
      headers = ['Cell Name', 'Operator Name', 'Employee ID', 'Skill Level'];
      allocations.forEach(alloc => {
        const cellName = cells.find(c => c.id === alloc.cellId)?.name || 'Unknown';
        alloc.allocatedOperators.forEach(item => {
          const op = operators.find(o => o.id === item.operatorId);
          rows.push([
            cellName,
            item.operatorName,
            op?.employeeId || 'N/A',
            item.skillLevel
          ]);
        });
      });
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `spmas_report_${reportType}_${simulatedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Admin Cell Crud
  const handleSaveCell = () => {
    if (!newCellName.trim()) return;
    if (editingCellId) {
      setCells(cells.map(c => c.id === editingCellId ? { ...c, name: newCellName, department: newCellDept, defaultOperatorsRequired: Number(newCellReq) } : c));
      setEditingCellId(null);
    } else {
      const newCell: Cell = {
        id: `cell-${Date.now()}`,
        name: newCellName,
        department: newCellDept,
        defaultOperatorsRequired: Number(newCellReq)
      };
      setCells([...cells, newCell]);
    }
    setNewCellName('');
    setNewCellReq(2);
  };

  const handleEditCell = (cell: Cell) => {
    setEditingCellId(cell.id);
    setNewCellName(cell.name);
    setNewCellDept(cell.department);
    setNewCellReq(cell.defaultOperatorsRequired);
  };

  const handleDeleteCell = (id: string) => {
    if (confirm('Delete this cell? This might affect existing skill matrices.')) {
      setCells(cells.filter(c => c.id !== id));
    }
  };

  // Admin Part Crud
  const handleSavePart = () => {
    if (!newPartName.trim()) return;
    if (editingPartId) {
      setParts(parts.map(p => p.id === editingPartId ? { ...p, name: newPartName } : p));
      setEditingPartId(null);
    } else {
      const newPart: PartType = {
        id: `part-${Date.now()}`,
        name: newPartName
      };
      setParts([...parts, newPart]);
    }
    setNewPartName('');
  };

  const handleDeletePart = (id: string) => {
    if (confirm('Delete this part type?')) {
      setParts(parts.filter(p => p.id !== id));
    }
  };

  // Admin Operator Crud
  const handleSaveOperator = () => {
    if (!newOpName.trim() || !newOpEmpId.trim()) {
      alert('Please fill out Name and Employee ID');
      return;
    }
    if (editingOperatorId) {
      setOperators(operators.map(o => o.id === editingOperatorId ? {
        ...o,
        name: newOpName,
        employeeId: newOpEmpId,
        department: newOpDept,
        skills: newOpSkills
      } : o));
      setEditingOperatorId(null);
    } else {
      const newOp: Operator = {
        id: `op-${Date.now()}`,
        name: newOpName,
        employeeId: newOpEmpId,
        department: newOpDept,
        skills: newOpSkills
      };
      setOperators([...operators, newOp]);
    }
    setNewOpName('');
    setNewOpEmpId('');
    setNewOpSkills({});
  };

  const handleEditOperator = (op: Operator) => {
    setEditingOperatorId(op.id);
    setNewOpName(op.name);
    setNewOpEmpId(op.employeeId);
    setNewOpDept(op.department);
    setNewOpSkills(op.skills);
  };

  const handleDeleteOperator = (id: string) => {
    if (confirm('Delete this operator?')) {
      setOperators(operators.filter(o => o.id !== id));
    }
  };

  const handleToggleSkill = (cellId: string) => {
    const current = newOpSkills[cellId];
    const nextSkills = { ...newOpSkills };
    if (!current) {
      nextSkills[cellId] = 'Beginner';
    } else if (current === 'Beginner') {
      nextSkills[cellId] = 'Intermediate';
    } else if (current === 'Intermediate') {
      nextSkills[cellId] = 'Expert';
    } else {
      delete nextSkills[cellId];
    }
    setNewOpSkills(nextSkills);
  };

  // Generate automated smart manager insights for selected logs
  const generatedInsights = useMemo(() => {
    return generateProductionInsights(filteredReportLogs, cells, parts);
  }, [filteredReportLogs, cells, parts]);

  // Aggregate stats on active shift manpower
  const activeShiftStats = useMemo(() => {
    const shiftAttendance = attendance.filter(a => a.date === simulatedDate && a.shift === simulatedShift);
    const totalPresent = shiftAttendance.filter(a => a.status === 'Present' || a.status === 'Training').length;
    const totalAbsent = shiftAttendance.filter(a => a.status === 'Absent' || a.status === 'Leave').length;
    
    // Cells with allocated operators
    const cellsWithManpower = allocations.filter(a => a.allocatedOperators.length > 0).length;
    
    // Shortage calculations
    let totalNeededOperators = 0;
    allocationRequirements.forEach(req => {
      totalNeededOperators += req.requiredCount;
    });

    let totalAllocatedOperators = 0;
    allocations.forEach(a => {
      totalAllocatedOperators += a.allocatedOperators.length;
    });

    // Expert level count
    let expertCount = 0;
    allocations.forEach(a => {
      a.allocatedOperators.forEach(op => {
        if (op.skillLevel === 'Expert') expertCount++;
      });
    });

    // Multi skilled count
    const multiSkilledCount = operators.filter(op => Object.keys(op.skills).length >= 2).length;

    return {
      totalPresent,
      totalAbsent,
      cellsRunning: cellsWithManpower,
      allocatedOperators: totalAllocatedOperators,
      requiredOperators: totalNeededOperators,
      manpowerShortage: Math.max(0, totalNeededOperators - totalAllocatedOperators),
      expertAssignments: expertCount,
      multiSkilledCount
    };
  }, [attendance, simulatedDate, simulatedShift, allocations, allocationRequirements, operators]);

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* PROFESSIONAL SHOP FLOOR HEADER */}
      <header className={`border-b px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 ${isDarkMode ? 'border-slate-800 bg-slate-900/80 backdrop-blur' : 'border-slate-200 bg-white shadow-xs'}`}>
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-indigo-600 text-white shadow-md shadow-indigo-600/20">
            <Activity className="h-6 w-6 animate-pulse" id="header-logo-icon" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">SMART PRODUCTION & MANPOWER ALLOCATION</h1>
            <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wider">Industrial Pump Manufacturing System</p>
          </div>
        </div>

        {/* Global Control Widgets */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Quick Sandbox Controls */}
          <button 
            onClick={resetToSeeds} 
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition cursor-pointer"
            title="Restore default test data"
          >
            <Undo className="h-3.5 w-3.5" />
            Reset Data
          </button>

          {/* Theme Switcher Widget */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          {/* Active User Role Switcher */}
          <div className="flex items-center gap-1.5 border border-indigo-500/30 rounded-lg p-1 bg-indigo-500/5">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest pl-2">Role:</span>
            <select
              value={activeRole}
              onChange={(e: any) => {
                setActiveRole(e.target.value);
                // Pre-adjust department on role switch for convenience
                if (e.target.value === 'Assembly Supervisor') {
                  setEntryDept('Assembly');
                } else if (e.target.value === 'Machining Supervisor') {
                  setEntryDept('Machining');
                }
              }}
              className="bg-transparent text-sm font-bold text-indigo-500 dark:text-indigo-400 outline-none pr-2 cursor-pointer"
            >
              <option value="Production Manager">Production Manager</option>
              <option value="Production Supervisor">Production Supervisor</option>
              <option value="Assembly Supervisor">Assembly Dept Supervisor</option>
              <option value="Machining Supervisor">Machining Dept Supervisor</option>
              <option value="Admin">System Administrator</option>
            </select>
          </div>

        </div>
      </header>

      {/* SUB-HEADER TIME LOGGING */}
      <section className={`px-4 py-2 border-b text-xs flex flex-wrap items-center justify-between gap-3 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-indigo-500" /> Date Simulation Mode:</span>
          <input
            type="date"
            value={simulatedDate}
            onChange={(e) => {
              setSimulatedDate(e.target.value);
              // Also sync entryDate for ease
              setEntryDate(e.target.value);
            }}
            className="font-mono bg-transparent border-b border-indigo-500 focus:outline-none focus:border-indigo-400 px-1 py-0.5 text-xs text-indigo-600 font-bold dark:text-indigo-400 cursor-pointer"
          />
          <span className="flex items-center gap-1 ml-2"><Clock className="h-3.5 w-3.5 text-indigo-500" /> Active Shift:</span>
          <select
            value={simulatedShift}
            onChange={(e: any) => {
              setSimulatedShift(e.target.value);
              setEntryShift(e.target.value);
            }}
            className="font-mono bg-transparent border-b border-indigo-500 focus:outline-none focus:border-indigo-400 font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer"
          >
            <option value="A">Shift A (06:00 - 14:00)</option>
            <option value="B">Shift B (14:00 - 22:00)</option>
            <option value="C">Shift C (22:00 - 06:00)</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="inline-block py-1 px-2.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 font-bold text-[10px] tracking-wider uppercase">
            Shop Floor Online
          </span>
          <span className="font-mono hidden md:inline">UTC: 2026-06-21 23:23:15</span>
        </div>
      </section>

      {/* CORE WORKSPACE CONTENT */}
      <main className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        
        {/* ROLE SIMULATION ADVICE BOX */}
        <div className={`p-3 rounded-lg flex items-center justify-between text-xs border ${isDarkMode ? 'bg-indigo-950/20 border-indigo-900/40 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-900'}`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-indigo-500 flex-shrink-0" />
            <span>You are currently viewing as: <strong>{activeRole}</strong>. Changing the dropdown role in the header automatically changes the visible screen view.</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 md:block hidden">Reactive Simulator</span>
        </div>

        {/* -------------------------------------------------------------
            ROLE VIEW 1: PRODUCTION MANAGER DASHBOARD
            ------------------------------------------------------------- */}
        {activeRole === 'Production Manager' && (
          <div className="space-y-6">
            
            {/* MANAGER MENU TABS */}
            <div className="flex border-b border-slate-300 dark:border-slate-800 gap-2 overflow-x-auto pb-px">
              <button
                onClick={() => setManagerTab('OEE')}
                className={`py-2 px-4 font-bold text-sm border-b-2 flex items-center gap-2 cursor-pointer transition whitespace-nowrap ${managerTab === 'OEE' ? 'border-indigo-500 text-indigo-500 dark:text-indigo-400' : 'border-transparent hover:text-slate-500 text-slate-400'}`}
              >
                <LayoutDashboard className="h-4.5 w-4.5" />
                OEE & Productivity Metrics
              </button>
              <button
                onClick={() => setManagerTab('Manpower')}
                className={`py-2 px-4 font-bold text-sm border-b-2 flex items-center gap-2 cursor-pointer transition whitespace-nowrap ${managerTab === 'Manpower' ? 'border-indigo-500 text-indigo-500 dark:text-indigo-400' : 'border-transparent hover:text-slate-500 text-slate-400'}`}
              >
                <Users className="h-4.5 w-4.5" />
                Smart Manpower Allocator
              </button>
              <button
                onClick={() => setManagerTab('Reports')}
                className={`py-2 px-4 font-bold text-sm border-b-2 flex items-center gap-2 cursor-pointer transition whitespace-nowrap ${managerTab === 'Reports' ? 'border-indigo-500 text-indigo-500 dark:text-indigo-400' : 'border-transparent hover:text-slate-500 text-slate-400'}`}
              >
                <FileText className="h-4.5 w-4.5" />
                Downtime & Problem Handover Logs
              </button>
            </div>

            {/* TAB CONTENT A: OEE & REAL-TIME KPIs */}
            {managerTab === 'OEE' && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* PRIMARY OEE BIG DIALS SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  
                  {/* OEE SUMMARY CARD */}
                  <div className={`p-5 rounded-xl border relative overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Overall OEE %</span>
                      <Activity className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold tracking-tight text-indigo-500">{oeeMetrics.oee}%</span>
                      <span className="text-[10px] font-bold text-slate-400">vs 85% World Class Target</span>
                    </div>
                    
                    {/* SVG Progress bar */}
                    <div className="mt-4 w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${oeeMetrics.oee}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* AVAILABILITY */}
                  <div className={`p-5 rounded-xl border relative overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">Availability</span>
                      <Clock className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold tracking-tight text-emerald-500">{oeeMetrics.availability}%</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{oeeMetrics.totalDowntimeMinutes} mins lost of {oeeMetrics.totalWorkMinutes} mins total</p>
                    <div className="mt-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                      <div 
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${oeeMetrics.availability}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* PERFORMANCE */}
                  <div className={`p-5 rounded-xl border relative overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-500 uppercase tracking-widest">Performance</span>
                      <Sliders className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold tracking-tight text-blue-500">{oeeMetrics.performance}%</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{oeeMetrics.totalActual} units built vs {oeeMetrics.totalPlanned} planned</p>
                    <div className="mt-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${oeeMetrics.performance}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* QUALITY */}
                  <div className={`p-5 rounded-xl border relative overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm border-slate-200'}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Quality Rate</span>
                      <CheckCircle2 className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold tracking-tight text-amber-500">{oeeMetrics.quality}%</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{oeeMetrics.totalRejection} parts rejected this period</p>
                    <div className="mt-3 w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2">
                      <div 
                        className="bg-amber-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${oeeMetrics.quality}%` }}
                      ></div>
                    </div>
                  </div>

                </div>

                {/* AUTOMATED LEAN EXECUTOR INSIGHT ENGINE */}
                <div className={`p-5 rounded-xl border ${isDarkMode ? 'bg-slate-900/40 border-indigo-500/20' : 'bg-white border-slate-200 shadow-xs'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-5 w-5 text-indigo-500" />
                    <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">Shop Floor Auto-Diagnostics & Low Production Alerts</h3>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Run active insights map */}
                    {generateProductionInsights(productionLogs.filter(log => log.date === simulatedDate), cells, parts).map((insight, idx) => (
                      <div key={idx} className={`p-3 rounded-lg border text-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                        {insight}
                      </div>
                    ))}
                  </div>
                </div>

                {/* HISTORICAL QUANTITY STATS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* CELL-WISE OEE MATRIX */}
                  <div className={`p-5 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm border-slate-200'}`}>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Cell Performance breakdown</h3>
                    <div className="space-y-4">
                      {cells.map(c => {
                        // Gather cell logs for simulated date
                        const cellLogs = productionLogs.filter(l => l.cellId === c.id && l.date === simulatedDate);
                        const cellOee = calculateOEE(cellLogs);
                        const hasLog = cellLogs.length > 0;
                        
                        return (
                          <div key={c.id} className="flex flex-col gap-1 b-b pb-2 last:border-b-0">
                            <div className="flex justify-between text-sm">
                              <span className="font-bold">{c.name} <span className="text-[10px] py-0.5 px-2 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-400 font-normal uppercase">{c.department}</span></span>
                              <span className={`font-mono font-bold ${hasLog ? 'text-indigo-500' : 'text-slate-400'}`}>
                                {hasLog ? `${cellOee.oee}% OEE` : 'No Entry'}
                              </span>
                            </div>
                            
                            {hasLog ? (
                              <div className="grid grid-cols-3 gap-2 mt-1">
                                <div className="text-[10px] text-slate-400">Avail: <strong className="text-slate-700 dark:text-slate-200">{cellOee.availability}%</strong></div>
                                <div className="text-[10px] text-slate-400">Perf: <strong className="text-slate-700 dark:text-slate-200">{cellOee.performance}%</strong></div>
                                <div className="text-[10px] text-slate-400">Quality: <strong className="text-slate-700 dark:text-slate-200">{cellOee.quality}%</strong></div>
                              </div>
                            ) : (
                              <div className="text-[10px] text-slate-400 italic">Supervisor entry required for allocation cycle tracking</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ACTIVE SHIFT PRODUCTION METRIC TRENDS */}
                  <div className={`p-5 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm border-slate-200'}`}>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Production Logs vs Target (Shift: {simulatedShift})</h3>
                    
                    {productionLogs.filter(l => l.date === simulatedDate && l.shift === simulatedShift).length === 0 ? (
                      <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
                        <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
                        <p className="text-sm">No production data entered for {simulatedDate} on Shift {simulatedShift} yet.</p>
                        <p className="text-xs text-slate-500 mt-1">Change Simulated Date/Shift above or switch role to entry supervisor to capture live run quantities.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {productionLogs
                          .filter(l => l.date === simulatedDate && l.shift === simulatedShift)
                          .map(log => {
                            const cell = cells.find(c => c.id === log.cellId);
                            const part = parts.find(p => p.id === log.partTypeId);
                            const percent = log.planned > 0 ? Math.round((log.actual / log.planned) * 100) : 0;
                            return (
                              <div key={log.id} className="p-3 bg-slate-100 dark:bg-slate-800/40 rounded-lg space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                  <span className="font-bold text-indigo-500">{cell?.name}</span>
                                  <span className="text-xs font-mono text-slate-400">Part: {part?.name}</span>
                                </div>
                                
                                <div className="flex justify-between items-center text-xs">
                                  <span>Actual: <strong>{log.actual}</strong> / Target: <strong>{log.planned}</strong></span>
                                  <span className={`font-mono font-bold ${percent >= 90 ? 'text-emerald-500' : 'text-amber-500'}`}>{percent}% reached</span>
                                </div>

                                <div className="w-full bg-slate-300 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${percent >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                    style={{ width: `${Math.min(100, percent)}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}

            {/* TAB CONTENT B: SMART MANPOWER ALLOCATION */}
            {managerTab === 'Manpower' && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* ALIGNMENT STATUS SUMMARY WIDGETS */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  
                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-905 bg-slate-900 border-slate-800' : 'bg-white shadow-xs border-slate-200'}`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Present Operators</span>
                    <strong className="text-2xl font-black mt-1 text-indigo-500 block">{activeShiftStats.totalPresent}</strong>
                    <span className="text-[10px] text-slate-400 block mt-1">Available on site</span>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-905 bg-slate-900 border-slate-800' : 'bg-white shadow-xs border-slate-205'}`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Absent / Leave</span>
                    <strong className="text-2xl font-black mt-1 text-slate-400 block">{activeShiftStats.totalAbsent}</strong>
                    <span className="text-[10px] text-slate-400 block mt-1">Unscheduled shift slots</span>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-905 bg-slate-900 border-slate-800' : 'bg-white shadow-xs border-slate-205'}`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Total Running Cells</span>
                    <strong className="text-2xl font-black mt-1 text-emerald-500 block">{activeShiftStats.cellsRunning}</strong>
                    <span className="text-[10px] text-slate-400 block mt-1">Requires {activeShiftStats.requiredOperators} hands</span>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-905 bg-slate-900 border-slate-800' : 'bg-white shadow-xs border-slate-205'}`}>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Skill Utilization %</span>
                    <strong className="text-2xl font-black mt-1 text-blue-500 block">
                      {loadFromStorage<number>('spmas_skill_util', 0) || activeShiftStats.allocatedOperators > 0 
                        ? Math.min(100, Math.round((activeShiftStats.allocatedOperators / activeShiftStats.totalPresent) * 100)) 
                        : 0}%
                    </strong>
                    <span className="text-[10px] text-slate-400 block mt-1">Active matching density</span>
                  </div>

                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-905 bg-slate-900 border-slate-800' : 'bg-white shadow-xs border-slate-205'}`}>
                    <span className="text-[10px] font-bold text-amber-500 uppercase block tracking-wider font-semibold">Allocated Count</span>
                    <strong className="text-2xl font-black mt-1 text-amber-500 block">
                      {activeShiftStats.allocatedOperators} / {activeShiftStats.requiredOperators}
                    </strong>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      {activeShiftStats.manpowerShortage > 0 ? `${activeShiftStats.manpowerShortage} Workers Missing` : 'Standard staffing met'}
                    </span>
                  </div>

                </div>

                {/* AUTOMATION ENGINE PROPULSION BAR */}
                <div className={`p-5 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 ${isDarkMode ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-indigo-50 border-indigo-200'}`}>
                  <div className="space-y-1">
                    <h3 className="text-base font-extrabold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                      <Play className="h-5 w-5 text-indigo-500 fill-indigo-500 animate-pulse" />
                      Auto skill-based manpower Allocation Engine
                    </h3>
                    <p className="text-xs text-indigo-700/80 dark:text-indigo-400/80">Generates optimal shift allocation roster by analyzing actual shop attendance, cell demand profile, and skills expertise levels instantaneously.</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2.5">
                    <button
                      onClick={handleAutoAllocate}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm rounded-lg transition duration-200 flex items-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer"
                    >
                      <Play className="h-4 w-4" />
                      Run Auto Engine
                    </button>
                    
                    <button
                      onClick={() => handleExportCSV('allocation')}
                      disabled={allocations.length === 0}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-lg border border-slate-700 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      Export Allocation (CSV)
                    </button>
                  </div>
                </div>

                {/* TWO COLUMN ALLOCATION GRID AND ATTENDANCE CONTROLS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* COLUMN 1: LIVE ATTENDANCE LOG FOR THE SHIFT UNIT */}
                  <div className={`p-5 rounded-xl border lg:col-span-1 space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-xs border-slate-202 bg-white'}`}>
                    <div>
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <UserCheck className="h-4.5 w-4.5 text-indigo-500" />
                        Shift {simulatedShift} Attendance Tracker
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Verify operator state before calculations. Tap name bubbles to change daily shift status.</p>
                    </div>

                    <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                      {operators.map(op => {
                        const rec = attendance.find(a => a.date === simulatedDate && a.shift === simulatedShift && a.operatorId === op.id);
                        const status = rec ? rec.status : 'Present';
                        
                        let badgeColor = 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200';
                        if (status === 'Present') badgeColor = 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
                        if (status === 'Absent') badgeColor = 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
                        if (status === 'Leave') badgeColor = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
                        if (status === 'Training') badgeColor = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20';

                        return (
                          <div 
                            key={op.id} 
                            onClick={() => toggleAttendanceStatus(op.id)}
                            className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center transition ${isDarkMode ? 'bg-slate-950/40 border-slate-800/80 hover:border-indigo-500' : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100/60'}`}
                          >
                            <div>
                              <p className="text-sm font-extrabold">{op.name}</p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{op.employeeId} • {op.department}</p>
                            </div>
                            <span className={`text-[10px] px-2 py-1 font-bold rounded-lg uppercase tracking-wider ${badgeColor}`}>
                              {status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* COLUMN 2 & 3: INTERACTIVE GENERATED ALLOCATION ROSTER SHEET */}
                  <div className={`p-5 rounded-xl border lg:col-span-2 space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-xs border-slate-202 bg-white'}`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                          Active Allocation Sheet (Roster Log)
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">Skills-matched deployment roster. Reassigned slots instantly override and update.</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400">Target Count Control:</span>
                        <button
                          onClick={() => {
                            // Reset allocations
                            setAllocations([]);
                          }}
                          className="text-xs font-bold text-rose-500 hover:underline px-2 cursor-pointer"
                        >
                          Clear Allocation
                        </button>
                      </div>
                    </div>

                    {allocations.length === 0 ? (
                      <div className="py-20 text-center border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
                        <Briefcase className="h-10 w-10 text-indigo-500 mx-auto opacity-40 mb-3" />
                        <h4 className="text-sm font-bold">Roster Generation Needed</h4>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">Tap standard <strong>"Run Auto Engine"</strong> above to auto-compile skills matrix calculations, or click slots to pick operators manually.</p>
                        
                        <button
                          onClick={handleAutoAllocate}
                          className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-md transition cursor-pointer"
                        >
                          Click Here to Auto Allocate
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {allocations.map(alloc => {
                          const cell = cells.find(c => c.id === alloc.cellId);
                          const req = allocationRequirements.find(r => r.cellId === alloc.cellId)?.requiredCount || 0;
                          
                          return (
                            <div key={alloc.cellId} className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
                              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1.5">
                                <span className="font-extrabold text-sm text-indigo-600 dark:text-indigo-400">{cell?.name}</span>
                                <span className="text-[11px] font-bold text-slate-400">Required Count: <strong>{req} Operators</strong></span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                {/* Fill slots up to required headcount */}
                                {Array.from({ length: req }).map((_, slotIdx) => {
                                  const allocated = alloc.allocatedOperators[slotIdx];
                                  
                                  return (
                                    <div key={slotIdx} className="relative">
                                      {allocated ? (
                                        <div className={`p-2.5 rounded-lg border text-xs flex justify-between items-center ${isDarkMode ? 'bg-slate-900 border-slate-800/80' : 'bg-white shadow-2xs border-slate-200'}`}>
                                          <div>
                                            <p className="font-extrabold">{allocated.operatorName}</p>
                                            <p className="text-[10px] text-indigo-500 font-semibold uppercase">{allocated.skillLevel}</p>
                                          </div>
                                          
                                          {/* Mini edit override trigger */}
                                          <button
                                            onClick={() => {
                                              setManualOverrideCellId(alloc.cellId);
                                              setManualOverrideSlotIndex(slotIdx);
                                            }}
                                            className="text-[10px] text-indigo-500 font-bold hover:underline cursor-pointer"
                                          >
                                            Change
                                          </button>
                                        </div>
                                      ) : (
                                        <div 
                                          onClick={() => {
                                            setManualOverrideCellId(alloc.cellId);
                                            setManualOverrideSlotIndex(slotIdx);
                                          }}
                                          className="p-2.5 rounded-lg border-2 border-dashed border-rose-500/30 text-rose-500 font-extrabold text-xs text-center cursor-pointer hover:border-indigo-500 hover:text-indigo-500 transition"
                                        >
                                          + ASSIGN OPERATOR
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>

                {/* MODAL / BOTTOM SCREEN LIST FOR MANUAL OVERRIDE ASSIGNMENT */}
                {manualOverrideCellId !== null && manualOverrideSlotIndex !== null && (
                  <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
                    <div className={`w-full max-w-lg rounded-xl shadow-2xl p-6 border ${isDarkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-slate-200'}`}>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-base font-extrabold">
                          Override Assignment for {cells.find(c => c.id === manualOverrideCellId)?.name} (Slot {manualOverrideSlotIndex + 1})
                        </h3>
                        <button 
                          onClick={() => {
                            setManualOverrideCellId(null);
                            setManualOverrideSlotIndex(null);
                          }}
                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-slate-400"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      <p className="text-xs text-slate-500 mb-4">
                        Select an available operator on today's attendance shift list. Prioritizing highest skill match.
                      </p>

                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {operators
                          .filter(op => {
                            // Filter only if on site
                            const attRec = attendance.find(a => a.date === simulatedDate && a.shift === simulatedShift && a.operatorId === op.id);
                            return attRec && (attRec.status === 'Present' || attRec.status === 'Training');
                          })
                          .map(op => {
                            const level = op.skills[manualOverrideCellId];
                            
                            return (
                              <div
                                key={op.id}
                                onClick={() => handleManualAssign(manualOverrideCellId, manualOverrideSlotIndex, op.id)}
                                className={`p-2.5 rounded-lg border cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/5 flex justify-between items-center text-sm transition ${isDarkMode ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200'}`}
                              >
                                <div>
                                  <span className="font-extrabold block">{op.name}</span>
                                  <span className="text-[10px] text-slate-400 uppercase">{op.employeeId} • {op.department}</span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                  level === 'Expert' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                  level === 'Intermediate' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                  level === 'Beginner' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                  'bg-slate-100 text-slate-400 dark:bg-slate-800'
                                }`}>
                                  {level || 'No Skill Listed'}
                                </span>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* TAB CONTENT C: REPORTS (DOWNTIME & PROBLEMS PREVIEW) */}
            {managerTab === 'Reports' && (
              <div className="space-y-6 animate-fadeIn">
                
                {/* ADVANCED FILTERING PANEL */}
                <div className={`p-5 rounded-xl border ${isDarkMode ? 'bg-slate-905 bg-slate-900 border-slate-800' : 'bg-white shadow-xs border-slate-202 bg-white'}`}>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Filter Production History Database</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Start Date</label>
                      <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="w-full text-xs font-bold p-2 border border-slate-300 dark:border-slate-800 rounded-md bg-transparent cursor-pointer outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">End Date</label>
                      <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="w-full text-xs font-bold p-2 border border-slate-300 dark:border-slate-800 rounded-md bg-transparent cursor-pointer outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Shift Filter</label>
                      <select
                        value={filterShift}
                        onChange={(e) => setFilterShift(e.target.value)}
                        className="w-full text-xs font-bold p-2 border border-slate-300 dark:border-slate-800 rounded-md bg-transparent cursor-pointer outline-none"
                      >
                        <option value="All">All Shifts</option>
                        <option value="A">Shift A</option>
                        <option value="B">Shift B</option>
                        <option value="C">Shift C</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Cell Filter</label>
                      <select
                        value={filterCell}
                        onChange={(e) => setFilterCell(e.target.value)}
                        className="w-full text-xs font-bold p-2 border border-slate-300 dark:border-slate-800 rounded-md bg-transparent cursor-pointer outline-none"
                      >
                        <option value="All">All Cells</option>
                        {cells.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={() => handleExportCSV('production')}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-md transition duration-200 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Download className="h-4 w-4" />
                        Export CSV Reports
                      </button>
                    </div>
                  </div>
                </div>

                {/* TWO REPORT TABLES SIDE-BY-SIDE: DOWNTIMES AND REPETITIVE PROBLEMS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* DOWNTIME SUMMARY SUMMARY PANEL */}
                  <div className={`p-5 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-xs border-slate-201 bg-white'}`}>
                    <div className="flex justify-between items-center mb-4 border-b border-slate-205 dark:border-slate-800 pb-2">
                      <h3 className="text-sm font-bold tracking-wider uppercase text-slate-400">Total Downtime Registers</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-bold border border-indigo-500/20">
                        {filteredReportLogs.flatMap(log => log.downtimes).length} events
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {filteredReportLogs.flatMap(log => 
                        log.downtimes.map(dt => {
                          const cell = cells.find(c => c.id === log.cellId);
                          return (
                            <div key={dt.id} className="p-3 bg-slate-100 dark:bg-slate-800/40 rounded-lg text-xs space-y-1">
                              <div className="flex justify-between font-bold">
                                <span className="text-indigo-500">{cell?.name} • {dt.reason}</span>
                                <span className="text-rose-500">{dt.totalMinutes} Mins Lost</span>
                              </div>
                              <p className="text-slate-400">Log Date: {log.date} (Shift {log.shift}) • Time of block: {dt.startTime} - {dt.endTime}</p>
                              <p className="text-slate-500 italic mt-1">Remarks: "{dt.remarks}"</p>
                            </div>
                          );
                        })
                      )}
                      
                      {filteredReportLogs.flatMap(log => log.downtimes).length === 0 && (
                        <p className="py-10 text-center text-slate-400 italic text-xs">No active downtime logged matching search filters.</p>
                      )}
                    </div>
                  </div>

                  {/* REPETITIVE PROBLEMS TABLE */}
                  <div className={`p-5 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-xs border-slate-201 bg-white'}`}>
                    <div className="flex justify-between items-center mb-4 border-b border-slate-205 dark:border-slate-800 pb-2">
                      <h3 className="text-sm font-bold tracking-wider uppercase text-slate-400">Repetitive Problems List</h3>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold border border-amber-500/25">
                        {filteredReportLogs.flatMap(log => log.problems).length} incidents
                      </span>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                      {filteredReportLogs.flatMap(log => 
                        log.problems.map(prob => {
                          const cell = cells.find(c => c.id === log.cellId);
                          return (
                            <div key={prob.id} className="p-3.5 bg-slate-100 dark:bg-slate-800/40 rounded-lg text-xs space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-slate-700 dark:text-slate-200 uppercase">{prob.category}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  prob.status === 'Open' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                  prob.status === 'In Progress' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/25' :
                                  'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                }`}>
                                  {prob.status}
                                </span>
                              </div>
                              <p className="text-slate-400 leading-normal"><strong>Desc:</strong> {prob.description}</p>
                              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-1.5 mt-1">
                                <div><strong>Root Cause:</strong> {prob.rootCause}</div>
                                <div><strong>Countermeasure:</strong> {prob.countermeasure}</div>
                                <div><strong>Responsible:</strong> {prob.responsiblePerson}</div>
                                <div><strong>Active Date:</strong> {log.date} ({cell?.name})</div>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {filteredReportLogs.flatMap(log => log.problems).length === 0 && (
                        <p className="py-10 text-center text-slate-400 italic text-xs">No shop floor process incidents recorded matching filters.</p>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            )}

          </div>
        )}

        {/* -------------------------------------------------------------
            ROLE VIEW 2: PRODUCTION/DEPT SUPERVISORS ENTRY SCREENS
            ------------------------------------------------------------- */}
        {(activeRole.includes('Supervisor') || activeRole === 'Production Supervisor') && (
          <div className="space-y-6">
            
            {/* INSTRUCTIONS BANNER */}
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-xs border-slate-200'}`}>
              <Clock className="h-5 w-5 text-indigo-500 animate-pulse" />
              <div>
                <h3 className="font-bold text-sm">Shift Handover & Operations Data Entry Form</h3>
                <p className="text-xs text-slate-500">Supervisors use this tablet form to input real shift counts, log process stoppages/downtime incidents, and list safety or quality handovers quickly at close of shift.</p>
              </div>
            </div>

            {/* TWO MODULES: PRIMARY LOG ENTRY + DOWNTIME/PROBLEM REGISTER */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* SECTION A: PRIMARY QUANTITY ENTRY FORM */}
              <div className={`p-5 rounded-xl border lg:col-span-5 space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm border-slate-200'}`}>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-indigo-500" />
                  1. Shift Metrics Entry
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Date</label>
                    <input
                      type="date"
                      value={entryDate}
                      onChange={(e) => setEntryDate(e.target.value)}
                      className="w-full text-xs font-mono p-2 border border-slate-300 dark:border-slate-800 rounded-md bg-transparent"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Shift</label>
                    <select
                      value={entryShift}
                      onChange={(e: any) => setEntryShift(e.target.value)}
                      className="w-full text-xs font-bold p-2 border border-slate-300 dark:border-slate-800 rounded-md bg-transparent"
                    >
                      <option value="A">Shift A</option>
                      <option value="B">Shift B</option>
                      <option value="C">Shift C</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Department</label>
                    <select
                      value={entryDept}
                      onChange={(e: any) => setEntryDept(e.target.value)}
                      disabled={activeRole.includes('Assembly') || activeRole.includes('Machining')}
                      className="w-full text-xs font-bold p-2 border border-slate-300 dark:border-slate-800 rounded-md bg-transparent"
                    >
                      <option value="Assembly">Assembly</option>
                      <option value="Machining">Machining</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Cell Location</label>
                    <select
                      value={entryCell}
                      onChange={(e) => setEntryCell(e.target.value)}
                      className="w-full text-xs font-bold p-2 border border-slate-300 dark:border-slate-800 rounded-md bg-transparent"
                    >
                      {cells
                        .filter(c => c.department === entryDept)
                        .map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Manufacturing Part Type</label>
                    <select
                      value={entryPart}
                      onChange={(e) => setEntryPart(e.target.value)}
                      className="w-full text-xs font-bold p-2 border border-slate-300 dark:border-slate-800 rounded-md bg-transparent"
                    >
                      {parts.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Planned Run target</label>
                    <input
                      type="number"
                      value={entryPlanned}
                      onChange={(e) => setEntryPlanned(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs font-mono p-2 border border-slate-300 dark:border-slate-800 rounded-md bg-transparent"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Actual Quantity built</label>
                    <input
                      type="number"
                      value={entryActual}
                      onChange={(e) => setEntryActual(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs font-mono p-2 border border-slate-300 dark:border-slate-800 rounded-md bg-transparent"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Rejection Quantity</label>
                    <input
                      type="number"
                      value={entryRejection}
                      onChange={(e) => setEntryRejection(Math.max(0, Number(e.target.value)))}
                      className="w-full text-xs font-mono p-2 border border-slate-300 dark:border-slate-800 rounded-md bg-transparent"
                    />
                  </div>

                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={handleSaveProductionReport}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm rounded-lg transition duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    <CheckCircle2 className="h-4.5 w-4.5" />
                    Submit Final Shift Report
                  </button>
                </div>
              </div>

              {/* SECTION B: DOWNTIME EVENTS AND PROBLEM LOGS TABLE */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* DOWNTIME EVENT CAPTURING SUB-FORM */}
                <div className={`p-5 rounded-xl border space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm border-slate-200'}`}>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <Clock className="h-4.5 w-4.5 text-rose-500" />
                    2. Downtime Event Register ({dtList.length} events logged for active entry)
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Downtime Reason list</label>
                      <select
                        value={dtReason}
                        onChange={(e) => setDtReason(e.target.value)}
                        className="w-full text-xs font-bold p-2 border border-slate-300 dark:border-slate-800 rounded-md bg-transparent outline-none"
                      >
                        {DOWNTIME_REASONS.map(reason => (
                          <option key={reason} value={reason}>{reason}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Start Time</label>
                      <input
                        type="time"
                        value={dtStart}
                        onChange={(e) => setDtStart(e.target.value)}
                        className="w-full text-xs font-mono p-2 border border-slate-300 dark:border-slate-800 rounded-md bg-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">End Time</label>
                      <input
                        type="time"
                        value={dtEnd}
                        onChange={(e) => setDtEnd(e.target.value)}
                        className="w-full text-xs font-mono p-2 border border-slate-300 dark:border-slate-800 rounded-md bg-transparent outline-none"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Specific Remarks / Stoppage Cause details</label>
                      <input
                        type="text"
                        placeholder="e.g. Broken limit switch on PT4 pneumatic tester station 1"
                        value={dtRemarks}
                        onChange={(e) => setDtRemarks(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-300 dark:border-slate-800 rounded-md bg-transparent outline-none"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={handleAddDowntime}
                        className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-md transition cursor-pointer"
                      >
                        + Log Downtime
                      </button>
                    </div>
                  </div>

                  {/* MINI DISPLAY OF ACTIVE FORM EVENTS */}
                  {dtList.length > 0 && (
                    <div className="space-y-1.5 pt-2 max-h-[140px] overflow-y-auto">
                      {dtList.map(dt => (
                        <div key={dt.id} className="p-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 rounded-lg text-xs flex justify-between items-center">
                          <div>
                            <span className="font-bold text-rose-500 uppercase">{dt.reason}</span>
                            <span className="text-slate-400 text-[10px] block">Duration: {dt.startTime} - {dt.endTime} ({dt.totalMinutes} minutes)</span>
                            <span className="text-slate-500 block italic">"{dt.remarks}"</span>
                          </div>
                          
                          <button
                            onClick={() => handleRemoveDowntime(dt.id)}
                            className="p-1 rounded bg-slate-200 hover:bg-rose-100 hover:text-rose-600 dark:bg-slate-800 text-slate-400 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* DAILY PROBLEM INCIDENT TRACKER SUB-FORM */}
                <div className={`p-5 rounded-xl border space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-sm border-slate-200'}`}>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest pb-2 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                    3. Daily Problem Tracker & Floor Handovers
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Problem Category</label>
                      <select
                        value={probCategory}
                        onChange={(e) => setProbCategory(e.target.value)}
                        className="w-full text-xs font-bold p-2 border border-slate-300 dark:border-slate-800 rounded-md bg-transparent outline-none"
                      >
                        {PROBLEM_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Root Cause</label>
                      <input
                        type="text"
                        placeholder="e.g. Solder bit oxidation"
                        value={probCause}
                        onChange={(e) => setProbCause(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-300 dark:border-slate-800 rounded-md bg-transparent outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Problem Description</label>
                      <input
                        type="text"
                        placeholder="Clear brief breakdown/incident statement"
                        value={probDesc}
                        onChange={(e) => setProbDesc(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-300 dark:border-slate-800 rounded-md bg-transparent outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Countermeasure / Fix action</label>
                      <input
                        type="text"
                        placeholder="e.g. Clean bit, adjust temperature dial"
                        value={probCounter}
                        onChange={(e) => setProbCounter(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-300 dark:border-slate-800 rounded-md bg-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Responsible Person</label>
                      <input
                        type="text"
                        placeholder="R. Patel / Team A"
                        value={probResp}
                        onChange={(e) => setProbResp(e.target.value)}
                        className="w-full text-xs p-2 border border-slate-300 dark:border-slate-800 rounded-md bg-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase">Status</label>
                      <select
                        value={probStatus}
                        onChange={(e: any) => setProbStatus(e.target.value)}
                        className="w-full text-xs font-bold p-2 border border-slate-300 dark:border-slate-800 rounded-md bg-transparent outline-none"
                      >
                        <option value="Open">Open (Needs Manager support)</option>
                        <option value="In Progress">In Progress (Handling now)</option>
                        <option value="Closed">Closed (Resolved on Shift)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 flex items-end">
                      <button
                        onClick={handleAddProblem}
                        className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-md transition cursor-pointer"
                      >
                        + Log Incident Handler
                      </button>
                    </div>
                  </div>

                  {/* DISPLAY OF CURRENT CONTEXT PROBLEMS */}
                  {probList.length > 0 && (
                    <div className="space-y-1.5 pt-2 max-h-[140px] overflow-y-auto">
                      {probList.map(prob => (
                        <div key={prob.id} className="p-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 rounded-lg text-xs flex justify-between items-center">
                          <div>
                            <span className="font-bold text-amber-500 uppercase">{prob.category}</span>
                            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 rounded ml-2 bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">{prob.status}</span>
                            <span className="text-slate-400 text-[10px] block">Details: {prob.description} (Resp: {prob.responsiblePerson})</span>
                          </div>
                          
                          <button
                            onClick={() => handleRemoveProblem(prob.id)}
                            className="p-1 rounded bg-slate-200 hover:bg-rose-100 hover:text-rose-600 dark:bg-slate-800 text-slate-400 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
              
            </div>

          </div>
        )}

        {/* -------------------------------------------------------------
            ROLE VIEW 3: SYSTEM ADMINISTRATOR DATABASE PANELS
            ------------------------------------------------------------- */}
        {activeRole === 'Admin' && (
          <div className="space-y-6 animate-fadeIn">
            
            {/* ADMIN WELCOME INFO */}
            <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-xs border-slate-200'}`}>
              <Settings className="h-5 w-5 text-indigo-500 animate-spin-slow mb-1" />
              <h3 className="font-bold text-sm">Industrial Master Database Modifiers</h3>
              <p className="text-xs text-slate-500">Configure core factory structures, machine/assembly cell requirements, standard pump part listings, and skilled crew properties below.</p>
            </div>

            {/* THREE COLUMN MASTER SETUP: CELLS CRUD, PARTS CRUD, OPERATORS SKILLS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* CELL MANAGEMENT SUB-BOX */}
              <div className={`p-5 rounded-xl border space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-xs border-slate-202 bg-white'}`}>
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">A. Factory Cells Manager</h3>
                  <p className="text-xs text-slate-500">Modify line designations and baseline required crew headcount.</p>
                </div>

                <div className="p-3 bg-slate-100 dark:bg-slate-850 rounded-lg space-y-3 text-xs">
                  <p className="font-bold text-[10px] text-indigo-500 uppercase tracking-wide">
                    {editingCellId ? 'Edit Active Factory Cell' : 'Register New Cell'}
                  </p>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Cell Name</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-slate-300 dark:border-slate-800 rounded bg-transparent outline-none text-xs"
                      placeholder="e.g. Assembly Line 5"
                      value={newCellName}
                      onChange={(e) => setNewCellName(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Dept</label>
                      <select
                        className="w-full p-2 border border-slate-300 dark:border-slate-800 rounded bg-transparent outline-none text-xs"
                        value={newCellDept}
                        onChange={(e: any) => setNewCellDept(e.target.value)}
                      >
                        <option value="Assembly">Assembly</option>
                        <option value="Machining">Machining</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Crew Required</label>
                      <input
                        type="number"
                        className="w-full p-2 border border-slate-300 dark:border-slate-800 rounded bg-transparent outline-none text-xs"
                        min="1"
                        value={newCellReq}
                        onChange={(e) => setNewCellReq(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveCell}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs transition cursor-pointer"
                    >
                      {editingCellId ? 'Save Cell' : 'Register Cell'}
                    </button>
                    {editingCellId && (
                      <button
                        onClick={() => {
                          setEditingCellId(null);
                          setNewCellName('');
                          setNewCellReq(2);
                        }}
                        className="px-2.5 bg-slate-200 dark:bg-slate-800 rounded text-xs text-slate-500 hover:bg-slate-300 dark:hover:bg-slate-700 font-bold"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {cells.map(c => (
                    <div key={c.id} className="p-2 border border-slate-200 dark:border-slate-800 rounded text-xs flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
                      <div>
                        <strong className="font-bold">{c.name}</strong> 
                        <span className="text-[10px] text-indigo-500 block">Dept: {c.department} • Standard Crew Count: {c.defaultOperatorsRequired}</span>
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEditCell(c)}
                          className="p-1 rounded bg-slate-200 dark:bg-slate-850 dark:hover:bg-indigo-500/20 hover:text-indigo-500 text-slate-500 cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteCell(c.id)}
                          className="p-1 rounded bg-slate-200 dark:bg-slate-850 hover:bg-rose-100 hover:text-rose-600 text-slate-500 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* INDUSTRIAL PART MANIFEST CRUD */}
              <div className={`p-5 rounded-xl border space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-xs border-slate-202 bg-white'}`}>
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">B. Product Part Master</h3>
                  <p className="text-xs text-slate-500">Configure pump models running across active lines.</p>
                </div>

                <div className="p-3 bg-slate-100 dark:bg-slate-850 rounded-lg space-y-3 text-xs">
                  <p className="font-bold text-[10px] text-indigo-500 uppercase tracking-wide">
                    {editingPartId ? 'Edit Product Item' : 'Add New Product Option'}
                  </p>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Part Type Name</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-slate-300 dark:border-slate-800 rounded bg-transparent outline-none text-xs"
                      placeholder="e.g. Perkins 1200 Stage V"
                      value={newPartName}
                      onChange={(e) => setNewPartName(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSavePart}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs transition cursor-pointer"
                    >
                      {editingPartId ? 'Save Part' : 'Add Part option'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {parts.map(p => (
                    <div key={p.id} className="p-2 border border-slate-200 dark:border-slate-800 rounded text-xs flex justify-between items-center bg-slate-50 dark:bg-slate-950/40">
                      <div>
                        <strong className="font-bold">{p.name}</strong> 
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setEditingPartId(p.id);
                            setNewPartName(p.name);
                          }}
                          className="p-1 rounded bg-slate-200 dark:bg-slate-850 hover:text-indigo-500 text-slate-500 cursor-pointer"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleDeletePart(p.id)}
                          className="p-1 rounded bg-slate-200 dark:bg-slate-850 hover:bg-rose-100 text-slate-500 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>

              {/* OPERATORS AND SKILLS MATRIX CONTROLS */}
              <div className={`p-5 rounded-xl border space-y-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white shadow-xs border-slate-202 bg-white'}`}>
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">C. Skill Matrix Database</h3>
                  <p className="text-xs text-slate-500">Configure machine operator skills profile levels.</p>
                </div>

                <div className="p-3 bg-slate-100 dark:bg-slate-850 rounded-lg space-y-3 text-xs">
                  <p className="font-bold text-[10px] text-indigo-500 uppercase tracking-wide">
                    {editingOperatorId ? `Edit ${newOpName} Skills` : 'Register Crew Operator'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Operator Name</label>
                      <input
                        type="text"
                        className="w-full p-2 border border-slate-300 dark:border-slate-800 rounded bg-transparent outline-none text-xs"
                        placeholder="R. Kumar"
                        value={newOpName}
                        onChange={(e) => setNewOpName(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Employee ID</label>
                      <input
                        type="text"
                        className="w-full p-2 border border-slate-300 dark:border-slate-800 rounded bg-transparent outline-none text-xs"
                        placeholder="EMP-5000"
                        value={newOpEmpId}
                        onChange={(e) => setNewOpEmpId(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                     <label className="text-[10px] font-bold text-slate-400 block mb-0.5">Core Department</label>
                     <select
                        className="w-full p-2 border border-slate-300 dark:border-slate-800 rounded bg-transparent outline-none text-xs"
                        value={newOpDept}
                        onChange={(e: any) => setNewOpDept(e.target.value)}
                     >
                       <option value="Assembly">Assembly</option>
                       <option value="Machining">Machining</option>
                     </select>
                  </div>

                  {/* MINI SKILLS GRID SELECTOR */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Matrix Skill Alignment (Click to cycle Beginner {`->`} Intermediate {`->`} Expert)</label>
                    <div className="flex flex-wrap gap-1.5">
                      {cells.map(c => {
                        const lvl = newOpSkills[c.id];
                        let skillBadgeClass = 'bg-slate-200 text-slate-600 dark:bg-slate-800 text-slate-400';
                        if (lvl === 'Beginner') skillBadgeClass = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
                        if (lvl === 'Intermediate') skillBadgeClass = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
                        if (lvl === 'Expert') skillBadgeClass = 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold';

                        return (
                          <div
                            key={c.id}
                            onClick={() => handleToggleSkill(c.id)}
                            className={`px-2 py-1 rounded text-[10px] cursor-pointer transition border border-transparent ${skillBadgeClass}`}
                          >
                            {c.name}: {lvl || 'None'}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveOperator}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-xs transition cursor-pointer"
                    >
                      {editingOperatorId ? 'Save Skills Matrix' : 'Add Operator'}
                    </button>
                    {editingOperatorId && (
                      <button
                        onClick={() => {
                          setEditingOperatorId(null);
                          setNewOpName('');
                          setNewOpEmpId('');
                          setNewOpSkills({});
                        }}
                        className="px-2.5 bg-slate-200 dark:bg-slate-800 rounded text-xs text-slate-500"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2 max-h-[250px] overflow-y-auto">
                  {operators.map(op => {
                    const skillsList = Object.entries(op.skills).filter(([_, lvl]) => lvl);
                    
                    return (
                      <div key={op.id} className="p-3 border border-slate-200 dark:border-slate-800 rounded text-xs space-y-1.5 bg-slate-50 dark:bg-slate-950/40">
                        <div className="flex justify-between items-center">
                          <div>
                            <strong className="font-bold text-sm block">{op.name}</strong>
                            <span className="text-[10px] text-slate-400 uppercase tracking-widest">{op.employeeId} • {op.department}</span>
                          </div>
                          
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleEditOperator(op)}
                              className="p-1 rounded bg-slate-200 dark:bg-slate-850 hover:text-indigo-500 text-slate-500 cursor-pointer"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteOperator(op.id)}
                              className="p-1 rounded bg-slate-200 dark:bg-slate-850 hover:bg-rose-100 text-slate-500 cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {skillsList.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {skillsList.map(([cId, level]) => {
                              const cellName = cells.find(c => c.id === cId)?.name || 'Line';
                              return (
                                <span key={cId} className="text-[9px] bg-indigo-500/10 text-indigo-400 font-medium px-1.5 py-0.5 rounded border border-indigo-500/10">
                                  {cellName}: {level}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[9px] text-slate-500 italic">No machine skills linked on skills matrix</p>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* FOOTER BAR */}
      <footer className={`mt-10 py-6 border-t text-center text-xs ${isDarkMode ? 'border-slate-900 text-slate-500 bg-slate-950' : 'border-slate-200 text-slate-400 bg-white'}`}>
        <p>© 2026 Smart Production & Manpower Allocation System. Optimized for OEE / TPM Shop Floor Tablets.</p>
        <p className="mt-1 text-[10px] text-indigo-500 font-semibold uppercase tracking-wider">Pump Manufacturing Lean Suite • Local Persistence Storage Enabled</p>
      </footer>

    </div>
  );
}
