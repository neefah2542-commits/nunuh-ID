import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Calendar, 
  Phone, 
  Truck, 
  User, 
  Scissors, 
  FileText, 
  Send, 
  ChevronRight, 
  Check, 
  Printer,
  Sparkles,
  MapPin,
  Flame,
  Layers,
  Trash2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { OrderItem, StatusHistoryEntry } from '../types';
import { STAGES } from '../data/constants';
import { calculateDaysBetween, checkStageSlaStatus, formatDurationThai, formatThaiDate } from '../utils/dateUtils';
import { MembershipBadge } from './MembershipCardTypeSelector';

interface OrderDetailModalProps {
  order: OrderItem;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStage: (
    orderId: string, 
    newStageId: number, 
    notes?: string, 
    updatedBy?: string, 
    emsNumber?: string
  ) => void;
  onEditOrder: (order: OrderItem) => void;
  onRequestDelete?: (order: OrderItem) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onUpdateStage,
  onEditOrder,
  onRequestDelete,
}) => {
  if (!isOpen) return null;

  const currentStageDef = STAGES.find(s => s.id === order.currentStageId) || STAGES[0];
  const nextStageDef = STAGES.find(s => s.id === order.currentStageId + 1);

  // Form states for status update
  const [targetStageId, setTargetStageId] = useState<number>(
    order.currentStageId < 22 ? order.currentStageId + 1 : 22
  );
  const [updatedBy, setUpdatedBy] = useState<string>('เจ้าหน้าที่สาขา ' + order.branch);
  const [notes, setNotes] = useState<string>('');
  const [emsInput, setEmsInput] = useState<string>(order.emsNumber || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const daysInCurrentStage = calculateDaysBetween(order.stageEnteredAt);
  const { isOverdue, slaDays } = checkStageSlaStatus(order.currentStageId, daysInCurrentStage);
  const totalCycleDays = calculateDaysBetween(
    order.orderDate,
    order.currentStageId === 22 ? order.updatedAt : undefined
  );

  const handleAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (targetStageId === 22) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // Safe fallback
      }
    }

    onUpdateStage(
      order.id,
      targetStageId,
      notes,
      updatedBy,
      emsInput.trim() || undefined
    );

    setIsSubmitting(false);
    setNotes('');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-xs font-bold rounded bg-indigo-500/30 text-indigo-300 border border-indigo-400/40">
                  {order.jobType}
                </span>
                <h2 className="text-lg font-bold text-white">
                  {order.jobCode}
                </h2>
                {order.isUrgent && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500 text-white flex items-center gap-1">
                    <Flame className="w-3 h-3" /> งานด่วน
                  </span>
                )}
                {order.customerType && (
                  <MembershipBadge type={order.customerType} size="sm" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300 mt-0.5 flex-wrap">
                <span>สาขา{order.branch} • ลูกค้า: <strong>{order.customerName}</strong> ({order.customerPhone})</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRequestDelete && (
              <button
                onClick={() => onRequestDelete(order)}
                className="p-2 text-rose-300 hover:text-white hover:bg-rose-600/80 rounded-lg transition-colors print:hidden"
                title="ลบออร์เดอร์นี้"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={handlePrint}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors print:hidden"
              title="พิมพ์ใบติดตามสถานะงาน"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* Top Status & Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium block">สถานะปัจจุบัน</span>
              <div className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">
                ขั้นที่ {order.currentStageId}/22
              </div>
              <span className="text-xs font-semibold text-indigo-600 block truncate">
                {order.currentStageName}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium block">เวลาในสถานะปัจจุบัน</span>
              <div className={`text-base font-bold mt-1 ${isOverdue ? 'text-amber-700' : 'text-slate-900'}`}>
                {formatDurationThai(daysInCurrentStage)}
              </div>
              <span className="text-[11px] text-slate-500 block">
                เกณฑ์มาตรฐาน: {slaDays} วัน
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium block">เวลารวมทั้งหมด (Cycle Time)</span>
              <div className="text-base font-bold text-slate-900 mt-1">
                {formatDurationThai(totalCycleDays)}
              </div>
              <span className="text-[11px] text-slate-500 block">
                เริ่มสั่งเมื่อ: {formatThaiDate(order.orderDate)}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium block">วันนัดฟิตติ้ง / วันงาน</span>
              <div className="text-sm font-bold text-slate-900 mt-1">
                {order.eventDateTarget ? formatThaiDate(order.eventDateTarget) : 'ไม่ได้ระบุ'}
              </div>
              <span className="text-[11px] text-slate-500 block">
                ฟิตติ้ง: {order.fittingDateTarget ? formatThaiDate(order.fittingDateTarget) : '-'}
              </span>
            </div>
          </div>

          {/* Quick Stage Stepper (22-Stage Progress) */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  แผนภาพ 22 ขั้นตอนการผลิตและส่งมอบ
                </h3>
              </div>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                ความคืบหน้า {Math.round((order.currentStageId / 22) * 100)}%
              </span>
            </div>

            {/* Stepper bubbles with horizontal scroll */}
            <div className="overflow-x-auto pb-2 scrollbar-thin">
              <div className="flex items-center gap-1.5 min-w-[750px]">
                {STAGES.map((st) => {
                  const isCurrent = st.id === order.currentStageId;
                  const isPassed = st.id < order.currentStageId;

                  return (
                    <button
                      key={st.id}
                      onClick={() => setTargetStageId(st.id)}
                      className={`flex flex-col items-center p-1.5 rounded-lg text-center transition-all cursor-pointer flex-1 min-w-[34px] ${
                        isCurrent 
                          ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300' 
                          : isPassed 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100' 
                          : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-100'
                      }`}
                      title={`${st.id}. ${st.name}`}
                    >
                      <span className={`text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                        isCurrent ? 'bg-white text-indigo-700' : isPassed ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isPassed ? <Check className="w-3 h-3 stroke-[3]" /> : st.id}
                      </span>
                      <span className="text-[9px] font-semibold mt-1 truncate max-w-[40px]">
                        {st.id}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Update Stage Form */}
          <div className="bg-indigo-50/50 rounded-xl p-4 sm:p-5 border border-indigo-100">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-600" />
              <span>อัปเดตและเปลี่ยนสถานะงาน (บันทึกเวลาอัตโนมัติ)</span>
            </h3>

            <form onSubmit={handleAdvance} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Choose Stage */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เปลี่ยนสู่สถานะ:
                  </label>
                  <select
                    value={targetStageId}
                    onChange={(e) => setTargetStageId(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {STAGES.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.id}. {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Updated By */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ผู้บันทึก / แผนก / สาขา:
                  </label>
                  <input
                    type="text"
                    value={updatedBy}
                    onChange={(e) => setUpdatedBy(e.target.value)}
                    placeholder="เช่น ช่างเย็บ ทีม A, แอดมินสาขาหาดใหญ่, DC"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              {/* EMS tracking input (if relevant stage) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    เลขพัสดุ EMS / ขนส่ง (ถ้ามี):
                  </label>
                  <input
                    type="text"
                    value={emsInput}
                    onChange={(e) => setEmsInput(e.target.value)}
                    placeholder="เช่น EW123456789TH หรือ Kerry/Flash"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    บันทึกหมายเหตุเพิ่มเติม / รายละเอียดการลองชุดหรือแก้ไข:
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="เช่น ลูกค้าขอเก็บสะโพก 0.5 นิ้ว, โทรนัดวันเสาร์นี้"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-all flex items-center gap-1.5 shadow-sm shadow-indigo-200"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>บันทึกการเปลี่ยนสถานะ</span>
                </button>
              </div>
            </form>
          </div>

          {/* Detailed Stage Duration History Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>ประวัติระยะเวลาที่ใช้ในแต่ละสถานะ (Duration Breakdown)</span>
              </h3>
              <span className="text-xs text-slate-500">
                บันทึกแล้ว {order.history.length} ขั้นตอน
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">ขั้นตอน</th>
                    <th className="py-2.5 px-3">วันที่เริ่ม</th>
                    <th className="py-2.5 px-3">วันที่เสร็จสิ้น</th>
                    <th className="py-2.5 px-3">ระยะเวลาที่ใช้</th>
                    <th className="py-2.5 px-3">ผู้บันทึก & หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.history.map((hist, index) => {
                    const isCurrent = hist.completedAt === undefined;
                    const days = hist.daysSpent !== undefined 
                      ? hist.daysSpent 
                      : calculateDaysBetween(hist.enteredAt);

                    return (
                      <tr key={index} className={isCurrent ? 'bg-indigo-50/40 font-semibold' : 'hover:bg-slate-50'}>
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900">
                            {hist.stageId}. {hist.stageName}
                          </span>
                          {isCurrent && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-indigo-600 text-white font-bold">
                              กำลังดำเนินการ
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {formatThaiDate(hist.enteredAt, true)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          {hist.completedAt ? formatThaiDate(hist.completedAt, true) : '-'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`font-bold ${
                            isCurrent ? 'text-indigo-700' : 'text-slate-800'
                          }`}>
                            {formatDurationThai(days)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">
                          <div>
                            <span className="font-medium text-slate-800">{hist.updatedBy}</span>
                            {hist.emsTrackingNumber && (
                              <span className="ml-1 text-[11px] font-mono text-indigo-700 bg-indigo-50 px-1 py-0.5 rounded">
                                EMS: {hist.emsTrackingNumber}
                              </span>
                            )}
                          </div>
                          {hist.notes && (
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {hist.notes}
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Item Details and Specifications */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">
                รายละเอียดชุดสั่งตัด & ดีเทล:
              </span>
              <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                {order.itemDescription || 'ไม่มีข้อมูลเพิ่มเติม'}
              </p>

              {order.measurements && (
                <div className="mt-2">
                  <span className="text-[11px] font-bold text-slate-500 block mb-1">
                    สัดส่วนและการวัดตัว:
                  </span>
                  <p className="text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                    {order.measurements}
                  </p>
                </div>
              )}
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 block mb-1">
                ข้อมูลการเงิน & บันทึกเพิ่มเติม:
              </span>
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">ยอดรวมราคา:</span>
                  <span className="font-bold text-slate-900">
                    {order.price ? `${order.price.toLocaleString()} บาท` : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">มัดจำแล้ว:</span>
                  <span className="font-bold text-emerald-700">
                    {order.deposit ? `${order.deposit.toLocaleString()} บาท` : '-'}
                  </span>
                </div>
                {order.price && order.deposit && (
                  <div className="flex justify-between pt-1 border-t border-slate-100">
                    <span className="text-slate-500">ยอดคงเหลือชำระวันรับชุด:</span>
                    <span className="font-bold text-slate-900">
                      {(order.price - order.deposit).toLocaleString()} บาท
                    </span>
                  </div>
                )}
                {order.notes && (
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-slate-500 block text-[11px]">หมายเหตุ:</span>
                    <p className="text-slate-700 mt-0.5">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onEditOrder(order)}
              className="text-slate-600 hover:text-indigo-600 font-semibold"
            >
              แก้ไขข้อมูลออร์เดอร์ / สัดส่วน
            </button>

            {onRequestDelete && (
              <>
                <span className="text-slate-300">|</span>
                <button
                  onClick={() => onRequestDelete(order)}
                  className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ลบออร์เดอร์นี้</span>
                </button>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
