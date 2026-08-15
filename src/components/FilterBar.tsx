import React from 'react';
import { 
  Search, 
  Layers, 
  Sparkles, 
  LayoutList, 
  LayoutGrid, 
  Kanban, 
  Clock, 
  BarChart3,
  AlertCircle,
  CheckCircle,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { FilterOptions, JobType, ViewMode } from '../types';
import { JOB_TYPES, STAGE_CATEGORIES, STAGES } from '../data/constants';

interface FilterBarProps {
  filters: FilterOptions;
  onFilterChange: (newFilters: FilterOptions) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalFilteredCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  viewMode,
  onViewModeChange,
  totalFilteredCount,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleJobTypeChange = (type: JobType | 'all') => {
    onFilterChange({ ...filters, jobType: type });
  };

  const handleCategoryChange = (category: string) => {
    onFilterChange({ 
      ...filters, 
      category, 
      stageId: 'all' // Reset specific stage when category changes
    });
  };

  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onFilterChange({
      ...filters,
      stageId: val === 'all' ? 'all' : parseInt(val, 10),
    });
  };

  const handleStatusTypeChange = (statusType: FilterOptions['statusType']) => {
    onFilterChange({ ...filters, statusType });
  };

  const handleClearFilters = () => {
    onFilterChange({
      search: '',
      branch: 'all',
      jobType: 'all',
      category: 'all',
      stageId: 'all',
      statusType: 'all',
      sortBy: 'updatedAt',
      sortOrder: 'desc',
    });
  };

  const hasActiveFilters = 
    filters.search !== '' || 
    filters.jobType !== 'all' || 
    filters.category !== 'all' || 
    filters.stageId !== 'all' || 
    filters.statusType !== 'all';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
      {/* Top row: Search, Job Types (IDD/IDH/IDR), View Mode Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-search-orders"
            type="text"
            placeholder="ค้นหารหัสงาน (เช่น IDD-2608), ชื่อลูกค้า, เบอร์โทร, เลข EMS..."
            value={filters.search}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ ...filters, search: '' })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Job Type Selector (IDD, IDH, IDR) */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            id="filter-jobtype-all"
            onClick={() => handleJobTypeChange('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
              filters.jobType === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ทุกประเภทงาน
          </button>
          {JOB_TYPES.map(jt => (
            <button
              key={jt.type}
              id={`filter-jobtype-${jt.type.toLowerCase()}`}
              onClick={() => handleJobTypeChange(jt.type)}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                filters.jobType === jt.type
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              {jt.type}
            </button>
          ))}
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            id="viewmode-dashboard"
            onClick={() => onViewModeChange('dashboard')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'dashboard' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="แดชบอร์ดสรุปและค่าเฉลี่ย IDD, IDH, IDR"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">แดชบอร์ด</span>
          </button>
          <button
            id="viewmode-table"
            onClick={() => onViewModeChange('table')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'table' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="มุมมองตารางความละเอียดสูง"
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ตาราง</span>
          </button>
          <button
            id="viewmode-cards"
            onClick={() => onViewModeChange('cards')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="มุมมองการ์ด"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">การ์ด</span>
          </button>
          <button
            id="viewmode-kanban"
            onClick={() => onViewModeChange('kanban')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'kanban' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="มุมมองกระดานจัดกลุ่มขั้นตอน"
          >
            <Kanban className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">กระดาน</span>
          </button>
          <button
            id="viewmode-timeline"
            onClick={() => onViewModeChange('timeline')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === 'timeline' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
            title="มุมมองวิเคราะห์ไทม์ไลน์ระยะเวลา"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ระยะเวลา</span>
          </button>
        </div>

      </div>

      {/* Middle row: Category Tabs (5 major categories of 22 stages) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-xs font-semibold text-slate-500 whitespace-nowrap flex items-center gap-1">
          <Layers className="w-3.5 h-3.5" /> กลุ่มขั้นตอน:
        </span>
        <button
          id="category-tab-all"
          onClick={() => handleCategoryChange('all')}
          className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all whitespace-nowrap ${
            filters.category === 'all'
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
          }`}
        >
          ทั้งหมด (22 สถานะ)
        </button>

        {STAGE_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            id={`category-tab-${cat.id}`}
            onClick={() => handleCategoryChange(cat.id)}
            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all whitespace-nowrap ${
              filters.category === cat.id
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat.name} ({cat.countStages} ขั้น)
          </button>
        ))}
      </div>

      {/* Bottom row: Specific 22-Stage Dropdown, Status filter, Sort & Result count */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Specific Stage Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">ระบุสถานะ:</span>
            <select
              id="select-specific-stage"
              value={filters.stageId}
              onChange={handleStageChange}
              className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">ทุกสถานะ (1-22)</option>
              {STAGES.map(s => (
                <option key={s.id} value={s.id}>
                  {s.id}. {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Quick Pills */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleStatusTypeChange('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                filters.statusType === 'all'
                  ? 'bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              ทุกสถานะ
            </button>
            <button
              onClick={() => handleStatusTypeChange('in_progress')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                filters.statusType === 'in_progress'
                  ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              กำลังดำเนินการ (ขั้นตอน 1-21)
            </button>
            <button
              onClick={() => handleStatusTypeChange('delayed')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                filters.statusType === 'delayed'
                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              ⚠️ เกินกำหนด SLA
            </button>
            <button
              onClick={() => handleStatusTypeChange('urgent')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                filters.statusType === 'urgent'
                  ? 'bg-rose-100 text-rose-800 border-rose-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              🔥 งานด่วน
            </button>
            <button
              onClick={() => handleStatusTypeChange('completed')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                filters.statusType === 'completed'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              ✓ ปิดงานแล้ว (ขั้นตอน 22)
            </button>
          </div>
        </div>

        {/* Right side: Count & Clear Filter */}
        <div className="flex items-center gap-3">
          <span className="text-slate-600 font-medium">
            พบ <strong>{totalFilteredCount}</strong> รายการ
          </span>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-indigo-600 hover:text-indigo-800 underline font-medium cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
