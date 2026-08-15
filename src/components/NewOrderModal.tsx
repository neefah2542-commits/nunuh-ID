import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Plus, 
  Scissors, 
  Calendar, 
  User, 
  Phone, 
  MapPin, 
  DollarSign, 
  Flame, 
  CheckCircle2,
  FileText,
  Search,
  Sparkles,
  Users,
  Check,
  RotateCcw
} from 'lucide-react';
import { BranchName, Customer, JobType, MembershipType, OrderItem } from '../types';
import { BRANCHES, JOB_TYPES, STAGES } from '../data/constants';
import { MembershipCardTypeSelector, MembershipBadge } from './MembershipCardTypeSelector';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveOrder: (newOrder: OrderItem, saveCustomerRecord?: boolean) => void;
  editingOrder?: OrderItem | null;
  customers?: Customer[];
  prefilledCustomer?: Customer | null;
  onOpenCustomerDirectory?: () => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({
  isOpen,
  onClose,
  onSaveOrder,
  editingOrder,
  customers = [],
  prefilledCustomer,
  onOpenCustomerDirectory,
}) => {
  if (!isOpen) return null;

  const [jobType, setJobType] = useState<JobType>('IDD');
  const [jobCode, setJobCode] = useState<string>('');
  const [branch, setBranch] = useState<BranchName>('หาดใหญ่');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerType, setCustomerType] = useState<MembershipType>('MEMBER');
  const [itemDescription, setItemDescription] = useState<string>('');
  const [measurements, setMeasurements] = useState<string>('');
  const [colorOrTheme, setColorOrTheme] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [deposit, setDeposit] = useState<string>('');
  const [fittingDateTarget, setFittingDateTarget] = useState<string>('');
  const [eventDateTarget, setEventDateTarget] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState<boolean>(false);
  const [initialStageId, setInitialStageId] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [saveToCustomerDirectory, setSaveToCustomerDirectory] = useState<boolean>(true);

  // Quick Customer Search & Dropdown State
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Auto generate job code or fill editing order / prefilled customer
  useEffect(() => {
    if (editingOrder) {
      setJobType(editingOrder.jobType);
      setJobCode(editingOrder.jobCode);
      setBranch(editingOrder.branch);
      setCustomerName(editingOrder.customerName);
      setCustomerPhone(editingOrder.customerPhone);
      setCustomerType(editingOrder.customerType || 'MEMBER');
      setItemDescription(editingOrder.itemDescription);
      setMeasurements(editingOrder.measurements || '');
      setColorOrTheme(editingOrder.colorOrTheme || '');
      setPrice(editingOrder.price ? editingOrder.price.toString() : '');
      setDeposit(editingOrder.deposit ? editingOrder.deposit.toString() : '');
      setFittingDateTarget(editingOrder.fittingDateTarget || '');
      setEventDateTarget(editingOrder.eventDateTarget || '');
      setIsUrgent(!!editingOrder.isUrgent);
      setInitialStageId(editingOrder.currentStageId);
      setNotes(editingOrder.notes || '');
    } else if (prefilledCustomer) {
      const date = new Date();
      const yr = (date.getFullYear() % 100).toString().padStart(2, '0');
      const mo = (date.getMonth() + 1).toString().padStart(2, '0');
      const randomNum = Math.floor(100 + Math.random() * 900);
      setJobCode(`${jobType}-${yr}${mo}-${randomNum}`);

      setCustomerName(prefilledCustomer.name);
      setCustomerPhone(prefilledCustomer.phone);
      setBranch(prefilledCustomer.branch);
      setCustomerType(prefilledCustomer.customerType || 'MEMBER');
      setMeasurements(prefilledCustomer.measurements || '');
      setColorOrTheme(prefilledCustomer.colorOrTheme || '');
      setNotes(prefilledCustomer.notes || '');
    } else {
      const date = new Date();
      const yr = (date.getFullYear() % 100).toString().padStart(2, '0');
      const mo = (date.getMonth() + 1).toString().padStart(2, '0');
      const randomNum = Math.floor(100 + Math.random() * 900);
      setJobCode(`${jobType}-${yr}${mo}-${randomNum}`);
      setCustomerType('MEMBER');
    }
  }, [editingOrder, prefilledCustomer]);

  const handleJobTypeChange = (newType: JobType) => {
    setJobType(newType);
    if (!editingOrder) {
      const date = new Date();
      const yr = (date.getFullYear() % 100).toString().padStart(2, '0');
      const mo = (date.getMonth() + 1).toString().padStart(2, '0');
      const randomNum = Math.floor(100 + Math.random() * 900);
      setJobCode(`${newType}-${yr}${mo}-${randomNum}`);
    } else {
      const parts = jobCode.split('-');
      if (parts.length > 1 && ['IDD', 'IDH', 'IDR'].includes(parts[0])) {
        parts[0] = newType;
        setJobCode(parts.join('-'));
      } else {
        setJobCode(`${newType}-${jobCode}`);
      }
    }
  };

  // Click outside to close customer dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCustomer = (cust: Customer) => {
    setCustomerName(cust.name);
    setCustomerPhone(cust.phone);
    setBranch(cust.branch);
    setCustomerType(cust.customerType || 'MEMBER');
    if (cust.measurements) setMeasurements(cust.measurements);
    if (cust.colorOrTheme) setColorOrTheme(cust.colorOrTheme);
    if (cust.notes) setNotes(cust.notes);
    setIsCustomerDropdownOpen(false);
    setCustomerSearchQuery('');
  };

  // Filter suggested customers based on search query or customerName input
  const query = customerSearchQuery.trim().toLowerCase();
  const suggestedCustomers = customers.filter(c => {
    if (!query) return true;
    return (
      c.name.toLowerCase().includes(query) ||
      c.phone.includes(query) ||
      (c.customerType && c.customerType.toLowerCase().includes(query)) ||
      (c.measurements && c.measurements.toLowerCase().includes(query))
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nowIso = new Date().toISOString();
    const stageDef = STAGES.find(s => s.id === initialStageId) || STAGES[0];

    const orderToSave: OrderItem = {
      id: editingOrder ? editingOrder.id : `ord-${Date.now()}`,
      jobCode: jobCode.trim(),
      jobType,
      branch,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerType,
      itemDescription: itemDescription.trim(),
      measurements: editingOrder ? editingOrder.measurements : undefined,
      colorOrTheme: editingOrder ? editingOrder.colorOrTheme : undefined,
      price: editingOrder?.price,
      deposit: editingOrder?.deposit,
      orderDate: editingOrder ? editingOrder.orderDate : nowIso,
      fittingDateTarget: fittingDateTarget || undefined,
      eventDateTarget: eventDateTarget || undefined,
      currentStageId: initialStageId,
      currentStageName: stageDef.name,
      stageEnteredAt: editingOrder ? editingOrder.stageEnteredAt : nowIso,
      isUrgent,
      notes: notes.trim() || undefined,
      history: editingOrder 
        ? editingOrder.history 
        : [
            {
              stageId: initialStageId,
              stageName: stageDef.name,
              enteredAt: nowIso,
              updatedBy: `สาขา${branch}`,
              notes: 'บันทึกเปิดออร์เดอร์ใหม่เข้าระบบ',
            }
          ],
      createdAt: editingOrder ? editingOrder.createdAt : nowIso,
      updatedAt: nowIso,
    };

    onSaveOrder(orderToSave, saveToCustomerDirectory);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {editingOrder ? 'แก้ไขข้อมูลออร์เดอร์' : 'เปิดออร์เดอร์งานสั่งตัดใหม่'}
              </h2>
              <p className="text-xs text-slate-300">
                ระบบจัดการ 8 สาขา • รหัส IDD / IDH / IDR
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          
          {/* Quick Customer Auto-fill bar (เลือกลูกค้าทันที) */}
          {!editingOrder && (
            <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-xl p-3 relative" ref={dropdownRef}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>⚡ ดึงข้อมูลลูกค้าทันที (ไม่ต้องพิมพ์ซ้ำ):</span>
                </div>
                {onOpenCustomerDirectory && (
                  <button
                    type="button"
                    onClick={onOpenCustomerDirectory}
                    className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 underline flex items-center gap-1"
                  >
                    <Users className="w-3 h-3" />
                    <span>เปิดสมุดรายชื่อ ({customers.length})</span>
                  </button>
                )}
              </div>

              <div className="relative">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 absolute left-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="พิมพ์ชื่อ หรือ เบอร์โทร เพื่อเลือกลูกค้าเดิมที่มีในระบบ..."
                    value={customerSearchQuery}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    onChange={(e) => {
                      setCustomerSearchQuery(e.target.value);
                      setIsCustomerDropdownOpen(true);
                    }}
                    className="w-full pl-9 pr-20 py-2 text-xs bg-white border border-indigo-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs font-medium text-slate-800 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomerDropdownOpen(prev => !prev)}
                    className="absolute right-1.5 px-2.5 py-1 text-[11px] font-semibold bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-2xs"
                  >
                    {isCustomerDropdownOpen ? 'ปิด' : 'ค้นหา'}
                  </button>
                </div>

                {/* Dropdown Menu */}
                {isCustomerDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl shadow-xl border border-slate-200 max-h-56 overflow-y-auto z-30 p-1.5 divide-y divide-slate-100">
                    {suggestedCustomers.length === 0 ? (
                      <div className="py-3 px-3 text-center text-xs text-slate-500">
                        ไม่พบรายชื่อลูกค้านี้ • สามารถพิมพ์ชื่อด้านล่างเพื่อบันทึกเป็นลูกค้าใหม่ได้ทันที
                      </div>
                    ) : (
                      suggestedCustomers.map(c => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          className="p-2.5 hover:bg-indigo-50/70 rounded-lg cursor-pointer transition-colors flex items-center justify-between group"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-700">
                                {c.name}
                              </span>
                              <MembershipBadge type={c.customerType || 'MEMBER'} size="sm" />
                              <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                สาขา{c.branch}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                              <span className="font-mono">{c.phone}</span>
                              {c.measurements && (
                                <span className="truncate max-w-[200px]">📏 {c.measurements}</span>
                              )}
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-indigo-600 px-2 py-1 bg-indigo-50 rounded group-hover:bg-indigo-600 group-hover:text-white shrink-0 transition-colors">
                            เลือกใช้
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Job Type Selector (IDD / IDH / IDR) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ประเภทงาน (Job Type):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {JOB_TYPES.map(jt => (
                <button
                  type="button"
                  key={jt.type}
                  onClick={() => handleJobTypeChange(jt.type)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    jobType === jt.type
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs ring-2 ring-indigo-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-xs">{jt.type}</div>
                  <div className={`text-[10px] mt-0.5 truncate ${jobType === jt.type ? 'text-indigo-100' : 'text-slate-500'}`}>
                    {jt.type === 'IDD' ? 'ชุดดีไซน์ใหม่' : jt.type === 'IDH' ? 'ฮิญาบ' : 'เช่าตัด/แก้ไซส์'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Job Code & Branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                รหัสงาน (Job Code):
              </label>
              <input
                type="text"
                value={jobCode}
                onChange={(e) => setJobCode(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                สาขา (เลือกจาก 8 สาขา):
              </label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value as BranchName)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
              >
                {BRANCHES.map(b => (
                  <option key={b.name} value={b.name}>
                    สาขา{b.name} ({b.address})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Info Section with Membership Type */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#b80053]" />
                <span>ข้อมูลลูกค้าและบัตรสมาชิก</span>
              </span>
              <MembershipBadge type={customerType} size="sm" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  ชื่อ-นามสกุล ลูกค้า: *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="เช่น คุณนภัสสร รัตนโชติ"
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  เบอร์โทรศัพท์ติดต่อ: *
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="เช่น 081-234-5678"
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono"
                />
              </div>
            </div>

            {/* Membership Type Selector */}
            <div className="pt-1">
              <MembershipCardTypeSelector
                value={customerType}
                onChange={setCustomerType}
                label="ประเภทบัตรสมาชิก (Membership Card Type):"
              />
            </div>
          </div>

          {/* Item Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              รายละเอียดชุด / สเปกผ้า / แบบสั่งทำ: *
            </label>
            <textarea
              rows={2}
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              placeholder="เช่น ชุดราตรียาวผ้าดัชเชสซาติน สีไอวอรี่ ปักคริสตัลช่วงบ่าและเอว..."
              required
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>



          {/* Dates: Target Fitting 1 & Target Event Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                วันนัดลองชุดครั้งที่ 1 (Fitting Day 1):
              </label>
              <input
                type="date"
                value={fittingDateTarget}
                onChange={(e) => setFittingDateTarget(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                วันงานจริง / กำหนดรับชุดเสร็จสมบูรณ์:
              </label>
              <input
                type="date"
                value={eventDateTarget}
                onChange={(e) => setEventDateTarget(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Initial Stage selection & Urgent checkbox */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                เริ่มต้นที่สถานะ:
              </label>
              <select
                value={initialStageId}
                onChange={(e) => setInitialStageId(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {STAGES.map(s => (
                  <option key={s.id} value={s.id}>
                    ขั้นที่ {s.id}: {s.name} ({s.categoryName})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
                />
                <div className="flex items-center gap-1 text-xs font-bold text-rose-600">
                  <Flame className="w-4 h-4 fill-rose-500 text-rose-500" />
                  <span>งานด่วนพิเศษ (Urgent Priority)</span>
                </div>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              หมายเหตุเพิ่มเติม:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น ลูกค้าสะดวกติดต่อช่วงเย็น, ต้องการผ้าคลุมเพิ่ม 1 ชิ้น..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Auto-save to customer directory checkbox */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={saveToCustomerDirectory}
                onChange={(e) => setSaveToCustomerDirectory(e.target.checked)}
                className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
              <span>บันทึกชื่อและสัดส่วนนี้ลงใน <strong>สมุดรายชื่อลูกค้า</strong> สำหรับใช้งานในครั้งต่อไป</span>
            </label>
          </div>

        </form>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-indigo-200 transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{editingOrder ? 'บันทึกการแก้ไข' : 'บันทึกเปิดออร์เดอร์'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
