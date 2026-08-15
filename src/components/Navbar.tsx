import React from 'react';
import { 
  Scissors, 
  Plus, 
  Download, 
  BarChart3, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  Users
} from 'lucide-react';
import { OrderItem } from '../types';
import { calculateDaysBetween, checkStageSlaStatus } from '../utils/dateUtils';

interface NavbarProps {
  orders: OrderItem[];
  customerCount?: number;
  onOpenNewOrder: () => void;
  onOpenCustomerDirectory?: () => void;
  onOpenAnalytics: () => void;
  onExportCsv: () => void;
  onResetData: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  orders,
  customerCount = 0,
  onOpenNewOrder,
  onOpenCustomerDirectory,
  onOpenAnalytics,
  onExportCsv,
  onResetData,
}) => {
  // Calculate quick metrics
  const totalOrders = orders.length;
  const activeOrders = orders.filter(o => o.currentStageId < 22).length;
  const completedOrders = orders.filter(o => o.currentStageId === 22).length;
  
  const overdueOrders = orders.filter(o => {
    if (o.currentStageId === 22) return false;
    const daysSpent = calculateDaysBetween(o.stageEnteredAt);
    const { isOverdue } = checkStageSlaStatus(o.currentStageId, daysSpent);
    return isOverdue;
  }).length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-100 flex-shrink-0">
              <Scissors className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-bold tracking-wider rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                  IDD • IDH • IDR
                </span>
                <span className="hidden sm:inline-block text-xs text-slate-500 font-medium">
                  ระบบติดตามงานตัดเย็บ 8 สาขา
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                ระบบติดตามสถานะงานสั่งตัด & คำนวณระยะเวลา (22 ขั้นตอน)
              </h1>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Metrics Bar on Desktop */}
            <div className="hidden lg:flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-xs">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white font-medium text-slate-700 shadow-2xs border border-slate-100">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>กำลังผลิต: <strong>{activeOrders}</strong></span>
              </div>
              {overdueOrders > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 font-semibold text-amber-800 border border-amber-200">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>เกิน SLA: <strong>{overdueOrders}</strong></span>
                </div>
              )}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white font-medium text-emerald-700 shadow-2xs border border-slate-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>ปิดงานแล้ว: <strong>{completedOrders}</strong></span>
              </div>
            </div>

            {/* Customer Directory button */}
            {onOpenCustomerDirectory && (
              <button
                id="btn-open-customers"
                onClick={onOpenCustomerDirectory}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg text-indigo-700 bg-indigo-50/80 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 transition-colors shadow-2xs"
                title="จัดการสมุดรายชื่อลูกค้า และสัดส่วนที่บันทึกไว้"
              >
                <Users className="w-4 h-4 text-indigo-600" />
                <span className="hidden sm:inline font-semibold">สมุดลูกค้า</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-indigo-200/80 rounded-full font-bold text-indigo-900">
                  {customerCount}
                </span>
              </button>
            )}

            {/* Analytics button */}
            <button
              id="btn-open-analytics"
              onClick={onOpenAnalytics}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
              title="ดูสถิติระยะเวลาเฉลี่ยแต่ละขั้นตอนและวิเคราะห์จุดคอขวด"
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span className="hidden md:inline">สถิติระยะเวลา (SLA)</span>
            </button>

            {/* Export CSV */}
            <button
              id="btn-export-csv"
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-2xs"
              title="ส่งออกรายงาน Excel / CSV พร้อมสรุปเวลาแต่ละสถานะ"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span className="hidden md:inline">ส่งออก CSV</span>
            </button>

            {/* Reset Data sample button */}
            <button
              id="btn-reset-data"
              onClick={() => {
                if (confirm('คุณต้องการโหลดข้อมูลตัวอย่าง 8 สาขาใหม่หรือไม่?')) {
                  onResetData();
                }
              }}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="รีเซ็ตเป็นข้อมูลตัวอย่าง"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* New Order Button */}
            <button
              id="btn-new-order"
              onClick={onOpenNewOrder}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-sm shadow-indigo-200 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>สร้างออร์เดอร์ใหม่</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
