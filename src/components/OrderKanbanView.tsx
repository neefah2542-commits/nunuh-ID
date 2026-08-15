import React from 'react';
import { 
  ChevronRight, 
  Clock, 
  AlertTriangle, 
  Flame, 
  CheckCircle2, 
  User, 
  Layers,
  Trash2
} from 'lucide-react';
import { OrderItem } from '../types';
import { STAGE_CATEGORIES } from '../data/constants';
import { calculateDaysBetween, checkStageSlaStatus, formatDurationThai } from '../utils/dateUtils';
import { MembershipBadge } from './MembershipCardTypeSelector';

interface OrderKanbanViewProps {
  orders: OrderItem[];
  onSelectOrder: (order: OrderItem) => void;
  onQuickAdvance: (order: OrderItem) => void;
  onDeleteOrder?: (order: OrderItem) => void;
}

export const OrderKanbanView: React.FC<OrderKanbanViewProps> = ({
  orders,
  onSelectOrder,
  onQuickAdvance,
  onDeleteOrder,
}) => {
  // Helper to get category for an order
  const getOrderCategory = (stageId: number): string => {
    if (stageId <= 7) return 'production';
    if (stageId <= 10) return 'distribution';
    if (stageId <= 12) return 'fitting';
    if (stageId <= 19) return 'alteration';
    return 'handover';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
      {STAGE_CATEGORIES.map(col => {
        const colOrders = orders.filter(o => getOrderCategory(o.currentStageId) === col.id);

        return (
          <div 
            key={col.id}
            className="bg-slate-100/70 rounded-xl p-3 border border-slate-200 min-w-[260px] flex flex-col max-h-[calc(100vh-280px)]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-slate-800">
                  {col.name}
                </span>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                {colOrders.length}
              </span>
            </div>

            {/* Orders in Column */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {colOrders.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  ไม่มีงานในขั้นตอนนี้
                </div>
              ) : (
                colOrders.map(order => {
                  const daysInStage = calculateDaysBetween(order.stageEnteredAt);
                  const { isOverdue } = checkStageSlaStatus(order.currentStageId, daysInStage);
                  const isCompleted = order.currentStageId === 22;

                  const typeColor = 
                    order.jobType === 'IDD' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                    order.jobType === 'IDH' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    'bg-amber-50 text-amber-700 border-amber-200';

                  return (
                    <div
                      key={order.id}
                      onClick={() => onSelectOrder(order)}
                      className="bg-white rounded-lg p-3 border border-slate-200 shadow-2xs hover:shadow-xs hover:border-indigo-300 transition-all cursor-pointer"
                    >
                      {/* Top badge */}
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <div className="flex items-center gap-1">
                          <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded border ${typeColor}`}>
                            {order.jobType}
                          </span>
                          <span className="font-bold text-xs text-slate-900">
                            {order.jobCode}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                          {order.branch}
                        </span>
                      </div>

                      {/* Customer */}
                      <div className="text-xs font-semibold text-slate-800 truncate mb-1">
                        {order.customerName}
                      </div>

                      {/* Stage Name */}
                      <div className="bg-slate-50 p-1.5 rounded border border-slate-100 text-[11px] mb-2">
                        <div className="font-bold text-indigo-900 line-clamp-1">
                          {order.currentStageId}. {order.currentStageName}
                        </div>
                      </div>

                      {/* Duration & Actions */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className={isOverdue ? 'font-bold text-amber-700' : 'text-slate-600'}>
                              {formatDurationThai(daysInStage)}
                            </span>
                          </div>

                          {onDeleteOrder && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteOrder(order);
                              }}
                              className="p-1 text-slate-300 hover:text-rose-600 rounded transition-colors"
                              title="ลบออร์เดอร์"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {!isCompleted && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onQuickAdvance(order);
                            }}
                            className="p-1 hover:bg-indigo-50 text-indigo-600 rounded transition-colors font-bold flex items-center gap-0.5"
                            title="เลื่อนขั้นตอน"
                          >
                            <span>ถัดไป</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
