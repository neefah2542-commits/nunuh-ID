export type JobType = 'IDD' | 'IDH' | 'IDR';

export type BranchName = 
  | 'นราธิวาส'
  | 'ปัตตานี'
  | 'ยะลา'
  | 'ดิจิตอล'
  | 'กระบี่'
  | 'มิสทีน'
  | 'หาดใหญ่'
  | 'เดอะมอลล์';

export interface StageDefinition {
  id: number;
  name: string;
  category: 'production' | 'distribution' | 'fitting' | 'alteration' | 'handover';
  categoryName: string;
  defaultSlaDays: number;
  description: string;
  requiresEms?: boolean;
}

export interface StatusHistoryEntry {
  stageId: number;
  stageName: string;
  enteredAt: string; // ISO date string
  completedAt?: string; // ISO date string, undefined if currently active
  daysSpent?: number; // Calculated days spent in this stage
  updatedBy: string;
  notes?: string;
  emsTrackingNumber?: string;
}

export interface OrderItem {
  id: string;
  jobCode: string; // e.g. IDD-2026-0812
  jobType: JobType;
  branch: BranchName;
  customerName: string;
  customerPhone: string;
  customerType?: MembershipType;
  itemDescription: string;
  measurements?: string;
  colorOrTheme?: string;
  price?: number;
  deposit?: number;
  
  orderDate: string; // ISO date string
  fittingDateTarget?: string; // Planned Fitting Day 1 date
  eventDateTarget?: string; // Planned wedding/event date
  
  currentStageId: number;
  currentStageName: string;
  stageEnteredAt: string; // When the current stage started
  
  isUrgent?: boolean;
  history: StatusHistoryEntry[];
  
  emsNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'dashboard' | 'table' | 'cards' | 'kanban' | 'timeline';

export type MembershipType = 'PRIME' | 'PRIVILEGE' | 'TRADER' | 'MEMBER';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  branch: BranchName;
  customerType?: MembershipType;
  measurements?: string;
  colorOrTheme?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FilterOptions {
  search: string;
  branch: BranchName | 'all';
  jobType: JobType | 'all';
  category: string | 'all';
  stageId: number | 'all';
  statusType: 'all' | 'in_progress' | 'completed' | 'urgent' | 'delayed';
  sortBy: 'updatedAt' | 'orderDate' | 'daysInCurrentStage' | 'eventDate';
  sortOrder: 'asc' | 'desc';
}
