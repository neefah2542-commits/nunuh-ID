import { Customer, OrderItem } from '../types';
import { INITIAL_SAMPLE_ORDERS, STAGES } from '../data/constants';
import { calculateDaysBetween, formatThaiDate } from './dateUtils';

const STORAGE_KEY = 'idd_idh_idr_orders_data_v1';
const CUSTOMER_STORAGE_KEY = 'idd_idh_idr_customers_data_v1';

// Initial default customers extracted from sample orders
export const INITIAL_SAMPLE_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'คุณนภัสสร รัตนโชติ',
    phone: '081-234-5678',
    branch: 'หาดใหญ่',
    customerType: 'PRIME',
    measurements: 'อก 33 เอว 25 สะโพก 36 สูง 165',
    colorOrTheme: 'White / Ivory',
    notes: 'ชอบงานปักเรียบหรู ลูกไม้นำเข้า',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cust-2',
    name: 'คุณฟาติมา มานะ',
    phone: '089-876-5432',
    branch: 'ปัตตานี',
    customerType: 'MEMBER',
    measurements: 'อก 35 เอว 27 สะโพก 38 สูง 160',
    colorOrTheme: 'Emerald Green / Gold',
    notes: 'ฮิญาบผ้าคลุม 3 เมตร ปักคริสตัลระยับ',
    createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cust-3',
    name: 'คุณอารียา ดาโอ๊ะ',
    phone: '086-555-1234',
    branch: 'ยะลา',
    customerType: 'PRIVILEGE',
    measurements: 'อก 32 เอว 24 สะโพก 35 สูง 158',
    colorOrTheme: 'Champagne Gold',
    notes: 'งานเช่าตัดปรับแก้เอวเข้า 1 นิ้ว',
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cust-4',
    name: 'คุณซูไรดา แวสาเมาะ',
    phone: '084-999-7788',
    branch: 'นราธิวาส',
    customerType: 'TRADER',
    measurements: 'อก 36 เอว 28 สะโพก 39 สูง 163',
    colorOrTheme: 'Royal Blue / Silver',
    notes: 'ชุดดีไซน์พิเศษสำหรับงานมงคลสมรส',
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'cust-5',
    name: 'คุณศศิธร ศรีสุนทร',
    phone: '082-111-4455',
    branch: 'กระบี่',
    customerType: 'MEMBER',
    measurements: 'อก 34 เอว 26 สะโพก 36.5 สูง 167',
    colorOrTheme: 'Dusty Pink / Rose Gold',
    notes: 'ชุดราตรียาวผ้าชีฟองไหมพรีเมียม',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function loadCustomersFromStorage(): Customer[] {
  try {
    const saved = localStorage.getItem(CUSTOMER_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to load customers from storage', error);
  }
  
  saveCustomersToStorage(INITIAL_SAMPLE_CUSTOMERS);
  return INITIAL_SAMPLE_CUSTOMERS;
}

export function saveCustomersToStorage(customers: Customer[]): void {
  try {
    localStorage.setItem(CUSTOMER_STORAGE_KEY, JSON.stringify(customers));
  } catch (error) {
    console.error('Failed to save customers to storage', error);
  }
}

export function upsertCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Customer[] {
  const customers = loadCustomersFromStorage();
  const nowIso = new Date().toISOString();
  
  // Find existing by ID or by Phone/Name match
  const existingIndex = customers.findIndex(c => 
    (customerData.id && c.id === customerData.id) || 
    (c.phone && customerData.phone && c.phone.trim() === customerData.phone.trim()) ||
    (c.name.trim().toLowerCase() === customerData.name.trim().toLowerCase())
  );

  let updatedCustomer: Customer;

  if (existingIndex >= 0) {
    updatedCustomer = {
      ...customers[existingIndex],
      ...customerData,
      id: customers[existingIndex].id,
      updatedAt: nowIso,
    };
    customers[existingIndex] = updatedCustomer;
  } else {
    updatedCustomer = {
      id: customerData.id || `cust-${Date.now()}`,
      name: customerData.name.trim(),
      phone: customerData.phone.trim(),
      branch: customerData.branch,
      customerType: customerData.customerType || 'MEMBER',
      measurements: customerData.measurements?.trim() || undefined,
      colorOrTheme: customerData.colorOrTheme?.trim() || undefined,
      notes: customerData.notes?.trim() || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    customers.unshift(updatedCustomer);
  }

  saveCustomersToStorage(customers);
  return customers;
}

export function deleteCustomerFromStorage(customerId: string): Customer[] {
  const customers = loadCustomersFromStorage().filter(c => c.id !== customerId);
  saveCustomersToStorage(customers);
  return customers;
}

export function loadOrdersFromStorage(): OrderItem[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to load orders from storage', error);
  }
  
  // Seed with initial realistic data
  saveOrdersToStorage(INITIAL_SAMPLE_ORDERS);
  return INITIAL_SAMPLE_ORDERS;
}

export function saveOrdersToStorage(orders: OrderItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error('Failed to save orders to storage', error);
  }
}

export function resetToSampleOrders(): OrderItem[] {
  saveOrdersToStorage(INITIAL_SAMPLE_ORDERS);
  return INITIAL_SAMPLE_ORDERS;
}

/**
 * Export orders to CSV with detailed duration breakdown per stage
 */
export function exportOrdersToCsv(orders: OrderItem[]): void {
  const headers = [
    'รหัสงาน (Job Code)',
    'ประเภทงาน (IDD/IDH/IDR)',
    'สาขา',
    'ชื่อลูกค้า',
    'เบอร์โทรศัพท์',
    'รายละเอียดชุด',
    'วันที่สั่งตัด',
    'วันนัดฟิตติ้ง 1',
    'วันงานจริง',
    'สถานะปัจจุบัน',
    'จำนวนวันที่อยู่ในสถานะปัจจุบัน',
    'เลขพัสดุ EMS',
    'หมายเหตุ',
    'ประวัติระยะเวลาแต่ละสถานะ (วัน)',
  ];

  const rows = orders.map(order => {
    const currentDays = calculateDaysBetween(order.stageEnteredAt);
    
    // Summary of stage durations
    const stageSummary = order.history
      .map(h => `${h.stageName}: ${h.daysSpent !== undefined ? h.daysSpent + ' วัน' : 'กำลังดำเนินการ'}`)
      .join(' | ');

    return [
      `"${order.jobCode}"`,
      `"${order.jobType}"`,
      `"${order.branch}"`,
      `"${order.customerName}"`,
      `"${order.customerPhone}"`,
      `"${(order.itemDescription || '').replace(/"/g, '""')}"`,
      `"${formatThaiDate(order.orderDate)}"`,
      `"${order.fittingDateTarget ? formatThaiDate(order.fittingDateTarget) : '-'}"`,
      `"${order.eventDateTarget ? formatThaiDate(order.eventDateTarget) : '-'}"`,
      `"${order.currentStageName}"`,
      `"${currentDays} วัน"`,
      `"${order.emsNumber || '-'}"`,
      `"${(order.notes || '').replace(/"/g, '""')}"`,
      `"${stageSummary}"`,
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `รายงานติดตามงาน_IDD_IDH_IDR_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
