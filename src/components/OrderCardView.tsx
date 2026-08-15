import React from 'react';
import { 
  Eye, 
  ChevronRight, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Truck, 
  Phone, 
  Calendar,
  Flame,
  User,
  Scissors,
  Trash2
} from 'lucide-react';
import { OrderItem } from '../types';
import { calculateDaysBetween, checkStageSlaStatus, formatDurationThai, formatThaiDate, getDaysRemaining } from '../utils/dateUtils';

interface OrderCardViewProps {
  orders: OrderItem[];
  onSelectOrder: (order: OrderItem) => void;
  onQuickAdvance: (order: OrderItem) => void;
  onDeleteOrder?: (order: OrderItem) => void;
}

export const OrderCardView: React.FC<OrderCardViewProps> = ({
  orders,
  onSelectOrder,
  onQuickAdvance,
  onDeleteOrder,
}) => {
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
        <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-800">ไม่พบรายการสั่งตัด</h3>
        <p className="text-xs text-slate-500 mt-1">ลองเปลี่ยนเงื่อนไขการค้นหาหรือสาขา</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.map(order => {
        const daysInStage = calculateDaysBetween(order.stageEnteredAt);
        const { isOverdue, slaDays } = checkStageSlaStatus(order.currentStageId, daysInStage);
        const eventRemaining = getDaysRemaining(order.eventDateTarget);
        const isCompleted = order.currentStageId === 22;

        const typeColor = 
          order.jobType === 'IDD' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
          order.jobType === 'IDH' ? 'bg-rose-50 text-rose-700 border-rose-200' :
          'bg-amber-50 text-amber-700 border-amber-200';

        return (
          <div
            key={order.id}
            onClick={() => onSelectOrder(order)}
            className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between group"
          >
            {/* Header */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`px-2 py-0.5 font-bold rounded text-xs border ${typeColor}`}>
                    {order.jobType}
                  </span>
                  <span className="font-bold text-sm text-slate-900">
                    {order.jobCode}
                  </span>
                  {order.isUrgent && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-500 text-white rounded text-[10px] font-bold">
                      <Flame className="w-3 h-3" /> ด่วน
                    </span>
                  )}
                </div>

                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700 border border-slate-200">
                  สาขา{order.branch}
                </span>
              </div>

              {/* Customer */}
              <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                <div className="flex items-center gap-1.5 font-medium text-slate-800">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{order.customerName}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Phone className="w-3 h-3" />
                  <span>{order.customerPhone}</span>
                </div>
              </div>

              {/* Item Description */}
              <p className="text-xs text-slate-500 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100 mb-3">
                {order.itemDescription || 'ชุดสั่งตัดพิเศษ'}
              </p>

              {/* Current Stage */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                  <span>ขั้นที่ {order.currentStageId}/22</span>
                  <span className="text-[11px] text-slate-500">{Math.round((order.currentStageId / 22) * 100)}%</span>
                </div>
                <p className="text-xs font-semibold text-indigo-950 mb-1.5 line-clamp-1">
                  {order.currentStageName}
                </p>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      isCompleted ? 'bg-emerald-500' :
                      order.currentStageId >= 13 ? 'bg-amber-500' :
                      order.currentStageId >= 8 ? 'bg-purple-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${(order.currentStageId / 22) * 100}%` }}
                  />
                </div>
              </div>

              {/* Duration & SLA Info */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs mb-3">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-600">เวลาในขั้นนี้:</span>
                  <strong className={isOverdue ? 'text-amber-700' : 'text-slate-800'}>
                    {formatDurationThai(daysInStage)}
                  </strong>
                </div>

                {isOverdue && (
                  <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                    <AlertTriangle className="w-3 h-3" /> ช้ากว่าเกณฑ์
                  </span>
                )}
              </div>

              {/* Targets & Tracking */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 mb-2">
                <div>
                  <span className="block text-[10px] text-slate-400">วันงานจริง:</span>
                  <span className="font-semibold text-slate-700">
                    {order.eventDateTarget ? formatThaiDate(order.eventDateTarget) : '-'}
                  </span>
                  {order.eventDateTarget && (
                    <span className={`ml-1 font-bold ${eventRemaining.isPast ? 'text-rose-600' : 'text-indigo-600'}`}>
                      ({eventRemaining.label})
                    </span>
                  )}
                </div>

                {order.emsNumber ? (
                  <div>
                    <span className="block text-[10px] text-slate-400">เลข EMS:</span>
                    <span className="font-mono text-slate-800 font-bold">{order.emsNumber}</span>
                  </div>
                ) : (
                  <div>
                    <span className="block text-[10px] text-slate-400">ประวัติบันทึก:</span>
                    <span>{order.history.length} ขั้นตอน</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onSelectOrder(order)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>ดูไทม์ไลน์</span>
                </button>

                {onDeleteOrder && (
                  <button
                    onClick={() => onDeleteOrder(order)}
                    className="p-1 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                    title="ลบออร์เดอร์"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {!isCompleted && (
                <button
                  onClick={() => onQuickAdvance(order)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <span>ถัดไป</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}

              {isCompleted && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> ปิดงานแล้ว
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
