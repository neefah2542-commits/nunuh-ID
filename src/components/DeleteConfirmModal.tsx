import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { OrderItem } from '../types';

interface DeleteConfirmModalProps {
  order: OrderItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderId: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  order,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 relative">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Heading */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">ยืนยันการลบออร์เดอร์</h3>
            <p className="text-xs text-slate-500">การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
          </div>
        </div>

        {/* Order Details Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">รหัสออร์เดอร์:</span>
            <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {order.jobCode}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">ลูกค้า:</span>
            <span className="font-semibold text-slate-800">{order.customerName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">สาขา:</span>
            <span className="text-slate-700">สาขา{order.branch}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">สถานะปัจจุบัน:</span>
            <span className="text-indigo-700 font-medium">{order.currentStageName}</span>
          </div>
        </div>

        {/* Warning message */}
        <div className="flex items-start gap-2 text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-100 mb-5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <span>ข้อมูลออร์เดอร์นี้และประวัติการติดตามงานทั้งหมดจะถูกลบออกจากระบบทันที</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(order.id);
              onClose();
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>ยืนยันลบออร์เดอร์</span>
          </button>
        </div>

      </div>
    </div>
  );
};
