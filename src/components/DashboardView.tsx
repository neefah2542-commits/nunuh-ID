import React, { useMemo, useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  Building2, 
  Calendar, 
  Scissors, 
  Crown, 
  Sparkles, 
  Repeat, 
  ChevronRight,
  Filter,
  Users
} from 'lucide-react';
import { BranchName, JobType, OrderItem } from '../types';
import { BRANCHES, STAGE_CATEGORIES, STAGES } from '../data/constants';
import { calculateDaysBetween, formatDurationThai, formatThaiDate } from '../utils/dateUtils';

interface DashboardViewProps {
  orders: OrderItem[];
  selectedBranch: BranchName | 'all';
  onSelectOrder: (order: OrderItem) => void;
  onFilterByJobType: (jobType: JobType) => void;
  onFilterByBranch: (branch: BranchName) => void;
}

interface JobTypeStats {
  type: JobType;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: {
    bg: string;
    text: string;
    border: string;
    lightBg: string;
    barColor: string;
    badgeBg: string;
    badgeText: string;
  };
  totalCount: number;
  percentage: number;
  activeCount: number;
  completedCount: number;
  urgentCount: number;
  alterationCount: number;
  alterationRate: number;
  avgTotalDuration: number;
  avgCurrentStageDuration: number;
  categoryAverages: {
    categoryId: string;
    categoryName: string;
    avgDays: number;
    count: number;
  }[];
  longestStage: {
    id: number;
    name: string;
    avgDays: number;
  } | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  selectedBranch,
  onSelectOrder,
  onFilterByJobType,
  onFilterByBranch,
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'comparison' | 'stages' | 'branches'>('overview');

  // Filter orders by branch if selected
  const activeOrders = useMemo(() => {
    if (selectedBranch === 'all') return orders;
    return orders.filter(o => o.branch === selectedBranch);
  }, [orders, selectedBranch]);

  // Overall calculations
  const totalOrdersCount = activeOrders.length;
  const completedOrders = activeOrders.filter(o => o.currentStageId === 22);
  const inProgressOrders = activeOrders.filter(o => o.currentStageId < 22);
  const urgentOrders = activeOrders.filter(o => o.isUrgent);

  // Calculate stats for a specific job type (IDD, IDH, IDR)
  const computeJobTypeStats = (type: JobType): JobTypeStats => {
    const typeOrders = activeOrders.filter(o => o.jobType === type);
    const totalCount = typeOrders.length;
    const percentage = totalOrdersCount > 0 ? Math.round((totalCount / totalOrdersCount) * 100) : 0;
    const activeCount = typeOrders.filter(o => o.currentStageId < 22).length;
    const completedCount = typeOrders.filter(o => o.currentStageId === 22).length;
    const urgentCount = typeOrders.filter(o => o.isUrgent).length;
    
    // Count orders that went through alteration stages (13 to 19)
    const alterationCount = typeOrders.filter(o => 
      o.currentStageId >= 13 && o.currentStageId <= 19 || 
      o.history.some(h => h.stageId >= 13 && h.stageId <= 19)
    ).length;
    const alterationRate = totalCount > 0 ? Math.round((alterationCount / totalCount) * 100) : 0;

    // Calculate total duration per order (sum of completed stage durations or total days from orderDate)
    const orderDurations = typeOrders.map(o => {
      // Sum up days from history or orderDate to completed/now
      if (o.currentStageId === 22 && o.history.length > 0) {
        const lastCompleted = o.history.find(h => h.stageId === 22)?.completedAt || o.updatedAt;
        return calculateDaysBetween(o.orderDate, lastCompleted);
      }
      return calculateDaysBetween(o.orderDate);
    });

    const avgTotalDuration = orderDurations.length > 0
      ? Math.round((orderDurations.reduce((a, b) => a + b, 0) / orderDurations.length) * 10) / 10
      : 0;

    // Average duration in current stage
    const currentStageDurations = typeOrders.map(o => calculateDaysBetween(o.stageEnteredAt));
    const avgCurrentStageDuration = currentStageDurations.length > 0
      ? Math.round((currentStageDurations.reduce((a, b) => a + b, 0) / currentStageDurations.length) * 10) / 10
      : 0;

    // Category averages (production, distribution, fitting, alteration, handover)
    const categoryAverages = STAGE_CATEGORIES.map(cat => {
      const stageIdsInCat = STAGES.filter(s => s.category === cat.id).map(s => s.id);
      let totalCatDays = 0;
      let historyMatches = 0;

      typeOrders.forEach(order => {
        order.history.forEach(hist => {
          if (stageIdsInCat.includes(hist.stageId)) {
            const days = hist.daysSpent !== undefined 
              ? hist.daysSpent 
              : calculateDaysBetween(hist.enteredAt, hist.completedAt);
            totalCatDays += days;
            historyMatches++;
          }
        });
      });

      const avgDays = historyMatches > 0 
        ? Math.round((totalCatDays / historyMatches) * 10) / 10 
        : 0;

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        avgDays,
        count: historyMatches,
      };
    });

    // Find stage that took longest on average
    let longestStage: { id: number; name: string; avgDays: number } | null = null;
    let maxAvg = 0;

    STAGES.forEach(stage => {
      let stageTotal = 0;
      let stageCount = 0;

      typeOrders.forEach(order => {
        order.history.forEach(hist => {
          if (hist.stageId === stage.id) {
            const days = hist.daysSpent !== undefined 
              ? hist.daysSpent 
              : calculateDaysBetween(hist.enteredAt, hist.completedAt);
            stageTotal += days;
            stageCount++;
          }
        });
      });

      if (stageCount > 0) {
        const avg = stageTotal / stageCount;
        if (avg > maxAvg) {
          maxAvg = avg;
          longestStage = {
            id: stage.id,
            name: stage.name,
            avgDays: Math.round(avg * 10) / 10,
          };
        }
      }
    });

    // Theme metadata for IDD, IDH, IDR
    if (type === 'IDD') {
      return {
        type,
        title: 'IDD (ดีไซน์สั่งตัดใหม่)',
        subtitle: 'Custom Design / Made-to-Order',
        icon: <Scissors className="w-5 h-5" />,
        color: {
          bg: 'bg-indigo-600',
          text: 'text-indigo-700',
          border: 'border-indigo-200',
          lightBg: 'bg-indigo-50/70',
          barColor: 'bg-indigo-600',
          badgeBg: 'bg-indigo-100',
          badgeText: 'text-indigo-800',
        },
        totalCount,
        percentage,
        activeCount,
        completedCount,
        urgentCount,
        alterationCount,
        alterationRate,
        avgTotalDuration,
        avgCurrentStageDuration,
        categoryAverages,
        longestStage,
      };
    } else if (type === 'IDH') {
      return {
        type,
        title: 'IDH (ฮิญาบ)',
        subtitle: 'Hijab Collection',
        icon: <Crown className="w-5 h-5" />,
        color: {
          bg: 'bg-purple-600',
          text: 'text-purple-700',
          border: 'border-purple-200',
          lightBg: 'bg-purple-50/70',
          barColor: 'bg-purple-600',
          badgeBg: 'bg-purple-100',
          badgeText: 'text-purple-800',
        },
        totalCount,
        percentage,
        activeCount,
        completedCount,
        urgentCount,
        alterationCount,
        alterationRate,
        avgTotalDuration,
        avgCurrentStageDuration,
        categoryAverages,
        longestStage,
      };
    } else {
      return {
        type,
        title: 'IDR (เช่าตัด & แก้ไขไซส์)',
        subtitle: 'Rental & Alteration / Ready-Fit',
        icon: <Repeat className="w-5 h-5" />,
        color: {
          bg: 'bg-amber-600',
          text: 'text-amber-700',
          border: 'border-amber-200',
          lightBg: 'bg-amber-50/70',
          barColor: 'bg-amber-600',
          badgeBg: 'bg-amber-100',
          badgeText: 'text-amber-800',
        },
        totalCount,
        percentage,
        activeCount,
        completedCount,
        urgentCount,
        alterationCount,
        alterationRate,
        avgTotalDuration,
        avgCurrentStageDuration,
        categoryAverages,
        longestStage,
      };
    }
  };

  const iddStats = useMemo(() => computeJobTypeStats('IDD'), [activeOrders]);
  const idhStats = useMemo(() => computeJobTypeStats('IDH'), [activeOrders]);
  const idrStats = useMemo(() => computeJobTypeStats('IDR'), [activeOrders]);

  const allJobStats = [iddStats, idhStats, idrStats];

  // Overall average duration across all jobs
  const overallAvgDuration = useMemo(() => {
    if (activeOrders.length === 0) return 0;
    const durations = activeOrders.map(o => calculateDaysBetween(o.orderDate, o.currentStageId === 22 ? o.updatedAt : undefined));
    return Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10;
  }, [activeOrders]);

  // Branch performance matrix
  const branchMatrix = useMemo(() => {
    return BRANCHES.map(branch => {
      const branchOrders = orders.filter(o => o.branch === branch.name);
      const total = branchOrders.length;
      
      const iddBranch = branchOrders.filter(o => o.jobType === 'IDD');
      const idhBranch = branchOrders.filter(o => o.jobType === 'IDH');
      const idrBranch = branchOrders.filter(o => o.jobType === 'IDR');

      const calcAvg = (orderList: OrderItem[]) => {
        if (orderList.length === 0) return '-';
        const durs = orderList.map(o => calculateDaysBetween(o.orderDate, o.currentStageId === 22 ? o.updatedAt : undefined));
        return (durs.reduce((a, b) => a + b, 0) / durs.length).toFixed(1);
      };

      return {
        branchName: branch.name,
        branchCode: branch.code,
        total,
        iddCount: iddBranch.length,
        iddAvg: calcAvg(iddBranch),
        idhCount: idhBranch.length,
        idhAvg: calcAvg(idhBranch),
        idrCount: idrBranch.length,
        idrAvg: calcAvg(idrBranch),
        overallAvg: calcAvg(branchOrders),
      };
    });
  }, [orders]);

  // Stage-by-stage average matrix (1-22) for IDD, IDH, IDR
  const stageMatrix = useMemo(() => {
    return STAGES.map(stage => {
      const calcStageAvg = (jobType?: JobType) => {
        let sum = 0;
        let count = 0;
        const targetOrders = jobType ? activeOrders.filter(o => o.jobType === jobType) : activeOrders;

        targetOrders.forEach(o => {
          o.history.forEach(h => {
            if (h.stageId === stage.id) {
              const days = h.daysSpent !== undefined ? h.daysSpent : calculateDaysBetween(h.enteredAt, h.completedAt);
              sum += days;
              count++;
            }
          });
        });

        if (count === 0) return { avg: '-', count: 0 };
        return { avg: (sum / count).toFixed(1), count };
      };

      return {
        id: stage.id,
        name: stage.name,
        categoryName: stage.categoryName,
        category: stage.category,
        idd: calcStageAvg('IDD'),
        idh: calcStageAvg('IDH'),
        idr: calcStageAvg('IDR'),
        overall: calcStageAvg(),
      };
    });
  }, [activeOrders]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Quick Highlights & Tab Switcher */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-2xs">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                แดชบอร์ดสรุปและค่าเฉลี่ยประเภทงาน IDD • IDH • IDR
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              วิเคราะห์ระยะเวลาการทำงานเฉลี่ย (Average Lead Time) และประสิทธิภาพทุกขั้นตอนแยกตามประเภทงาน 8 สาขา
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start md:self-auto overflow-x-auto">
            <button
              onClick={() => setSelectedTab('overview')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${
                selectedTab === 'overview'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              สรุปภาพรวม 3 ประเภทงาน
            </button>
            <button
              onClick={() => setSelectedTab('comparison')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${
                selectedTab === 'comparison'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              เปรียบเทียบระยะเวลากระบวนการ
            </button>
            <button
              onClick={() => setSelectedTab('stages')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${
                selectedTab === 'stages'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ค่าเฉลี่ย 22 สถานะ
            </button>
            <button
              onClick={() => setSelectedTab('branches')}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${
                selectedTab === 'branches'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              แยกตาม 8 สาขา
            </button>
          </div>
        </div>

        {/* Global Key Metric Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-4 border-t border-slate-100">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p className="text-[11px] text-slate-500 font-medium">ออร์เดอร์รวม</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-slate-900">{totalOrdersCount}</span>
              <span className="text-xs text-slate-400 font-medium">ชุด</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p className="text-[11px] text-slate-500 font-medium">เวลาเฉลี่ยรวมทุกประเภท</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-indigo-700">{overallAvgDuration}</span>
              <span className="text-xs text-slate-500 font-medium">วัน / ชุด</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p className="text-[11px] text-slate-500 font-medium">กำลังดำเนินการ</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-amber-600">{inProgressOrders.length}</span>
              <span className="text-xs text-slate-400 font-medium">ชุด</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p className="text-[11px] text-slate-500 font-medium">ส่งมอบสำเร็จ (เสร็จสิ้น)</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-emerald-600">{completedOrders.length}</span>
              <span className="text-xs text-slate-400 font-medium">
                ({totalOrdersCount > 0 ? Math.round((completedOrders.length / totalOrdersCount) * 100) : 0}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Main Deep-Dive Cards: IDD, IDH, IDR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {allJobStats.map(stat => (
          <div 
            key={stat.type}
            className={`bg-white border rounded-xl shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md ${stat.color.border}`}
          >
            {/* Card Header */}
            <div className={`p-4 border-b ${stat.color.lightBg} ${stat.color.border} flex items-center justify-between`}>
              <div className="flex items-center space-x-2.5">
                <div className={`w-9 h-9 rounded-lg ${stat.color.bg} text-white flex items-center justify-center shadow-xs`}>
                  {stat.icon}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-slate-900">{stat.title}</h3>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium">{stat.subtitle}</p>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${stat.color.badgeBg} ${stat.color.badgeText}`}>
                {stat.totalCount} ชุด ({stat.percentage}%)
              </span>
            </div>

            {/* Card Body */}
            <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
              
              {/* Average Duration Box */}
              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    ค่าเฉลี่ยระยะเวลาต่อชุด
                  </p>
                  <p className="text-2xl font-bold text-slate-900 mt-0.5">
                    {stat.avgTotalDuration} <span className="text-xs font-normal text-slate-500">วัน</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded text-[11px] font-bold ${stat.color.badgeBg} ${stat.color.badgeText}`}>
                    {stat.activeCount} กำลังทำ / {stat.completedCount} เสร็จ
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    อัตราแก้ไข: <strong className="text-slate-700">{stat.alterationRate}%</strong> ({stat.alterationCount} ชุด)
                  </p>
                </div>
              </div>

              {/* Category Breakdown Progress Bars */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  ระยะเวลาเฉลี่ยแต่ละกระบวนการ:
                </p>

                <div className="space-y-2">
                  {stat.categoryAverages.map(cat => {
                    const percent = stat.avgTotalDuration > 0 
                      ? Math.min(100, Math.round((cat.avgDays / stat.avgTotalDuration) * 100)) 
                      : 0;

                    return (
                      <div key={cat.categoryId} className="text-xs">
                        <div className="flex items-center justify-between text-[11px] mb-0.5">
                          <span className="text-slate-600 font-medium truncate">{cat.categoryName}</span>
                          <span className="font-bold text-slate-800 shrink-0">
                            {cat.avgDays > 0 ? `${cat.avgDays} วัน` : '-'}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${stat.color.barColor}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Longest Stage & Action Button */}
              <div className="pt-2 border-t border-slate-100">
                {stat.longestStage && (
                  <div className="text-[11px] text-slate-500 mb-3 bg-amber-50/50 p-2 rounded border border-amber-100 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-slate-700">จุดที่ใช้เวลาเฉลี่ยมากที่สุด:</span>
                      <p className="font-bold text-slate-900 truncate">
                        ขั้นที่ {stat.longestStage.id}. {stat.longestStage.name} ({stat.longestStage.avgDays} วัน)
                      </p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => onFilterByJobType(stat.type)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${stat.color.lightBg} ${stat.color.text} hover:opacity-90 active:scale-[0.99]`}
                >
                  <span>ดูรายการออร์เดอร์ {stat.type} ทั้งหมด ({stat.totalCount})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          </div>
        ))}
      </div>

      {/* Tab: Process Comparison View */}
      {selectedTab === 'comparison' && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                เปรียบเทียบค่าเฉลี่ยระยะเวลา (วัน) ระหว่าง IDD vs IDH vs IDR
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                เปรียบเทียบจำนวนวันที่ใช้ในแต่ละกลุ่มกระบวนการผลิตและส่งมอบ
              </p>
            </div>
          </div>

          {/* Comparative Chart Bars */}
          <div className="space-y-4 pt-2">
            {STAGE_CATEGORIES.map(cat => {
              const iddVal = iddStats.categoryAverages.find(c => c.categoryId === cat.id)?.avgDays || 0;
              const idhVal = idhStats.categoryAverages.find(c => c.categoryId === cat.id)?.avgDays || 0;
              const idrVal = idrStats.categoryAverages.find(c => c.categoryId === cat.id)?.avgDays || 0;
              const maxVal = Math.max(iddVal, idhVal, idrVal, 4);

              return (
                <div key={cat.id} className="bg-slate-50/70 p-3.5 rounded-lg border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{cat.name}</span>
                    <span className="text-slate-400 text-[10px]">
                      ขั้นตอนที่ {STAGES.filter(s => s.category === cat.id).map(s => s.id).join(', ')}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {/* IDD Bar */}
                    <div className="flex items-center gap-3 text-xs">
                      <span className="w-8 font-bold text-indigo-700 font-mono">IDD</span>
                      <div className="flex-1 bg-slate-200/80 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${(iddVal / maxVal) * 100}%` }}
                        />
                      </div>
                      <span className="w-14 text-right font-bold text-slate-700">{iddVal > 0 ? `${iddVal} วัน` : '-'}</span>
                    </div>

                    {/* IDH Bar */}
                    <div className="flex items-center gap-3 text-xs">
                      <span className="w-8 font-bold text-purple-700 font-mono">IDH</span>
                      <div className="flex-1 bg-slate-200/80 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-purple-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${(idhVal / maxVal) * 100}%` }}
                        />
                      </div>
                      <span className="w-14 text-right font-bold text-slate-700">{idhVal > 0 ? `${idhVal} วัน` : '-'}</span>
                    </div>

                    {/* IDR Bar */}
                    <div className="flex items-center gap-3 text-xs">
                      <span className="w-8 font-bold text-amber-700 font-mono">IDR</span>
                      <div className="flex-1 bg-slate-200/80 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-amber-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${(idrVal / maxVal) * 100}%` }}
                        />
                      </div>
                      <span className="w-14 text-right font-bold text-slate-700">{idrVal > 0 ? `${idrVal} วัน` : '-'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: 22 Stages Average Breakdown Table */}
      {selectedTab === 'stages' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                ตารางค่าเฉลี่ยระยะเวลาครบทั้ง 22 สถานะ แยกตาม IDD • IDH • IDR
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                เวลาเฉลี่ยที่แต่ละออร์เดอร์ใช้จริงในขั้นตอนนั้นๆ (คำนวณจากประวัติการบันทึก)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3 w-12 text-center">ลำดับ</th>
                  <th className="py-2.5 px-3 min-w-[220px]">ชื่อขั้นตอนสถานะ</th>
                  <th className="py-2.5 px-3">กลุ่มงาน</th>
                  <th className="py-2.5 px-3 text-center bg-indigo-50/50 text-indigo-800">เฉลี่ย IDD</th>
                  <th className="py-2.5 px-3 text-center bg-purple-50/50 text-purple-800">เฉลี่ย IDH</th>
                  <th className="py-2.5 px-3 text-center bg-amber-50/50 text-amber-800">เฉลี่ย IDR</th>
                  <th className="py-2.5 px-3 text-center font-extrabold text-slate-800">เฉลี่ยรวมทุกประเภท</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stageMatrix.map(stage => (
                  <tr key={stage.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 text-center font-bold text-slate-500">{stage.id}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800">{stage.name}</td>
                    <td className="py-2 px-3 text-slate-500">{stage.categoryName}</td>
                    
                    <td className="py-2 px-3 text-center font-mono font-bold text-indigo-700 bg-indigo-50/20">
                      {stage.idd.avg !== '-' ? `${stage.idd.avg} วัน` : '-'}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-purple-700 bg-purple-50/20">
                      {stage.idh.avg !== '-' ? `${stage.idh.avg} วัน` : '-'}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-amber-700 bg-amber-50/20">
                      {stage.idr.avg !== '-' ? `${stage.idr.avg} วัน` : '-'}
                    </td>
                    <td className="py-2 px-3 text-center font-mono font-bold text-slate-900 bg-slate-50/50">
                      {stage.overall.avg !== '-' ? `${stage.overall.avg} วัน` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Branch Breakdown Matrix */}
      {selectedTab === 'branches' && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                สถิติและค่าเฉลี่ยระยะเวลาจำแนกตาม 8 สาขา
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                เปรียบเทียบจำนวนออร์เดอร์และระยะเวลาเฉลี่ยต่อชุดของแต่ละสาขา
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                  <th className="py-2.5 px-3">สาขา</th>
                  <th className="py-2.5 px-3 text-center">ออร์เดอร์รวม</th>
                  <th className="py-2.5 px-3 text-center bg-indigo-50/40 text-indigo-800">IDD (จำนวน / เฉลี่ย)</th>
                  <th className="py-2.5 px-3 text-center bg-purple-50/40 text-purple-800">IDH (จำนวน / เฉลี่ย)</th>
                  <th className="py-2.5 px-3 text-center bg-amber-50/40 text-amber-800">IDR (จำนวน / เฉลี่ย)</th>
                  <th className="py-2.5 px-3 text-center font-extrabold text-slate-800">เวลาเฉลี่ยรวม</th>
                  <th className="py-2.5 px-3 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {branchMatrix.map(b => (
                  <tr key={b.branchName} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-800">{b.branchName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">({b.branchCode})</div>
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                      {b.total} ชุด
                    </td>

                    <td className="py-2.5 px-3 text-center bg-indigo-50/20">
                      <span className="font-bold text-indigo-700">{b.iddCount} ชุด</span>
                      <span className="text-[11px] text-slate-500 ml-1">({b.iddAvg !== '-' ? `${b.iddAvg} วัน` : '-'})</span>
                    </td>

                    <td className="py-2.5 px-3 text-center bg-purple-50/20">
                      <span className="font-bold text-purple-700">{b.idhCount} ชุด</span>
                      <span className="text-[11px] text-slate-500 ml-1">({b.idhAvg !== '-' ? `${b.idhAvg} วัน` : '-'})</span>
                    </td>

                    <td className="py-2.5 px-3 text-center bg-amber-50/20">
                      <span className="font-bold text-amber-700">{b.idrCount} ชุด</span>
                      <span className="text-[11px] text-slate-500 ml-1">({b.idrAvg !== '-' ? `${b.idrAvg} วัน` : '-'})</span>
                    </td>

                    <td className="py-2.5 px-3 text-center font-bold text-slate-900 bg-slate-50/50">
                      {b.overallAvg !== '-' ? `${b.overallAvg} วัน` : '-'}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onFilterByBranch(b.branchName as BranchName)}
                        className="px-2.5 py-1 bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded text-[11px] font-bold transition-colors"
                      >
                        ดูสาขานี้
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
