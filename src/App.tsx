import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { FilterBar } from './components/FilterBar';
import { OrderTableView } from './components/OrderTableView';
import { OrderCardView } from './components/OrderCardView';
import { OrderKanbanView } from './components/OrderKanbanView';
import { OrderTimelineView } from './components/OrderTimelineView';
import { OrderDetailModal } from './components/OrderDetailModal';
import { NewOrderModal } from './components/NewOrderModal';
import { DurationAnalyticsModal } from './components/DurationAnalyticsModal';
import { DashboardView } from './components/DashboardView';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { CustomerManagerModal } from './components/CustomerManagerModal';
import { BranchName, Customer, FilterOptions, OrderItem, ViewMode } from './types';
import { 
  loadOrdersFromStorage, 
  saveOrdersToStorage, 
  resetToSampleOrders, 
  exportOrdersToCsv,
  loadCustomersFromStorage,
  saveCustomersToStorage,
  upsertCustomer,
  deleteCustomerFromStorage
} from './utils/storage';
import { STAGES } from './data/constants';
import { calculateDaysBetween, checkStageSlaStatus } from './utils/dateUtils';
import { 
  Plus, 
  Menu, 
  BarChart3, 
  Download, 
  Building2, 
  Clock, 
  Flame, 
  AlertTriangle,
  Scissors,
  CheckCircle2,
  Users,
  UserPlus
} from 'lucide-react';

export default function App() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [isSidebarOpenMobile, setIsSidebarOpenMobile] = useState<boolean>(false);

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    branch: 'all',
    jobType: 'all',
    category: 'all',
    stageId: 'all',
    statusType: 'all',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  });

  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Modals state
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState<boolean>(false);
  const [editingOrder, setEditingOrder] = useState<OrderItem | null>(null);
  const [prefilledCustomer, setPrefilledCustomer] = useState<Customer | null>(null);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState<boolean>(false);
  const [orderToDelete, setOrderToDelete] = useState<OrderItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize and load orders & customers
  useEffect(() => {
    const loadedOrders = loadOrdersFromStorage();
    const loadedCustomers = loadCustomersFromStorage();
    setOrders(loadedOrders);
    setCustomers(loadedCustomers);
    setIsLoaded(true);
  }, []);

  // Save when orders change
  useEffect(() => {
    if (isLoaded) {
      saveOrdersToStorage(orders);
    }
  }, [orders, isLoaded]);

  // Save when customers change
  useEffect(() => {
    if (isLoaded) {
      saveCustomersToStorage(customers);
    }
  }, [customers, isLoaded]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Handle stage category logic
  const getStageCategory = (stageId: number): string => {
    if (stageId <= 7) return 'production';
    if (stageId <= 10) return 'distribution';
    if (stageId <= 12) return 'fitting';
    if (stageId <= 19) return 'alteration';
    return 'handover';
  };

  // Branch orders for KPI metrics calculation
  const branchOrders = useMemo(() => {
    if (filters.branch === 'all') return orders;
    return orders.filter(o => o.branch === filters.branch);
  }, [orders, filters.branch]);

  // Metric summaries based on selected branch
  const metrics = useMemo(() => {
    const total = branchOrders.length;
    const inProduction = branchOrders.filter(o => o.currentStageId <= 7).length;
    const inAlterationOrFitting = branchOrders.filter(o => o.currentStageId >= 11 && o.currentStageId <= 20).length;
    const readyOrDone = branchOrders.filter(o => o.currentStageId >= 21).length;
    const overdue = branchOrders.filter(o => {
      if (o.currentStageId === 22) return false;
      const days = calculateDaysBetween(o.stageEnteredAt);
      return checkStageSlaStatus(o.currentStageId, days).isOverdue;
    }).length;

    return { total, inProduction, inAlterationOrFitting, readyOrDone, overdue };
  }, [branchOrders]);

  // Filtered & Sorted orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Search filter
      if (filters.search) {
        const query = filters.search.toLowerCase().trim();
        const matchCode = order.jobCode.toLowerCase().includes(query);
        const matchCustomer = order.customerName.toLowerCase().includes(query);
        const matchPhone = order.customerPhone.includes(query);
        const matchDesc = (order.itemDescription || '').toLowerCase().includes(query);
        const matchEms = (order.emsNumber || '').toLowerCase().includes(query);
        if (!matchCode && !matchCustomer && !matchPhone && !matchDesc && !matchEms) {
          return false;
        }
      }

      // 2. Branch filter
      if (filters.branch !== 'all' && order.branch !== filters.branch) {
        return false;
      }

      // 3. Job Type filter (IDD / IDH / IDR)
      if (filters.jobType !== 'all' && order.jobType !== filters.jobType) {
        return false;
      }

      // 4. Category filter
      if (filters.category !== 'all') {
        const orderCat = getStageCategory(order.currentStageId);
        if (orderCat !== filters.category) return false;
      }

      // 5. Specific Stage filter
      if (filters.stageId !== 'all' && order.currentStageId !== filters.stageId) {
        return false;
      }

      // 6. Status Type filter
      if (filters.statusType === 'in_progress' && order.currentStageId === 22) {
        return false;
      }
      if (filters.statusType === 'completed' && order.currentStageId !== 22) {
        return false;
      }
      if (filters.statusType === 'urgent' && !order.isUrgent) {
        return false;
      }
      if (filters.statusType === 'delayed') {
        if (order.currentStageId === 22) return false;
        const days = calculateDaysBetween(order.stageEnteredAt);
        const { isOverdue } = checkStageSlaStatus(order.currentStageId, days);
        if (!isOverdue) return false;
      }

      return true;
    }).sort((a, b) => {
      // Default: Latest updated first, urgent first
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [orders, filters]);

  // Advance stage action
  const handleUpdateStage = (
    orderId: string, 
    newStageId: number, 
    notes?: string, 
    updatedBy?: string, 
    emsNumber?: string
  ) => {
    const nowIso = new Date().toISOString();
    const stageDef = STAGES.find(s => s.id === newStageId) || STAGES[0];

    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;

      // Close previous active history entry
      const daysSpentInPrev = calculateDaysBetween(order.stageEnteredAt, nowIso);
      const updatedHistory = order.history.map((h, idx) => {
        if (idx === order.history.length - 1 && !h.completedAt) {
          return {
            ...h,
            completedAt: nowIso,
            daysSpent: daysSpentInPrev,
          };
        }
        return h;
      });

      // Add new stage entry to history
      updatedHistory.push({
        stageId: newStageId,
        stageName: stageDef.name,
        enteredAt: nowIso,
        completedAt: newStageId === 22 ? nowIso : undefined,
        daysSpent: newStageId === 22 ? 0 : undefined,
        updatedBy: updatedBy || `สาขา${order.branch}`,
        notes: notes || undefined,
        emsTrackingNumber: emsNumber || order.emsNumber,
      });

      const updatedOrder: OrderItem = {
        ...order,
        currentStageId: newStageId,
        currentStageName: stageDef.name,
        stageEnteredAt: nowIso,
        emsNumber: emsNumber !== undefined ? emsNumber : order.emsNumber,
        notes: notes ? `${order.notes ? order.notes + ' | ' : ''}${notes}` : order.notes,
        history: updatedHistory,
        updatedAt: nowIso,
      };

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updatedOrder);
      }

      return updatedOrder;
    }));
  };

  // Quick next stage
  const handleQuickAdvance = (order: OrderItem) => {
    if (order.currentStageId >= 22) return;
    const nextStage = order.currentStageId + 1;
    handleUpdateStage(order.id, nextStage);
  };

  // Save new / edited order (and auto-upsert customer)
  const handleSaveOrder = (savedOrder: OrderItem, saveCustomerRecord: boolean = true) => {
    setOrders(prev => {
      const exists = prev.some(o => o.id === savedOrder.id);
      if (exists) {
        return prev.map(o => o.id === savedOrder.id ? savedOrder : o);
      }
      return [savedOrder, ...prev];
    });

    // Auto-upsert customer record if requested
    if (saveCustomerRecord && savedOrder.customerName && savedOrder.customerPhone) {
      const updatedCusts = upsertCustomer({
        name: savedOrder.customerName,
        phone: savedOrder.customerPhone,
        branch: savedOrder.branch,
        customerType: savedOrder.customerType || 'MEMBER',
        measurements: savedOrder.measurements,
        colorOrTheme: savedOrder.colorOrTheme,
        notes: savedOrder.notes,
      });
      setCustomers(updatedCusts);
    }

    if (selectedOrder && selectedOrder.id === savedOrder.id) {
      setSelectedOrder(savedOrder);
    }

    showToast(`บันทึกข้อมูลออร์เดอร์ ${savedOrder.jobCode} เรียบร้อยแล้ว`);
  };

  // Delete order
  const handleDeleteOrder = (orderId: string) => {
    const orderBeingDeleted = orders.find(o => o.id === orderId);
    setOrders(prev => prev.filter(o => o.id !== orderId));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(null);
    }
    showToast(`ลบออร์เดอร์ ${orderBeingDeleted ? orderBeingDeleted.jobCode : ''} เรียบร้อยแล้ว`);
  };

  // Customer Management actions
  const handleSaveCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const updated = upsertCustomer(customerData);
    setCustomers(updated);
    showToast(`บันทึกข้อมูลลูกค้า ${customerData.name} เรียบร้อยแล้ว`);
  };

  const handleDeleteCustomer = (customerId: string) => {
    const updated = deleteCustomerFromStorage(customerId);
    setCustomers(updated);
    showToast('ลบรายชื่อลูกค้าเรียบร้อยแล้ว');
  };

  const handleCreateOrderForCustomer = (cust: Customer) => {
    setEditingOrder(null);
    setPrefilledCustomer(cust);
    setIsNewOrderModalOpen(true);
  };

  // Reset sample data
  const handleResetData = () => {
    const samples = resetToSampleOrders();
    setOrders(samples);
    setSelectedOrder(null);
    showToast('รีเซ็ตข้อมูลตัวอย่างเรียบร้อยแล้ว');
  };

  const branchTitle = filters.branch === 'all' 
    ? 'ทุกสาขา (All 8 Branches)' 
    : `สาขา${filters.branch} (${filters.branch === 'หาดใหญ่' ? 'Hatyai' : filters.branch === 'นราธิวาส' ? 'Narathiwat' : filters.branch === 'ปัตตานี' ? 'Pattani' : filters.branch === 'ยะลา' ? 'Yala' : filters.branch === 'ดิจิตอล' ? 'Digital' : filters.branch === 'กระบี่' ? 'Krabi' : filters.branch === 'มิสทีน' ? 'Mistine' : 'The Mall'} Branch)`;

  return (
    <div className="flex h-screen w-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* Sleek Sidebar Navigation */}
      <Sidebar
        selectedBranch={filters.branch}
        onSelectBranch={(branch) => setFilters(f => ({ ...f, branch }))}
        orders={orders}
        customerCount={customers.length}
        isOpenMobile={isSidebarOpenMobile}
        onCloseMobile={() => setIsSidebarOpenMobile(false)}
        onOpenCustomerDirectory={() => setIsCustomerModalOpen(true)}
        onOpenAnalytics={() => setIsAnalyticsOpen(true)}
        onExportCsv={() => exportOrdersToCsv(filteredOrders)}
        onResetData={handleResetData}
        onSelectViewMode={setViewMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Mobile hamburger menu toggle */}
            <button
              onClick={() => setIsSidebarOpenMobile(true)}
              className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                  {branchTitle}
                </h2>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded font-bold uppercase shrink-0">
                  Online
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Customer Directory Button */}
            <button
              id="btn-header-customers"
              onClick={() => setIsCustomerModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 rounded-lg text-xs font-semibold text-indigo-700 shadow-2xs transition-colors"
              title="จัดการและเพิ่มข้อมูลลูกค้าล่วงหน้า เพื่อให้เปิดออร์เดอร์ได้ทันที"
            >
              <Users className="w-4 h-4 text-indigo-600" />
              <span className="hidden md:inline">สมุดรายชื่อลูกค้า</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-indigo-200/90 text-indigo-900 rounded-full font-bold">
                {customers.length}
              </span>
            </button>

            {/* Dashboard Quick Switch Button */}
            <button
              onClick={() => setViewMode(v => v === 'dashboard' ? 'table' : 'dashboard')}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 border rounded-md text-xs font-semibold shadow-2xs transition-colors ${
                viewMode === 'dashboard'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>{viewMode === 'dashboard' ? 'ดูตารางออร์เดอร์' : 'แดชบอร์ด IDD/IDH/IDR'}</span>
            </button>

            {/* Create Order Button */}
            <button
              id="btn-create-order"
              onClick={() => {
                setEditingOrder(null);
                setPrefilledCustomer(null);
                setIsNewOrderModalOpen(true);
              }}
              className="px-3.5 sm:px-4 py-2 bg-indigo-600 text-white rounded-md text-xs sm:text-sm font-medium shadow-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ สร้างออร์เดอร์ใหม่</span>
            </button>
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto flex flex-col space-y-5">
          
          {/* 4 Sleek KPI Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-slate-400 text-xs font-medium uppercase">ออร์เดอร์ทั้งหมด</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{metrics.total}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-amber-500 text-xs font-medium uppercase">อยู่ระหว่างผลิต (1-7)</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{metrics.inProduction}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-indigo-500 text-xs font-medium uppercase">ฟิตติ้ง & แก้ไข (Mod)</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{metrics.inAlterationOrFitting}</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-emerald-500 text-xs font-medium uppercase">พร้อมส่งมอบ / ปิดงาน (21-22)</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{metrics.readyOrDone}</p>
            </div>
          </div>

          {/* Overdue Warning Alert if any */}
          {metrics.overdue > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-rose-800">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                <span className="text-xs font-medium">
                  มี <strong>{metrics.overdue} ออร์เดอร์</strong> ที่ค้างในสถานะเกินเวลามาตรฐาน (SLA เกินกำหนด)
                </span>
              </div>
              <button
                onClick={() => setFilters(f => ({ ...f, statusType: 'delayed' }))}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shrink-0 transition-colors shadow-2xs"
              >
                ดูรายการที่ล่าช้า
              </button>
            </div>
          )}

          {/* Filter Bar & View Mode Switcher */}
          <FilterBar
            filters={filters}
            onFilterChange={setFilters}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            totalResults={filteredOrders.length}
          />

          {/* Active View Mode Container */}
          <div className="flex-1 min-h-[300px]">
            {viewMode === 'dashboard' && (
              <DashboardView
                orders={orders}
                selectedBranch={filters.branch}
                onSelectOrder={setSelectedOrder}
                onFilterByJobType={(jobType) => {
                  setFilters(f => ({ ...f, jobType }));
                  setViewMode('table');
                }}
                onFilterByBranch={(branch) => {
                  setFilters(f => ({ ...f, branch }));
                }}
              />
            )}

            {viewMode === 'table' && (
              <OrderTableView
                orders={filteredOrders}
                onSelectOrder={setSelectedOrder}
                onQuickAdvance={handleQuickAdvance}
                onEditOrder={(order) => {
                  setEditingOrder(order);
                  setPrefilledCustomer(null);
                  setIsNewOrderModalOpen(true);
                }}
                onDeleteOrder={(order) => setOrderToDelete(order)}
              />
            )}

            {viewMode === 'cards' && (
              <OrderCardView
                orders={filteredOrders}
                onSelectOrder={setSelectedOrder}
                onQuickAdvance={handleQuickAdvance}
                onDeleteOrder={(order) => setOrderToDelete(order)}
              />
            )}

            {viewMode === 'kanban' && (
              <OrderKanbanView
                orders={filteredOrders}
                onSelectOrder={setSelectedOrder}
                onQuickAdvance={handleQuickAdvance}
                onDeleteOrder={(order) => setOrderToDelete(order)}
              />
            )}

            {viewMode === 'timeline' && (
              <OrderTimelineView
                orders={filteredOrders}
                onSelectOrder={setSelectedOrder}
              />
            )}
          </div>

        </div>
      </main>

      {/* Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdateStage={handleUpdateStage}
          onEditOrder={(order) => {
            setEditingOrder(order);
            setPrefilledCustomer(null);
            setIsNewOrderModalOpen(true);
          }}
          onRequestDelete={(order) => setOrderToDelete(order)}
        />
      )}

      {/* New / Edit Order Modal */}
      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => {
          setIsNewOrderModalOpen(false);
          setEditingOrder(null);
          setPrefilledCustomer(null);
        }}
        onSaveOrder={handleSaveOrder}
        editingOrder={editingOrder}
        customers={customers}
        prefilledCustomer={prefilledCustomer}
        onOpenCustomerDirectory={() => setIsCustomerModalOpen(true)}
      />

      {/* Customer Directory Modal */}
      <CustomerManagerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customers={customers}
        orders={orders}
        onSaveCustomer={handleSaveCustomer}
        onDeleteCustomer={handleDeleteCustomer}
        onCreateOrderForCustomer={handleCreateOrderForCustomer}
      />

      {/* Analytics Modal */}
      <DurationAnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        orders={orders}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        order={orderToDelete}
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={handleDeleteOrder}
      />

      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-70 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
