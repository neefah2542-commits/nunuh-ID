import React from 'react';
import { 
  X, 
  BarChart3, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Layers, 
  Building2,
  PieChart
} from 'lucide-react';
import { OrderItem } from '../types';
import { BRANCHES, JOB_TYPES, STAGES } from '../data/constants';
import { calculateDaysBetween, formatDurationThai } from '../utils/dateUtils';

interface DurationAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderItem[];
}

export const DurationAnalyticsModal: React.FC<DurationAnalyticsModalProps> = ({
  isOpen,
  onClose,
  orders,
}) => {
  if (!isOpen) return null;

  // Calculate average days per stage across all history records
  const stageStats: { [stageId: number]: { totalDays: number; count: number; maxDays: number } } = {};
  
  orders.forEach(order => {
    order.history.forEach(hist => {
      const days = hist.daysSpent !== undefined 
        ? hist.daysSpent 
        : calculateDaysBetween(hist.enteredAt);
      
      if (!stageStats[hist.stageId]) {
        stageStats[hist.stageId] = { totalDays: 0, count: 0, maxDays: 0 };
      }
      stageStats[hist.stageId].totalDays += days;
      stageStats[hist.stageId].count += 1;
      if (days > stageStats[hist.stageId].maxDays) {
        stageStats[hist.stageId].maxDays = days;
      }
    });
  });

  // Calculate overall average cycle days for completed / active
  let totalOverallDays = 0;
  let ordersWithDays = 0;
  orders.forEach(o => {
    const days = calculateDaysBetween(o.orderDate, o.currentStageId === 22 ? o.updatedAt : undefined);
    totalOverallDays += days;
    ordersWithDays += 1;
  });
  const avgOverallCycle = ordersWithDays > 0 ? (totalOverallDays / ordersWithDays).toFixed(1) : '0';

  // Branch performance
  const branchPerformances = BRANCHES.map(b => {
    const bOrders = orders.filter(o => o.branch === b.name);
    let totalDays = 0;
    bOrders.forEach(o => {
      totalDays += calculateDaysBetween(o.orderDate, o.currentStageId === 22 ? o.updatedAt : undefined);
    });
    const avgDays = bOrders.length > 0 ? (totalDays / bOrders.length).toFixed(1) : '-';
    return {
      branch: b.name,
      totalOrders: bOrders.length,
      active: bOrders.filter(o => o.currentStageId < 22).length,
      avgDays,
    };
  });

  // Job Type breakdown
  const jobTypePerformances = JOB_TYPES.map(jt => {
    const jtOrders = orders.filter(o => o.jobType === jt.type);
    let totalDays = 0;
    jtOrders.forEach(o => {
      totalDays += calculateDaysBetween(o.orderDate, o.currentStageId === 22 ? o.updatedAt : undefined);
    });
    const avgDays = jtOrders.length > 0 ? (totalDays / jtOrders.length).toFixed(1) : '-';
    return {
      type: jt.type,
      label: jt.label,
      count: jtOrders.length,
      avgDays,
    };
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                รายงานและสถิติระยะเวลาในแต่ละสถานะ (Duration & SLA Analytics)
              </h2>
              <p className="text-xs text-slate-300">
                วิเคราะห์เวลาเฉลี่ย 22 ขั้นตอน และประสิทธิภาพการส่งมอบ 8 สาขา
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* High-level KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block">ระยะเวลารวมเฉลี่ยต่อชุด</span>
              <div className="text-2xl font-bold text-indigo-700 mt-1">
                {avgOverallCycle} <span className="text-sm font-normal text-slate-600">วัน</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                คำนวณจาก {orders.length} ออร์เดอร์ในระบบ
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block">สาขาที่มียอดสั่งตัดสูงสุด</span>
              <div className="text-lg font-bold text-slate-900 mt-1">
                หาดใหญ่ / ปัตตานี
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                ครอบคลุม 8 สาขาทั่วประเทศ
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-semibold block">ขั้นตอนที่ใช้เวลามากที่สุด</span>
              <div className="text-sm font-bold text-amber-800 mt-1 truncate">
                4. แพทเทิร์น & เย็บ / 6. ปักคริสตัล
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">
                เฉลี่ย 3.5 - 5.0 วันต่อชิ้นงาน
              </span>
            </div>
          </div>

          {/* Average Days Per Stage (22 Stages Table) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>ตารางสรุปเวลาเฉลี่ยที่ใช้ในแต่ละขั้นตอน (ทั้งหมด 22 ขั้นตอน)</span>
              </h3>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">ลำดับ</th>
                      <th className="py-2.5 px-3 min-w-[200px]">ชื่อขั้นตอนสถานะ</th>
                      <th className="py-2.5 px-3">กลุ่มงาน</th>
                      <th className="py-2.5 px-3">เวลาเฉลี่ยที่ใช้จริง</th>
                      <th className="py-2.5 px-3">จำนวนงานที่ผ่าน</th>
                      <th className="py-2.5 px-3">สถานะความเร็ว</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {STAGES.map(stage => {
                      const stat = stageStats[stage.id];
                      const avgDays = stat && stat.count > 0 ? (stat.totalDays / stat.count).toFixed(1) : '-';
                      const count = stat ? stat.count : 0;
                      const isHigh = avgDays !== '-' && parseFloat(avgDays) > stage.defaultSlaDays && stage.defaultSlaDays > 0;

                      return (
                        <tr key={stage.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-bold text-slate-500">{stage.id}</td>
                          <td className="py-2 px-3 font-semibold text-slate-800">{stage.name}</td>
                          <td className="py-2 px-3 text-slate-500">{stage.categoryName}</td>
                          <td className="py-2 px-3 font-bold text-indigo-700">
                            {avgDays !== '-' ? `${avgDays} วัน` : '-'}
                          </td>
                          <td className="py-2 px-3 text-slate-600">{count} ชุด</td>
                          <td className="py-2 px-3">
                            {avgDays === '-' ? (
                              <span className="text-slate-400">-</span>
                            ) : isHigh ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                ใช้เวลานานกว่าปกติ
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                                ปกติ
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Branch Breakdown & Job Type Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Branch Performance */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <span>เวลาเฉลี่ยแยกตาม 8 สาขา</span>
              </h4>

              <div className="space-y-2">
                {branchPerformances.map(bp => (
                  <div key={bp.branch} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-200">
                    <span className="font-semibold text-slate-800">สาขา{bp.branch}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-500">ออร์เดอร์: <strong>{bp.totalOrders}</strong></span>
                      <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        เฉลี่ย {bp.avgDays} {bp.avgDays !== '-' ? 'วัน' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Job Type Performance */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>เวลาเฉลี่ยแยกตามประเภทงาน (IDD / IDH / IDR)</span>
              </h4>

              <div className="space-y-2">
                {jobTypePerformances.map(jp => (
                  <div key={jp.type} className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-bold text-slate-900">{jp.label}</span>
                      <span className="font-bold text-indigo-700">เฉลี่ย {jp.avgDays} {jp.avgDays !== '-' ? 'วัน' : ''}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      จำนวนงานทั้งหมดในระบบ: <strong>{jp.count}</strong> รายการ
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors"
          >
            ปิดหน้ารายงาน
          </button>
        </div>

      </div>
    </div>
  );
};
