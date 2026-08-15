import { STAGES } from '../data/constants';

/**
 * Calculate the difference in days (floating point, with 1 decimal) between two dates
 */
export function calculateDaysBetween(startDateStr: string, endDateStr?: string): number {
  if (!startDateStr) return 0;
  const start = new Date(startDateStr).getTime();
  const end = endDateStr ? new Date(endDateStr).getTime() : new Date().getTime();
  
  if (isNaN(start) || isNaN(end) || end < start) return 0;
  
  const diffMs = end - start;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return Math.round(diffDays * 10) / 10;
}

/**
 * Format duration into readable Thai text
 * e.g., 0.1 -> "< 1 วัน (2 ชม.)", 1.5 -> "1.5 วัน", 3.0 -> "3 วัน"
 */
export function formatDurationThai(days: number): string {
  if (days <= 0) return '0 วัน (เพิ่งเริ่ม)';
  if (days < 0.1) return '< 1 ชั่วโมง';
  if (days < 1) {
    const hours = Math.round(days * 24);
    return `${hours} ชั่วโมง (${days} วัน)`;
  }
  return `${days % 1 === 0 ? days.toFixed(0) : days.toFixed(1)} วัน`;
}

/**
 * Format Date to Thai string e.g., "14 ส.ค. 2569" or "14 ส.ค. 2026 14:30"
 */
export function formatThaiDate(dateStr?: string, includeTime = false): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '-';
  
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543; // Buddhist Era
  
  if (includeTime) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year} ${hours}:${minutes} น.`;
  }
  
  return `${day} ${month} ${year}`;
}

/**
 * Format relative time in Thai e.g., "วันนี้", "เมื่อวาน", "3 วันที่แล้ว"
 */
export function formatRelativeThai(dateStr: string): string {
  if (!dateStr) return '-';
  const now = new Date().getTime();
  const past = new Date(dateStr).getTime();
  const diffDays = (now - past) / (1000 * 60 * 60 * 24);
  
  if (diffDays < 0.05) return 'เมื่อสักครู่';
  if (diffDays < 1) return 'วันนี้';
  if (diffDays < 2) return 'เมื่อวานนี้';
  return `${Math.floor(diffDays)} วันที่แล้ว`;
}

/**
 * Check if the stage has exceeded the standard SLA duration
 */
export function checkStageSlaStatus(stageId: number, daysSpent: number): {
  isOverdue: boolean;
  isWarning: boolean;
  slaDays: number;
  difference: number;
} {
  const stage = STAGES.find(s => s.id === stageId);
  const slaDays = stage?.defaultSlaDays || 2;
  
  if (slaDays === 0) {
    return { isOverdue: false, isWarning: false, slaDays: 0, difference: 0 };
  }
  
  const difference = Math.round((daysSpent - slaDays) * 10) / 10;
  const isOverdue = daysSpent > slaDays;
  const isWarning = !isOverdue && daysSpent >= (slaDays * 0.8);
  
  return { isOverdue, isWarning, slaDays, difference };
}

/**
 * Days remaining until target event or fitting date
 */
export function getDaysRemaining(targetDateStr?: string): {
  days: number;
  label: string;
  isPast: boolean;
} {
  if (!targetDateStr) return { days: 0, label: 'ไม่ได้ระบุ', isPast: false };
  const target = new Date(targetDateStr).getTime();
  const now = new Date().getTime();
  const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return { days: Math.abs(diffDays), label: `เลยกำหนด ${Math.abs(diffDays)} วัน`, isPast: true };
  }
  if (diffDays === 0) {
    return { days: 0, label: 'กำหนดวันนี้', isPast: false };
  }
  if (diffDays === 1) {
    return { days: 1, label: 'พรุ่งนี้', isPast: false };
  }
  return { days: diffDays, label: `อีก ${diffDays} วัน`, isPast: false };
}
