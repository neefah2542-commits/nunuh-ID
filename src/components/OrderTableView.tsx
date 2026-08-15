import React, { useState } from 'react';
import { 
  Eye, 
  ChevronRight, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Truck, 
  Phone, 
  Flame, 
  Edit2, 
  Trash2,
  ChevronLeft
} from 'lucide-react';
import { OrderItem } from '../types';
import { calculateDaysBetween, checkStageSlaStatus, formatDurationThai, formatThaiDate, getDaysRemaining } from '../utils/dateUtils';
import { MembershipBadge } from './MembershipCardTypeSelector';

interface OrderTableViewProps {
  orders: OrderItem[];
  onSelectOrder: (order: OrderItem) => void;
  onQuickAdvance: (order: OrderItem) => void;
  onEditOrder: (order: OrderItem) => void;
  onDeleteOrder: (order: OrderItem) => void;
}

export const OrderTableView: React.FC<OrderTableViewProps> = ({
  orders,
  onSelectOrder,
  onQuickAdvance,
  onEditOrder,
  onDeleteOrder,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-sm">
        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
          <Clock className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">ไม่พบรายการสั่งตัดตามเงื่อนไข</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          ลองปรับตัวกรองสาขา ประเภทงาน หรือคำค้นหาใหม่ หรือกดปุ่ม "สร้างออร์เดอร์ใหม่" เพื่อเพิ่มรายการ
        </p>
      </div>
    );
  }

  // Pagination logic
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOrders = orders.slice(startIndex, startIndex + itemsPerPage);

  // Helper for status dot and duration color theme
  const getStageColorDot = (stageId: number, isOverdue: boolean) => {
    if (isOverdue) return 'bg-amber-500';
    if (stageId === 22) return 'bg-emerald-500';
    if (stageId <= 7) return 'bg-blue-500';
    if (stageId <= 10) return 'bg-purple-500';
    if (stageId <= 12) return 'bg-indigo-500';
    if (stageId <= 19) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getDurationPillStyle = (stageId: number, isOverdue: boolean) => {
    if (isOverdue) return 'bg-amber-50 text-amber-700 border border-amber-200';
    if (stageId === 22) return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    if (stageId <= 7) return 'bg-blue-50 text-blue-600 border border-blue-100';
    if (stageId <= 10) return 'bg-purple-50 text-purple-600 border border-purple-100';
    if (stageId <= 19) return 'bg-amber-50 text-amber-600 border border-amber-100';
    return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
  };

  const getProgressColor = (stageId: number) => {
    if (stageId === 22) return 'bg-emerald-500';
    if (stageId <= 7) return 'bg-blue-500';
    if (stageId <= 10) return 'bg-purple-500';
    if (stageId <= 19) return 'bg-amber-500';
    return 'bg-indigo-600';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
      {/* Table Header Row */}
      <div className="overflow-x-auto">
        <div className="min-w-[840px]">
          <div className="bg-slate-50 border-b border-slate-200 grid grid-cols-12 gap-3 px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <div className="col-span-2">เลขที่งาน / สาขา</div>
            <div className="col-span-2">ลูกค้า & เบอร์ติดต่อ</div>
            <div className="col-span-4">สถานะปัจจุบัน (22 ขั้นตอน)</div>
            <div className="col-span-2 text-center">ระยะเวลา (วัน)</div>
            <div className="col-span-2 text-right">กำหนดวันงาน & จัดการ</div>
          </div>

          {/* Table Body / Rows */}
          <div className="divide-y divide-slate-100">
            {currentOrders.map(order => {
              const daysInStage = calculateDaysBetween(order.stageEnteredAt);
              const { isOverdue, slaDays } = checkStageSlaStatus(order.currentStageId, daysInStage);
              const isCompleted = order.currentStageId === 22;
              const percent = Math.round((order.currentStageId / 22) * 100);

              return (
                <div 
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className="grid grid-cols-12 gap-3 px-6 py-3.5 items-center hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Col 1: Job Code, Type, Branch */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono text-xs font-bold text-indigo-600">
                        {order.jobCode}
                      </span>
                      {order.isUrgent && (
                        <span className="px-1 py-0.2 bg-rose-500 text-white rounded text-[9px] font-bold flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5" /> ด่วน
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-medium text-slate-700">สาขา{order.branch}</span>
                      <span>•</span>
                      <span className="font-bold text-indigo-700">{order.jobType}</span>
                    </div>
                  </div>

                  {/* Col 2: Customer */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {order.customerName}
                      </span>
                      {order.customerType && (
                        <MembershipBadge type={order.customerType} size="sm" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span className="font-mono">{order.customerPhone}</span>
                    </div>
                  </div>

                  {/* Col 3: Current Stage & Progress Bar */}
                  <div className="col-span-4 pr-2">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${getStageColorDot(order.currentStageId, isOverdue)}`} />
                      <span className="text-xs text-slate-700 font-medium truncate">
                        ขั้นที่ {order.currentStageId}. {order.currentStageName}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getProgressColor(order.currentStageId)}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Col 4: Duration Days */}
                  <div className="col-span-2 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${getDurationPillStyle(order.currentStageId, isOverdue)}`}>
                      {formatDurationThai(daysInStage)}
                    </span>
                    {isOverdue && (
                      <div className="text-[10px] text-amber-600 font-bold mt-0.5 flex items-center justify-center gap-0.5">
                        <AlertTriangle className="w-2.5 h-2.5" /> เกิน SLA
                      </div>
                    )}
                  </div>

                  {/* Col 5: Event Date & Actions */}
                  <div className="col-span-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="text-xs text-slate-500 font-medium">
                      {order.eventDateTarget ? formatThaiDate(order.eventDateTarget) : '-'}
                    </div>

                    <div className="flex items-center justify-end gap-1 mt-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {!isCompleted && (
                        <button
                          onClick={() => onQuickAdvance(order)}
                          className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-[11px] font-bold rounded transition-colors flex items-center gap-0.5"
                          title="เลื่อนไปสถานะถัดไป"
                        >
                          <span>ถัดไป</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                      {isCompleted && (
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> จบงาน
                        </span>
                      )}

                      <button
                        onClick={() => onSelectOrder(order)}
                        className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                        title="ดูรายละเอียด"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onEditOrder(order)}
                        className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                        title="แก้ไขข้อมูล"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteOrder(order)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                        title="ลบออร์เดอร์"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sleek Pagination Footer */}
      <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
        <div>
          แสดง {orders.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, orders.length)} จาก {orders.length} ออร์เดอร์
        </div>
        <div className="flex space-x-1.5">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-6 h-6 border border-slate-200 rounded bg-white flex items-center justify-center text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="w-3 h-3" />
          </button>
          
          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-6 h-6 border border-slate-200 rounded flex items-center justify-center transition-colors ${
                  currentPage === pageNum
                    ? 'bg-indigo-50 text-indigo-600 font-bold border-indigo-200'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
            className="w-6 h-6 border border-slate-200 rounded bg-white flex items-center justify-center text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
