import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Search, 
  Plus, 
  Phone, 
  MapPin, 
  Scissors, 
  Edit, 
  Trash2, 
  Calendar, 
  Sparkles, 
  CheckCircle2,
  UserCheck,
  ChevronRight,
  CreditCard
} from 'lucide-react';
import { BranchName, Customer, MembershipType, OrderItem } from '../types';
import { BRANCHES, MEMBERSHIP_TYPES } from '../data/constants';
import { MembershipCardTypeSelector, MembershipBadge } from './MembershipCardTypeSelector';

interface CustomerManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  orders: OrderItem[];
  onSaveCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  onDeleteCustomer: (customerId: string) => void;
  onCreateOrderForCustomer: (customer: Customer) => void;
}

export const CustomerManagerModal: React.FC<CustomerManagerModalProps> = ({
  isOpen,
  onClose,
  customers,
  orders,
  onSaveCustomer,
  onDeleteCustomer,
  onCreateOrderForCustomer,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<BranchName | 'all'>('all');
  const [selectedType, setSelectedType] = useState<MembershipType | 'all'>('all');
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form state
  const [formName, setFormName] = useState<string>('');
  const [formPhone, setFormPhone] = useState<string>('');
  const [formBranch, setFormBranch] = useState<BranchName>('หาดใหญ่');
  const [formCustomerType, setFormCustomerType] = useState<MembershipType>('MEMBER');
  const [formMeasurements, setFormMeasurements] = useState<string>('');
  const [formColorOrTheme, setFormColorOrTheme] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormName('');
    setFormPhone('');
    setFormBranch('หาดใหญ่');
    setFormCustomerType('MEMBER');
    setFormMeasurements('');
    setFormColorOrTheme('');
    setFormNotes('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (cust: Customer) => {
    setEditingCustomer(cust);
    setFormName(cust.name);
    setFormPhone(cust.phone);
    setFormBranch(cust.branch);
    setFormCustomerType(cust.customerType || 'MEMBER');
    setFormMeasurements(cust.measurements || '');
    setFormColorOrTheme(cust.colorOrTheme || '');
    setFormNotes(cust.notes || '');
    setIsFormOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhone.trim()) return;

    onSaveCustomer({
      id: editingCustomer?.id,
      name: formName.trim(),
      phone: formPhone.trim(),
      branch: formBranch,
      customerType: formCustomerType,
      measurements: formMeasurements.trim() || undefined,
      colorOrTheme: formColorOrTheme.trim() || undefined,
      notes: formNotes.trim() || undefined,
    });

    setIsFormOpen(false);
  };

  // Filter customers
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.customerType && c.customerType.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.measurements && c.measurements.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesBranch = selectedBranch === 'all' || c.branch === selectedBranch;
    const matchesType = selectedType === 'all' || (c.customerType || 'MEMBER') === selectedType;
    return matchesSearch && matchesBranch && matchesType;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">สมุดรายชื่อลูกค้า (Customer Directory)</h2>
                <span className="px-2 py-0.5 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-full text-xs font-semibold">
                  {customers.length} ท่าน
                </span>
              </div>
              <p className="text-xs text-slate-300">
                บันทึกประวัติ ประเภทบัตรสมาชิก สัดส่วนการวัดตัว และเปิดออร์เดอร์ได้ทันที
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#b80053] hover:bg-[#a00048] text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>เพิ่มลูกค้าใหม่</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Main List Section */}
          <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-hidden border-r border-slate-100">
            
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 mb-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อลูกค้า, เบอร์โทรศัพท์, สัดส่วน..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value as BranchName | 'all')}
                className="w-full sm:w-auto px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"
              >
                <option value="all">ทุกสาขา (8 สาขา)</option>
                {BRANCHES.map(b => (
                  <option key={b.name} value={b.name}>สาขา{b.name}</option>
                ))}
              </select>
            </div>

            {/* Membership Type Filter Pills */}
            <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-bold text-slate-500 mr-1 shrink-0 flex items-center gap-1">
                <CreditCard className="w-3 h-3 text-pink-600" />
                <span>บัตรสมาชิก:</span>
              </span>
              <button
                onClick={() => setSelectedType('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs shrink-0 transition-colors ${
                  selectedType === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                ทั้งหมด ({customers.length})
              </button>
              {MEMBERSHIP_TYPES.map(m => {
                const count = customers.filter(c => (c.customerType || 'MEMBER') === m.id).length;
                const isSelected = selectedType === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedType(m.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs shrink-0 border transition-all ${
                      isSelected
                        ? 'bg-[#b80053] text-white border-[#b80053] shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-pink-300 hover:bg-pink-50/40'
                    }`}
                  >
                    {m.name} <span className="opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Customer Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredCustomers.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-600">ไม่พบรายชื่อลูกค้าที่ค้นหา</p>
                  <p className="text-xs text-slate-400 mt-1">สามารถกดปุ่ม "เพิ่มลูกค้าใหม่" เพื่อบันทึกข้อมูลล่วงหน้าได้ค่ะ</p>
                  <button
                    onClick={handleOpenAdd}
                    className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#b80053] text-white text-xs font-semibold rounded-lg hover:bg-[#a00048]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มลูกค้าทันที</span>
                  </button>
                </div>
              ) : (
                filteredCustomers.map(cust => {
                  const customerOrders = orders.filter(
                    o => o.customerPhone === cust.phone || o.customerName === cust.name
                  );

                  return (
                    <div
                      key={cust.id}
                      className="bg-white border border-slate-200 hover:border-pink-300 rounded-xl p-3.5 transition-all shadow-2xs hover:shadow-sm group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900">{cust.name}</span>
                            
                            {/* Membership badge */}
                            <MembershipBadge type={cust.customerType || 'MEMBER'} size="sm" />

                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              สาขา{cust.branch}
                            </span>
                            {customerOrders.length > 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {customerOrders.length} ออร์เดอร์
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600">
                            <div className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span className="font-mono">{cust.phone}</span>
                            </div>
                            {cust.colorOrTheme && (
                              <div className="flex items-center gap-1 text-slate-500">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                <span>ธีม: {cust.colorOrTheme}</span>
                              </div>
                            )}
                          </div>

                          {cust.measurements && (
                            <div className="mt-2 text-xs bg-slate-50 border border-slate-100 rounded-lg px-2.5 py-1 text-slate-700">
                              <span className="text-slate-400 font-medium">สัดส่วน: </span>
                              <span className="font-medium text-slate-800">{cust.measurements}</span>
                            </div>
                          )}

                          {cust.notes && (
                            <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-1 italic">
                              หมายเหตุ: {cust.notes}
                            </p>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => {
                              onCreateOrderForCustomer(cust);
                              onClose();
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-2xs transition-transform active:scale-95"
                            title="สร้างรหัสออร์เดอร์ใหม่ให้ลูกค้ารายนี้ทันที"
                          >
                            <Scissors className="w-3.5 h-3.5" />
                            <span>ทำออร์เดอร์</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(cust)}
                              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="แก้ไขข้อมูลลูกค้า"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`คุณต้องการลบข้อมูลลูกค้า ${cust.name} ออกจากสมุดรายชื่อหรือไม่?`)) {
                                  onDeleteCustomer(cust.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                              title="ลบรายชื่อนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Add / Edit Form Sidebar (Modal inside on desktop/tablet) */}
          {isFormOpen && (
            <div className="w-full md:w-96 bg-slate-50 p-5 border-t md:border-t-0 md:border-l border-slate-200 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#b80053]" />
                  <h3 className="text-xs font-bold text-slate-900">
                    {editingCustomer ? 'แก้ไขข้อมูลลูกค้า' : 'เพิ่มลูกค้าใหม่เข้าระบบ'}
                  </h3>
                </div>
                <button
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    ชื่อ-นามสกุล ลูกค้า: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น คุณนภัสสร รัตนโชติ"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    เบอร์โทรศัพท์ติดต่อ: *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="เช่น 081-234-5678"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 font-mono"
                  />
                </div>

                {/* ประเภทบัตรสมาชิก (Membership Card Type) */}
                <div className="bg-pink-50/40 p-2.5 rounded-xl border border-pink-100">
                  <MembershipCardTypeSelector
                    value={formCustomerType}
                    onChange={setFormCustomerType}
                    label="ประเภทบัตรสมาชิก (Membership Card Type)"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    สาขาประจำ:
                  </label>
                  <select
                    value={formBranch}
                    onChange={(e) => setFormBranch(e.target.value as BranchName)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    {BRANCHES.map(b => (
                      <option key={b.name} value={b.name}>สาขา{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    สัดส่วนการวัดตัว (อก/เอว/สะโพก/ยาว):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="เช่น อก 34 เอว 26 สะโพก 37 ยาว 58"
                    value={formMeasurements}
                    onChange={(e) => setFormMeasurements(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    โทนสีที่ชอบ / ธีมงาน:
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น White / Champagne Gold"
                    value={formColorOrTheme}
                    onChange={(e) => setFormColorOrTheme(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    หมายเหตุเพิ่มเติม:
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ลูกค้า VIP, ชอบผ้าคลุมยาว"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#b80053] hover:bg-[#a00048] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
                  >
                    {editingCustomer ? 'บันทึกแก้ไข' : 'บันทึกลูกค้า'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>💡 เคล็ดลับ: เมื่อคลิก <strong>"ทำออร์เดอร์"</strong> ระบบจะดึงชื่อ ประเภทสมาชิก สัดส่วน และสาขาไปกรอกให้อัตโนมัติทันที</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
