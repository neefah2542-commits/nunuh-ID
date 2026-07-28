/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import { 
  ShoppingBag, 
  Hourglass, 
  Calendar, 
  CheckCircle,
  TrendingUp,
  CreditCard,
  Coins,
  Smartphone,
  Wallet,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface DashboardStatsProps {
  orders: Order[];
  onSelectTab: (tab: string) => void;
}

export default function DashboardStats({ orders, onSelectTab }: DashboardStatsProps) {
  const [isKpiExpanded, setIsKpiExpanded] = useState(true);
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(true);

  // สถิติทั้งหมด
  const totalOrders = orders.length;
  
  // กำลังดำเนินการ (ไม่ใช่ COMPLETED)
  const activeOrders = orders.filter(o => o.status !== OrderStatus.COMPLETED).length;
  
  // พร้อมส่งมอบ (READY)
  const readyOrders = orders.filter(o => o.status === OrderStatus.READY).length;

  // รายได้ทั้งหมด (รวมมัดจำหรือยอดสั่งซื้อทั้งหมด)
  const totalRevenue = orders.reduce((sum, o) => sum + o.price, 0);
  const totalDeposits = orders.reduce((sum, o) => sum + o.deposit, 0);

  // คำนวณแยกตามช่องทาง เพื่อนำไปแสดงเป็นสรุปด่วนในการ์ด "มูลค่าออเดอร์รวม"
  const transferOrders = orders.filter(o => (o.paymentMethod || "").trim() === "เงินโอน");
  const cashOrders = orders.filter(o => (o.paymentMethod || "").trim() === "เงินสด");
  const creditOrders = orders.filter(o => (o.paymentMethod || "").trim() === "บัตรเครดิต");
  const otherUnspecifiedOrders = orders.filter(o => {
    const m = (o.paymentMethod || "").trim();
    return !m || !["เงินโอน", "เงินสด", "บัตรเครดิต"].includes(m);
  });

  const transferRevenue = transferOrders.reduce((sum, o) => sum + (o.price || 0), 0);
  const transferDeposit = transferOrders.reduce((sum, o) => sum + (o.deposit || 0), 0);

  const cashRevenue = cashOrders.reduce((sum, o) => sum + (o.price || 0), 0);
  const cashDeposit = cashOrders.reduce((sum, o) => sum + (o.deposit || 0), 0);

  const creditRevenue = creditOrders.reduce((sum, o) => sum + (o.price || 0), 0);
  const creditDeposit = creditOrders.reduce((sum, o) => sum + (o.deposit || 0), 0);

  const otherRevenue = otherUnspecifiedOrders.reduce((sum, o) => sum + (o.price || 0), 0);
  const otherDeposit = otherUnspecifiedOrders.reduce((sum, o) => sum + (o.deposit || 0), 0);

  const stats = [
    {
      id: "stat-total",
      label: "ออเดอร์ทั้งหมด",
      value: `${totalOrders} ชุด`,
      icon: ShoppingBag,
      color: "bg-natural-sand text-natural-espresso border-natural-wheat/80",
      description: "ประวัติการสั่งซื้อรวมทั้งหมด",
      actionLabel: "ดูงานทั้งหมด",
      onClick: () => onSelectTab("tracker")
    },
    {
      id: "stat-active",
      label: "กำลังดำเนินงาน",
      value: `${activeOrders} ชุด`,
      icon: Hourglass,
      color: "bg-[rgba(185,98,72,0.06)] text-natural-clay border-natural-clay/20",
      description: "กำลังตัดเย็บ / เตรียมงาน",
      actionLabel: "ติดตามสถานะงาน",
      onClick: () => onSelectTab("tracker")
    },
    {
      id: "stat-ready",
      label: "พร้อมส่งมอบ",
      value: `${readyOrders} ชุด`,
      icon: SparklesIcon, // We can use standard Sparkles icon from lucide
      color: "bg-[rgba(93,114,96,0.08)] text-natural-sage border-natural-sage/25",
      description: "เสร็จสิ้น QC รอส่งถึงมือลูกค้า",
      actionLabel: "ดูวันส่งชุด",
      onClick: () => onSelectTab("calendar")
    },
    {
      id: "stat-revenue",
      label: "มูลค่าออเดอร์รวม",
      value: `${totalRevenue.toLocaleString()} ฿`,
      icon: CreditCard,
      color: "bg-[rgba(194,141,84,0.08)] text-natural-ochre border-natural-ochre/25",
      description: `ได้รับมัดจำแล้ว ${totalDeposits.toLocaleString()} ฿`,
      actionLabel: "รับออเดอร์เพิ่ม",
      onClick: () => onSelectTab("orderForm")
    }
  ];

  // คำนวณแยกประเภท ยอดโอน, ยอดสด, ยอดบัตรเครดิต
  const paymentMethods = ["เงินโอน", "เงินสด", "บัตรเครดิต"];
  
  const paymentSummary = paymentMethods.map(method => {
    const matchingOrders = orders.filter(o => {
      const oMethod = (o.paymentMethod || "").trim();
      return oMethod === method;
    });
    
    const priceSum = matchingOrders.reduce((sum, o) => sum + (o.price || 0), 0);
    const depositSum = matchingOrders.reduce((sum, o) => sum + (o.deposit || 0) + (o.finalPaymentAmount || 0), 0);
    const discountSum = matchingOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
    const unpaidSum = Math.max(0, priceSum - discountSum - depositSum);
    const count = matchingOrders.length;
    
    let icon = Wallet;
    let colorClasses = {
      bg: "bg-white/60 hover:bg-white/80 border-natural-wheat/60 text-natural-espresso",
      iconBg: "bg-natural-sand text-natural-espresso",
      badge: "bg-natural-sand text-natural-espresso",
      depositText: "text-natural-sage"
    };

    if (method === "เงินโอน") {
      icon = Smartphone;
      colorClasses = {
        bg: "bg-white/90 hover:bg-white border-natural-sage/15 text-natural-espresso",
        iconBg: "bg-natural-sage/10 text-natural-sage",
        badge: "bg-natural-sage/10 text-natural-sage border border-natural-sage/15",
        depositText: "text-natural-sage-dark"
      };
    } else if (method === "เงินสด") {
      icon = Coins;
      colorClasses = {
        bg: "bg-white/90 hover:bg-white border-natural-clay/15 text-natural-espresso",
        iconBg: "bg-natural-clay/10 text-natural-clay",
        badge: "bg-natural-clay/10 text-natural-clay border border-natural-clay/15",
        depositText: "text-natural-clay-dark"
      };
    } else if (method === "บัตรเครดิต") {
      icon = CreditCard;
      colorClasses = {
        bg: "bg-white/90 hover:bg-white border-natural-ochre/15 text-natural-espresso",
        iconBg: "bg-natural-ochre/10 text-natural-ochre",
        badge: "bg-natural-ochre/10 text-natural-ochre border border-natural-ochre/15",
        depositText: "text-natural-ochre"
      };
    }

    return { 
      method, 
      priceSum, 
      depositSum, 
      unpaidSum, 
      count, 
      icon, 
      colorClasses 
    };
  });

  // สำหรับออเดอร์ที่ยังไม่ระบุช่องทางการเงิน หรือเป็นข้อมูลเก่าอื่นๆ
  const otherOrders = orders.filter(o => {
    const oMethod = (o.paymentMethod || "").trim();
    return !oMethod || !paymentMethods.includes(oMethod);
  });
  
  const otherPriceSum = otherOrders.reduce((sum, o) => sum + (o.price || 0), 0);
  const otherDepositSum = otherOrders.reduce((sum, o) => sum + (o.deposit || 0) + (o.finalPaymentAmount || 0), 0);
  const otherDiscountSum = otherOrders.reduce((sum, o) => sum + (o.discount || 0), 0);
  const otherUnpaidSum = Math.max(0, otherPriceSum - otherDiscountSum - otherDepositSum);
  const otherCount = otherOrders.length;

  if (otherCount > 0) {
    paymentSummary.push({
      method: "ไม่ระบุช่องทาง",
      priceSum: otherPriceSum,
      depositSum: otherDepositSum,
      unpaidSum: otherUnpaidSum,
      count: otherCount,
      icon: Wallet,
      colorClasses: {
        bg: "bg-white/70 hover:bg-white border-dashed border-natural-wheat text-natural-espresso",
        iconBg: "bg-natural-sand/60 text-natural-espresso/60",
        badge: "bg-natural-sand text-natural-espresso/60 border border-natural-wheat/50",
        depositText: "text-natural-espresso/70"
      }
    });
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Top Header & Toggle Bar for KPI Stats */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-2">
          <ShoppingBag className="h-5 w-5 text-natural-clay" />
          <h3 className="text-sm font-bold text-natural-espresso font-serif">
            ภาพรวมสถิติออเดอร์ (Overview Statistics)
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setIsKpiExpanded(!isKpiExpanded)}
          className="flex items-center space-x-1.5 text-xs text-natural-espresso/70 hover:text-natural-clay font-bold bg-white/80 hover:bg-white px-3.5 py-1.5 rounded-xl border border-natural-wheat/60 shadow-2xs transition-all cursor-pointer"
        >
          <span>{isKpiExpanded ? 'ย่อแผงข้อมูล' : 'ขยายแผงข้อมูล'}</span>
          {isKpiExpanded ? (
            <ChevronUp className="h-4 w-4 text-natural-clay" />
          ) : (
            <ChevronDown className="h-4 w-4 text-natural-clay" />
          )}
        </button>
      </div>

      {/* 1. KPI Stats Cards Grid */}
      {isKpiExpanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fadeIn">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div 
                key={stat.id}
                id={stat.id}
                className={`p-5 rounded-2xl border transition-all duration-300 hover:shadow-md flex flex-col justify-between ${stat.color}`}
                style={{
                  height: stat.id === 'stat-revenue' ? '230px' : '180px',
                  ...(stat.id === 'stat-revenue' ? { fontSize: '16px' } : {})
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium opacity-80">{stat.label}</span>
                    <IconComponent className="h-5 w-5 opacity-80" />
                  </div>
                  <h3 className="text-2xl font-serif font-bold tracking-tight mb-1">{stat.value}</h3>
                  <p className="text-xs opacity-75 mb-1">{stat.description}</p>

                  {/* สรุปยอดเงินด่วนแยกช่องทาง บรรจุลงภายในการ์ดมูลค่ารวมเลย */}
                  {stat.id === "stat-revenue" && (
                    <div className="mt-3 pt-3 border-t border-natural-ochre/20 space-y-2 text-[11px] font-sans">
                      <div className="flex justify-between items-center text-natural-espresso/90">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Smartphone className="h-3 w-3 text-natural-sage" /> เงินโอน:
                        </span>
                        <span className="font-bold text-natural-sage">
                          {transferDeposit.toLocaleString()} ฿
                          <span className="font-normal opacity-60 text-[10px] ml-1">({transferRevenue.toLocaleString()})</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-natural-espresso/90">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Coins className="h-3 w-3 text-natural-clay" /> เงินสด:
                        </span>
                        <span className="font-bold text-natural-clay">
                          {cashDeposit.toLocaleString()} ฿
                          <span className="font-normal opacity-60 text-[10px] ml-1">({cashRevenue.toLocaleString()})</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-natural-espresso/90">
                        <span className="flex items-center gap-1.5 font-medium">
                          <CreditCard className="h-3 w-3 text-natural-ochre" /> บัตรเครดิต:
                        </span>
                        <span className="font-bold text-natural-ochre">
                          {creditDeposit.toLocaleString()} ฿
                          <span className="font-normal opacity-60 text-[10px] ml-1">({creditRevenue.toLocaleString()})</span>
                        </span>
                      </div>
                      {otherDeposit > 0 && (
                        <div className="flex justify-between items-center text-natural-espresso/75 italic">
                          <span className="flex items-center gap-1.5">
                            <Wallet className="h-3 w-3 opacity-60" /> อื่นๆ:
                          </span>
                          <span className="font-semibold text-natural-espresso/80">
                            {otherDeposit.toLocaleString()} ฿
                            <span className="font-normal opacity-60 text-[10px] ml-1">({otherRevenue.toLocaleString()})</span>
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button 
                  onClick={stat.onClick}
                  className="mt-4 text-xs font-medium underline underline-offset-4 text-left hover:opacity-80 transition-all cursor-pointer"
                >
                  {stat.actionLabel} &rarr;
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. Sleek Interactive Payment Breakdown Panel */}
      <div className="bg-natural-sand/20 border border-natural-wheat rounded-2xl p-5 transition-all duration-300">
        <div 
          onClick={() => setIsBreakdownExpanded(!isBreakdownExpanded)}
          className="flex items-center justify-between cursor-pointer select-none group"
        >
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-natural-clay" />
            <h4 className="text-sm font-bold text-natural-espresso font-serif group-hover:text-natural-clay transition-colors">
              สรุปยอดรับเงินแยกตามช่องทางการชำระ (Payment Summary)
            </h4>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-natural-espresso/70 group-hover:text-natural-clay font-bold bg-white/80 group-hover:bg-white px-3.5 py-1.5 rounded-xl border border-natural-wheat/60 shadow-2xs transition-all">
            <span>{isBreakdownExpanded ? 'ย่อแผงข้อมูล' : 'ขยายแผงข้อมูล'}</span>
            {isBreakdownExpanded ? (
              <ChevronUp className="h-4 w-4 text-natural-clay" />
            ) : (
              <ChevronDown className="h-4 w-4 text-natural-clay" />
            )}
          </div>
        </div>

        {isBreakdownExpanded && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5 animate-fadeIn">
            {paymentSummary.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div 
                  key={idx}
                  className={`p-4 rounded-xl border transition-all duration-300 ${item.colorClasses.bg}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${item.colorClasses.iconBg}`}>
                        <IconComp className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-natural-espresso font-sans">
                        {item.method}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.colorClasses.badge}`}>
                      {item.count} ออเดอร์
                    </span>
                  </div>

                  <div className="space-y-2 mt-2">
                    {/* ยอดมัดจำ */}
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-natural-espresso/50 font-medium">ยอดมัดจำที่ได้รับ:</span>
                      <span className={`text-sm font-bold ${item.colorClasses.depositText}`}>
                        {item.depositSum.toLocaleString()} ฿
                      </span>
                    </div>

                    {/* ยอดค้างชำระ */}
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-natural-espresso/50 font-medium">ยอดคงเหลือค้างรับ:</span>
                      <span className={`text-xs font-semibold ${item.unpaidSum > 0 ? 'text-natural-clay' : 'text-natural-sage'}`}>
                        {item.unpaidSum > 0 ? `${item.unpaidSum.toLocaleString()} ฿` : 'ครบถ้วนแล้ว ✓'}
                      </span>
                    </div>

                    {/* เส้นแบ่งย่อย */}
                    <div className="border-t border-natural-wheat/30 my-1"></div>

                    {/* ยอดขายรวม */}
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-natural-espresso/60 font-semibold">มูลค่าออเดอร์รวม:</span>
                      <span className="text-xs font-extrabold text-natural-espresso">
                        {item.priceSum.toLocaleString()} ฿
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Sparkles fallback or replacement
function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5Z" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z" />
    </svg>
  );
}
