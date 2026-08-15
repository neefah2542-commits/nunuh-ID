import React from 'react';
import { 
  Building2, 
  Scissors, 
  BarChart3, 
  Clock,
  Download, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Layers,
  Sparkles,
  Users
} from 'lucide-react';
import { BranchName, OrderItem, ViewMode } from '../types';
import { BRANCHES } from '../data/constants';
import { calculateDaysBetween, checkStageSlaStatus } from '../utils/dateUtils';

interface SidebarProps {
  selectedBranch: BranchName | 'all';
  onSelectBranch: (branch: BranchName | 'all') => void;
  orders: OrderItem[];
  customerCount?: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenCustomerDirectory?: () => void;
  onOpenAnalytics: () => void;
  onExportCsv: () => void;
  onResetData: () => void;
  onSelectViewMode?: (mode: ViewMode) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedBranch,
  onSelectBranch,
  orders,
  customerCount = 0,
  isOpenMobile,
  onCloseMobile,
  onOpenCustomerDirectory,
  onOpenAnalytics,
  onExportCsv,
  onResetData,
  onSelectViewMode,
}) => {
  // Count stats per branch
  const getBranchStats = (branchName: BranchName) => {
    const branchOrders = orders.filter(o => o.branch === branchName);
    const active = branchOrders.filter(o => o.currentStageId < 22).length;
    const overdue = branchOrders.filter(o => {
      if (o.currentStageId === 22) return false;
      const days = calculateDaysBetween(o.stageEnteredAt);
      return checkStageSlaStatus(o.currentStageId, days).isOverdue;
    }).length;

    return { total: branchOrders.length, active, overdue };
  };

  const totalActive = orders.filter(o => o.currentStageId < 22).length;
  const totalOverdue = orders.filter(o => {
    if (o.currentStageId === 22) return false;
    const days = calculateDaysBetween(o.stageEnteredAt);
    return checkStageSlaStatus(o.currentStageId, days).isOverdue;
  }).length;

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpenMobile && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar aside element */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Scissors className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold text-indigo-600 tracking-tight">IDD | IDH | IDR</h1>
            </div>
            <p className="text-xs text-slate-400 font-medium uppercase mt-1">Order Tracking System</p>
          </div>

          <button 
            onClick={onCloseMobile}
            className="p-1 text-slate-400 hover:text-slate-600 lg:hidden rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Branch Navigation List */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase px-3 py-2">
            <span>สาขาทั้งหมด (8)</span>
            {totalOverdue > 0 && (
              <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-bold">
                ล่าช้า {totalOverdue}
              </span>
            )}
          </div>

          {/* All Branches Button */}
          <button
            id="sidebar-branch-all"
            onClick={() => {
              onSelectBranch('all');
              onCloseMobile();
            }}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
              selectedBranch === 'all'
                ? 'bg-indigo-50 text-indigo-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="truncate">ทุกสาขา (All Branches)</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              selectedBranch === 'all'
                ? 'bg-indigo-200 text-indigo-800'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {totalActive}
            </span>
          </button>

          {/* 8 Branches */}
          {BRANCHES.map(branch => {
            const stats = getBranchStats(branch.name);
            const isSelected = selectedBranch === branch.name;

            return (
              <button
                key={branch.name}
                id={`sidebar-branch-${branch.code.toLowerCase()}`}
                onClick={() => {
                  onSelectBranch(branch.name);
                  onCloseMobile();
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                  isSelected
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                  <span className="truncate">{branch.name} ({branch.code})</span>
                </div>

                <div className="flex items-center gap-1">
                  {stats.overdue > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500" title={`มีงานเกินเกณฑ์ ${stats.overdue} รายการ`} />
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isSelected
                      ? 'bg-indigo-200 text-indigo-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {stats.active}
                  </span>
                </div>
              </button>
            );
          })}

          {/* Quick Management Section */}
          <div className="pt-4 mt-4 border-t border-slate-100 space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase px-3 py-1.5">เครื่องมือ</div>

            {onSelectViewMode && (
              <button
                onClick={() => {
                  onSelectViewMode('dashboard');
                  onCloseMobile();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50/60 hover:bg-indigo-100 transition-colors flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4 text-indigo-600" />
                <span>แดชบอร์ด IDD • IDH • IDR</span>
              </button>
            )}

            {onOpenCustomerDirectory && (
              <button
                onClick={() => {
                  onOpenCustomerDirectory();
                  onCloseMobile();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>สมุดรายชื่อลูกค้า</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 bg-indigo-200/80 rounded-full font-bold text-indigo-900">
                  {customerCount}
                </span>
              </button>
            )}

            <button
              onClick={() => {
                onOpenAnalytics();
                onCloseMobile();
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <Clock className="w-4 h-4 text-slate-600" />
              <span>สถิติระยะเวลาแต่ละขั้นตอน</span>
            </button>

            <button
              onClick={() => {
                onExportCsv();
                onCloseMobile();
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>ส่งออกรายงาน CSV</span>
            </button>

            <button
              onClick={() => {
                if (confirm('คุณต้องการรีเซ็ตข้อมูลตัวอย่าง 8 สาขาใหม่หรือไม่?')) {
                  onResetData();
                  onCloseMobile();
                }
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-slate-400" />
              <span>รีเซ็ตข้อมูลตัวอย่าง</span>
            </button>
          </div>
        </nav>

        {/* Profile Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3 p-1">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-bold text-xs shadow-xs">
              AD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate">Admin User</p>
              <p className="text-[10px] text-slate-400 truncate">Central Manager (8 Branches)</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
