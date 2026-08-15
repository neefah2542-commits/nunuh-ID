import React from 'react';
import { Check } from 'lucide-react';
import { MembershipType } from '../types';
import { MEMBERSHIP_TYPES } from '../data/constants';

interface MembershipCardTypeSelectorProps {
  value?: MembershipType;
  onChange: (type: MembershipType) => void;
  label?: string;
  className?: string;
  allowClear?: boolean;
}

export const MembershipCardTypeSelector: React.FC<MembershipCardTypeSelectorProps> = ({
  value = 'MEMBER',
  onChange,
  label = 'ประเภทบัตรสมาชิก (Membership Card Type)',
  className = '',
  allowClear = false,
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700">
          {label}
        </label>
      )}

      <div className="grid grid-cols-2 gap-2">
        {MEMBERSHIP_TYPES.map((item) => {
          const isSelected = value === item.id;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => {
                if (isSelected && allowClear) {
                  // If allowClear
                } else {
                  onChange(item.id);
                }
              }}
              className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all text-left group select-none ${
                isSelected
                  ? 'bg-[#b80053] border-[#b80053] text-white shadow-sm ring-2 ring-pink-300/50'
                  : 'bg-white border-pink-200/90 hover:border-pink-300 hover:bg-pink-50/30 text-slate-800'
              }`}
            >
              <span className={`text-xs sm:text-sm font-bold tracking-tight ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                {item.label}
              </span>

              <div className="flex items-center justify-center shrink-0 ml-2">
                {isSelected ? (
                  <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs">
                    <Check className="w-3.5 h-3.5 text-[#b80053] stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-pink-200 group-hover:border-pink-300 bg-white" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const MembershipBadge: React.FC<{ type?: MembershipType; size?: 'sm' | 'md' }> = ({
  type,
  size = 'md',
}) => {
  if (!type) return null;

  const config = MEMBERSHIP_TYPES.find(m => m.id === type) || MEMBERSHIP_TYPES[3];

  let badgeColor = '';
  switch (type) {
    case 'PRIME':
      badgeColor = 'bg-amber-50 text-amber-900 border-amber-300';
      break;
    case 'PRIVILEGE':
      badgeColor = 'bg-purple-50 text-purple-900 border-purple-300';
      break;
    case 'TRADER':
      badgeColor = 'bg-blue-50 text-blue-900 border-blue-300';
      break;
    case 'MEMBER':
    default:
      badgeColor = 'bg-rose-50 text-[#b80053] border-pink-300';
      break;
  }

  const sizeClasses = size === 'sm' 
    ? 'px-1.5 py-0.2 text-[10px]' 
    : 'px-2 py-0.5 text-xs';

  return (
    <span className={`inline-flex items-center gap-1 rounded-md font-bold border tracking-tight ${sizeClasses} ${badgeColor}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      <span>{config.name}</span>
    </span>
  );
};
