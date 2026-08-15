import React from 'react';
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  ArrowRight,
  TrendingUp,
  User,
  MapPin
} from 'lucide-react';
import { OrderItem } from '../types';
import { calculateDaysBetween, checkStageSlaStatus, formatDurationThai, formatThaiDate } from '../utils/dateUtils';
import { STAGES } from '../data/constants';

interface OrderTimelineViewProps {
  orders: OrderItem[];
  onSelectOrder: (order: OrderItem) => void;
}

export const OrderTimelineView: React.FC<OrderTimelineViewProps> = ({
  orders,
  onSelectOrder,
}) => {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800">ไม่พบรายการเพื่อวิเคราะห์ไทม์ไลน์</h3>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map(order => {
        const totalCycleDays = calculateDaysBetween(
          order.orderDate, 
          order.currentStageId === 22 ? order.updatedAt : undefined
        );
        const currentDaysInStage = calculateDaysBetween(order.stageEnteredAt);
        const { isOverdue, slaDays } = checkStageSlaStatus(order.currentStageId, currentDaysInStage);
        const isCompleted = order.currentStageId === 22;

        const typeColor = 
          order.jobType === 'IDD' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
          order.jobType === 'IDH' ? 'bg-rose-50 text-rose-700 border-rose-200' :
          'bg-amber-50 text-amber-700 border-amber-200';

        return (
          <div
            key={order.id}
            onClick={() => onSelectOrder(order)}
            className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition-all cursor-pointer"
          >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 text-xs font-bold rounded border ${typeColor}`}>
                  {order.jobType}
                </span>
                <span className="text-sm font-bold text-slate-900">
                  {order.jobCode}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ({order.customerName} - {order.customerPhone})
                </span>
                <span className="px-2 py-0.5 text-xs rounded bg-slate-100 text-slate-700 font-semibold">
                  สาขา{order.branch}
                </span>
              </div>

              {/* Total cycle time badge */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">เวลารวมตั้งแต่เริ่มสั่งตัด:</span>
                <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                  {formatDurationThai(totalCycleDays)}
                </span>
              </div>
            </div>

            {/* Current Stage Highlight */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  สถานะปัจจุบัน (ขั้นตอน {order.currentStageId} จาก 22 ขั้น)
                </span>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  {order.currentStageName}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  เริ่มขั้นตอนนี้เมื่อ: {formatThaiDate(order.stageEnteredAt, true)}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">ระยะเวลาในสถานะนี้</span>
                  <span className={`text-base font-bold ${
                    isOverdue ? 'text-amber-700' : 'text-slate-900'
                  }`}>
                    {formatDurationThai(currentDaysInStage)}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    (เกณฑ์มาตรฐาน: {slaDays} วัน)
                  </span>
                </div>
                {isOverdue && (
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-lg flex items-center gap-1 text-xs font-bold border border-amber-300">
                    <AlertTriangle className="w-4 h-4" />
                    <span>เกินเกณฑ์ SLA</span>
                  </div>
                )}
              </div>
            </div>

            {/* Stage Duration Breakdown Table / Sequence */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                <span>สรุปประวัติระยะเวลาที่ใช้ในแต่ละขั้นตอน ({order.history.length} ขั้นตอนที่บันทึกแล้ว):</span>
                <span className="text-indigo-600 font-medium">คลิกเพื่อดูบันทึกและจัดการ</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {order.history.map((hist, idx) => {
                  const stageDef = STAGES.find(s => s.id === hist.stageId);
                  const isStageActive = hist.completedAt === undefined;
                  const days = hist.daysSpent !== undefined 
                    ? hist.daysSpent 
                    : calculateDaysBetween(hist.enteredAt);

                  return (
                    <div 
                      key={idx}
                      className={`p-2.5 rounded-lg border text-xs transition-all ${
                        isStageActive 
                          ? 'bg-indigo-50/70 border-indigo-200 ring-1 ring-indigo-300' 
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-slate-900 truncate">
                          {hist.stageId}. {hist.stageName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] mt-1.5 pt-1.5 border-t border-slate-100">
                        <span className="text-slate-500">ใช้เวลา:</span>
                        <span className={`font-bold ${
                          isStageActive ? 'text-indigo-700' : 'text-slate-800'
                        }`}>
                          {formatDurationThai(days)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>{formatThaiDate(hist.enteredAt)}</span>
                        {hist.updatedBy && <span className="truncate max-w-[90px]">{hist.updatedBy}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
};
