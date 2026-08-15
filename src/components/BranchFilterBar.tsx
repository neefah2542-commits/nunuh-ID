import React from 'react';
import { Building2, MapPin } from 'lucide-react';
import { BranchName, OrderItem } from '../types';
import { BRANCHES } from '../data/constants';
import { calculateDaysBetween, checkStageSlaStatus } from '../utils/dateUtils';

interface BranchFilterBarProps {
  selectedBranch: BranchName | 'all';
  onSelectBranch: (branch: BranchName | 'all') => void;
  orders: OrderItem[];
}

export const BranchFilterBar: React.FC<BranchFilterBarProps> = ({
  selectedBranch,
  onSelectBranch,
  orders,
}) => {
  // Count stats per branch
  const getBranchStats = (branchName: BranchName) => {
    const branchOrders = orders.filter(o => o.branch === branchName);
    const active = branchOrders.filter(o => o.currentStageId < 22).length;
    const completed = branchOrders.filter(o => o.currentStageId === 22).length;
    const overdue = branchOrders.filter(o => {
      if (o.currentStageId === 22) return false;
      const days = calculateDaysBetween(o.stageEnteredAt);
      return checkStageSlaStatus(o.currentStageId, days).isOverdue;
    }).length;

    return { total: branchOrders.length, active, completed, overdue };
  };

  const allActiveCount = orders.filter(o => o.currentStageId < 22).length;
  const allOverdueCount = orders.filter(o => {
    if (o.currentStageId === 22) return false;
    const days = calculateDaysBetween(o.stageEnteredAt);
    return checkStageSlaStatus(o.currentStageId, days).isOverdue;
  }).length;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <h2 className="text-sm font-bold text-slate-900">
            เลือกดูตามสาขา (ทั้งหมด 8 สาขา)
          </h2>
        </div>
        <span className="text-xs text-slate-500">
          คลิกที่สาขาเพื่อกรองงานเฉพาะพื้นที่
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-2">
        {/* All Branches Button */}
        <button
          id="branch-btn-all"
          onClick={() => onSelectBranch('all')}
          className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all relative ${
            selectedBranch === 'all'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100 ring-2 ring-indigo-200'
              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <span className="text-xs font-bold truncate w-full">ทุกสาขา (8 สาขา)</span>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
              selectedBranch === 'all' ? 'bg-indigo-700 text-white' : 'bg-white text-slate-700 border border-slate-200'
            }`}>
              {allActiveCount} งาน
            </span>
            {allOverdueCount > 0 && (
              <span className={`text-[10px] font-bold px-1 rounded ${
                selectedBranch === 'all' ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800'
              }`}>
                ช้า {allOverdueCount}
              </span>
            )}
          </div>
        </button>

        {/* 8 Specific Branches */}
        {BRANCHES.map(branch => {
          const stats = getBranchStats(branch.name);
          const isSelected = selectedBranch === branch.name;

          return (
            <button
              key={branch.name}
              id={`branch-btn-${branch.code.toLowerCase()}`}
              onClick={() => onSelectBranch(branch.name)}
              className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all relative ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-100 ring-2 ring-indigo-200'
                  : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold truncate">สาขา{branch.name}</span>
              </div>

              <div className="flex items-center gap-1.5 mt-1.5">
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                  isSelected 
                    ? 'bg-indigo-700 text-white' 
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {stats.active} งาน
                </span>

                {stats.overdue > 0 && (
                  <span className={`text-[10px] font-bold px-1 rounded ${
                    isSelected ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800'
                  }`}>
                    ช้า {stats.overdue}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
