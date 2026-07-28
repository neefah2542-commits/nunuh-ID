/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Order, OrderStatus, CatalogueItem, CustomerReview } from './types';
import { INITIAL_ORDERS, INITIAL_CATALOGUE, INITIAL_REVIEWS } from './initialData';

// Components
import DashboardStats from './components/DashboardStats';
import OrderForm from './components/OrderForm';
import OrderTracker from './components/OrderTracker';
import DeliveryCalendar from './components/DeliveryCalendar';
import DressCatalogue from './components/DressCatalogue';
import CustomerPortal from './components/CustomerPortal';
import ReviewDashboard from './components/ReviewDashboard';
import CustomerDashboard from './components/CustomerDashboard';

// Icons
import { 
  ClipboardCheck, 
  Scissors, 
  Calendar as CalendarIcon, 
  Sparkles, 
  PlusCircle, 
  Heart,
  Store,
  Layers,
  Star,
  Users,
  Settings,
  Phone
} from 'lucide-react';

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [catalogue, setCatalogue] = useState<CatalogueItem[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [preselectedDesignId, setPreselectedDesignId] = useState<string>('custom');
  const [activeTab, setActiveTab] = useState<string>('tracker'); // tracker, orderForm, calendar, catalogue, reviews
  const [isCustomerMode, setIsCustomerMode] = useState<boolean>(false);
  const [isStaffMode, setIsStaffMode] = useState<boolean>(false);
  const [copiedStaffLink, setCopiedStaffLink] = useState<boolean>(false);
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('nunuh_selected_theme') || 'pink';
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [boutiquePhone, setBoutiquePhone] = useState<string>(() => {
    return localStorage.getItem('nunuh_boutique_phone') || '086-555-1234';
  });

  const handleUpdateBoutiquePhone = async (newPhone: string) => {
    setBoutiquePhone(newPhone);
    localStorage.setItem('nunuh_boutique_phone', newPhone);
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ boutiquePhone: newPhone })
      });
    } catch (e) {
      console.warn('Failed to sync boutique phone with server:', e);
    }
  };

  // Save selected theme to localStorage when changed
  useEffect(() => {
    localStorage.setItem('nunuh_selected_theme', theme);
    // Sync to server
    fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme })
    }).catch(() => {});
  }, [theme]);

  // ฟังก์ชันผสานข้อมูลออเดอร์โดยไม่ให้ข้อมูลทับกันหรือสูญหาย (Smart Order Merge)
  const mergeOrders = (current: Order[], incoming: Order[]): Order[] => {
    const deletedIdsStr = localStorage.getItem('nunuh_deleted_order_ids') || '[]';
    let deletedIds: string[] = [];
    try {
      deletedIds = JSON.parse(deletedIdsStr);
    } catch (e) {}
    const deletedSet = new Set(deletedIds);

    const map = new Map<string, Order>();
    for (const o of current) {
      if (!deletedSet.has(o.id)) {
        map.set(o.id, o);
      }
    }
    for (const o of incoming) {
      if (deletedSet.has(o.id)) continue;
      if (!map.has(o.id)) {
        map.set(o.id, o);
      } else {
        const existing = map.get(o.id)!;
        const existingTime = existing.updatedAt || 0;
        const incomingTime = o.updatedAt || 0;
        if (incomingTime >= existingTime) {
          map.set(o.id, { ...existing, ...o });
        }
      }
    }
    // เรียงลำดับตามวันที่สร้างหรือเลขที่ออเดอร์ล่าสุดให้อยู่ด้านบน
    return Array.from(map.values()).sort((a, b) => {
      return b.orderNumber.localeCompare(a.orderNumber, undefined, { numeric: true });
    });
  };

  // ซิงค์ข้อมูลกับ Server Backend
  const syncWithServer = async (ordersToUpload?: Order[]) => {
    try {
      const storedLocal = localStorage.getItem('nunuh_orders');
      let currentLocal: Order[] = [];
      if (storedLocal) {
        currentLocal = JSON.parse(storedLocal);
      }
      
      const targetOrders = ordersToUpload || currentLocal;
      const publicUrl = localStorage.getItem('nunuh_public_url') || window.location.origin;

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orders: targetOrders, publicUrl })
      });
      
      if (response.ok) {
        const mergedFromServer = await response.json();
        if (Array.isArray(mergedFromServer)) {
          // ผสานข้อมูลฝั่งเซิร์ฟเวอร์กลับลง LocalStorage
          const finalMerged = mergeOrders(currentLocal, mergedFromServer);
          setOrders(finalMerged);
          localStorage.setItem('nunuh_orders', JSON.stringify(finalMerged));
        }
      }
    } catch (e) {
      console.warn('Backend sync is temporarily unavailable, running in local-only mode:', e);
    }
  };

  const syncAllDataWithServer = async () => {
    // 1. Sync orders
    await syncWithServer();

    // 2. Sync catalogue
    try {
      const res = await fetch('/api/catalogue');
      if (res.ok) {
        const serverCat = await res.json();
        if (Array.isArray(serverCat) && serverCat.length > 0) {
          setCatalogue(serverCat);
          localStorage.setItem('nunuh_catalogue', JSON.stringify(serverCat));
        } else {
          // If server is empty, upload local catalogue
          const localCat = localStorage.getItem('nunuh_catalogue');
          if (localCat) {
            await fetch('/api/catalogue', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: localCat
            });
          }
        }
      }
    } catch (e) {
      console.warn('Failed to sync catalogue:', e);
    }

    // 3. Sync settings
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const serverSettings = await res.json();
        if (serverSettings && typeof serverSettings === 'object' && Object.keys(serverSettings).length > 0) {
          if (serverSettings.boutiquePhone) {
            setBoutiquePhone(serverSettings.boutiquePhone);
            localStorage.setItem('nunuh_boutique_phone', serverSettings.boutiquePhone);
          }
          if (serverSettings.theme) {
            setTheme(serverSettings.theme);
            localStorage.setItem('nunuh_selected_theme', serverSettings.theme);
          }
          if (serverSettings.lineOaId) {
            localStorage.setItem('nunuh_line_oa_id', serverSettings.lineOaId);
          }
          if (serverSettings.lineOaChatUrl) {
            localStorage.setItem('nunuh_line_oa_chat_url', serverSettings.lineOaChatUrl);
          }
          if (serverSettings.publicUrl) {
            localStorage.setItem('nunuh_public_url', serverSettings.publicUrl);
          }
        } else {
          // If server is empty, upload local settings
          const localPhone = localStorage.getItem('nunuh_boutique_phone') || '086-555-1234';
          const localTheme = localStorage.getItem('nunuh_selected_theme') || 'pink';
          const localLineOaId = localStorage.getItem('nunuh_line_oa_id') || '@237aynfq';
          const localLineOaChatUrl = localStorage.getItem('nunuh_line_oa_chat_url') || 'https://chat.line.biz/';
          const localPublicUrl = localStorage.getItem('nunuh_public_url') || window.location.origin;

          await fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              boutiquePhone: localPhone,
              theme: localTheme,
              lineOaId: localLineOaId,
              lineOaChatUrl: localLineOaChatUrl,
              publicUrl: localPublicUrl
            })
          });
        }
      }
    } catch (e) {
      console.warn('Failed to sync settings:', e);
    }

    // 4. Sync reviews
    try {
      const res = await fetch('/api/reviews');
      if (res.ok) {
        const serverReviews = await res.json();
        if (Array.isArray(serverReviews) && serverReviews.length > 0) {
          setReviews(serverReviews);
          localStorage.setItem('nunuh_reviews', JSON.stringify(serverReviews));
        } else {
          // If server is empty, upload local reviews
          const localRev = localStorage.getItem('nunuh_reviews');
          if (localRev) {
            await fetch('/api/reviews', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: localRev
            });
          }
        }
      }
    } catch (e) {
      console.warn('Failed to sync reviews:', e);
    }
  };

  // โหลดข้อมูลออเดอร์และแคตตาล็อกจาก LocalStorage หรือตั้งค่าด้วยชุดข้อมูลเริ่มต้น
  useEffect(() => {
    let initialOrders = INITIAL_ORDERS;
    const savedOrders = localStorage.getItem('nunuh_orders');
    if (savedOrders) {
      try {
        let parsed = JSON.parse(savedOrders);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // กรองข้อมูลที่เป็นออเดอร์ตัวอย่างออกเพื่อให้พร้อมใช้งานจริง
          parsed = parsed.filter(o => !['order-1', 'order-2', 'order-3', 'order-4', 'order-5', 'order-6'].includes(o.id));
          initialOrders = mergeOrders(INITIAL_ORDERS, parsed);
        }
      } catch (e) {
        initialOrders = INITIAL_ORDERS;
      }
    }
    setOrders(initialOrders);
    localStorage.setItem('nunuh_orders', JSON.stringify(initialOrders));

    const savedCatalogue = localStorage.getItem('nunuh_catalogue');
    if (savedCatalogue) {
      try {
        let parsed = JSON.parse(savedCatalogue) as CatalogueItem[];
        // กรองแบบชุดตัวอย่างเริ่มต้นที่แถมมากับแอปออก (เช่น cat-1 ถึง cat-16) เพื่อให้เหลือแต่แบบชุดของเจ้าของร้านที่เพิ่มขึ้นมาใหม่เอง
        parsed = parsed.filter(item => {
          const idNum = parseInt(item.id.replace('cat-', ''), 10);
          return isNaN(idNum) || idNum > 10000;
        });
        
        const missingItems = INITIAL_CATALOGUE.filter(item => !parsed.some(p => p.id === item.id));
        if (missingItems.length > 0) {
          const merged = [...parsed, ...missingItems];
          setCatalogue(merged);
          localStorage.setItem('nunuh_catalogue', JSON.stringify(merged));
        } else {
          setCatalogue(parsed);
          localStorage.setItem('nunuh_catalogue', JSON.stringify(parsed));
        }
      } catch (e) {
        setCatalogue(INITIAL_CATALOGUE);
        localStorage.setItem('nunuh_catalogue', JSON.stringify(INITIAL_CATALOGUE));
      }
    } else {
      setCatalogue(INITIAL_CATALOGUE);
      localStorage.setItem('nunuh_catalogue', JSON.stringify(INITIAL_CATALOGUE));
    }

    const savedReviews = localStorage.getItem('nunuh_reviews');
    if (savedReviews) {
      try {
        let parsed = JSON.parse(savedReviews) as CustomerReview[];
        // กรองรีวิวตัวอย่างออกเพื่อให้พร้อมใช้งานจริง
        parsed = parsed.filter(r => !['rev-1', 'rev-2', 'rev-3'].includes(r.id) && !['order-1', 'order-2', 'order-3', 'order-4', 'order-5', 'order-6', 'order-past-1', 'order-past-2'].includes(r.orderId));
        const missingReviews = INITIAL_REVIEWS.filter(item => !parsed.some(p => p.id === item.id));
        if (missingReviews.length > 0) {
          const merged = [...parsed, ...missingReviews];
          setReviews(merged);
          localStorage.setItem('nunuh_reviews', JSON.stringify(merged));
        } else {
          setReviews(parsed);
          localStorage.setItem('nunuh_reviews', JSON.stringify(parsed));
        }
      } catch (e) {
        setReviews(INITIAL_REVIEWS);
        localStorage.setItem('nunuh_reviews', JSON.stringify(INITIAL_REVIEWS));
      }
    } else {
      setReviews(INITIAL_REVIEWS);
      localStorage.setItem('nunuh_reviews', JSON.stringify(INITIAL_REVIEWS));
    }

    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const roleParam = params.get('role');
    
    // Save or load isCustomerMode / isStaffMode to/from localStorage for persistence!
    let currentMode = '';
    if (modeParam) {
      currentMode = modeParam;
      localStorage.setItem('nunuh_user_mode', modeParam);
    } else if (roleParam) {
      currentMode = roleParam;
      localStorage.setItem('nunuh_user_mode', roleParam);
    } else {
      currentMode = localStorage.getItem('nunuh_user_mode') || '';
    }

    if (currentMode === 'staff') {
      setIsStaffMode(true);
      setIsCustomerMode(false);
      setActiveTab('orderForm');
    } else if (currentMode === 'customer' || localStorage.getItem('nunuh_customer_portal_line_userid')) {
      // If locked to a LINE User ID, force customer mode for maximum security
      setIsCustomerMode(true);
      setIsStaffMode(false);
      setActiveTab('customer');
    } else {
      const tabParam = params.get('tab');
      if (tabParam) {
        setActiveTab(tabParam);
        if (tabParam === 'customer') {
          setIsCustomerMode(true);
        }
      }
    }

    // เริ่มต้นซิงค์ข้อมูลกับ Backend ทันทีตอนหน้าเว็บโหลด
    syncAllDataWithServer();
  }, []);

  // ซิงค์สตรีมข้อมูลเรียลไทม์ข้ามแท็บและหลายผู้ใช้งานที่ใช้ลิงก์เดียวกัน (BroadcastChannel + Storage Event + Polling)
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel('nunuh_multiuser_sync_channel');
      channel.onmessage = (event) => {
        if (event.data && event.data.type === 'ORDERS_UPDATE' && Array.isArray(event.data.orders)) {
          setOrders(prev => mergeOrders(prev, event.data.orders));
        }
      };
    } catch (e) {}

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'nunuh_orders' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setOrders(prev => mergeOrders(prev, parsed));
          }
        } catch (err) {}
      }
      if (e.key === 'nunuh_catalogue' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setCatalogue(parsed);
          }
        } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // ตรวจสอบข้อมูลจาก localStorage ทุกๆ 2.5 วินาที เพื่อให้ผู้ใช้หลายคนส่งออเดอร์พร้อมกันผ่านลิงก์เดียวกันแล้วข้อมูลซิงค์ทันทีไม่สูญหาย
    const pollInterval = setInterval(() => {
      try {
        const stored = localStorage.getItem('nunuh_orders');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setOrders(prev => {
              const merged = mergeOrders(prev, parsed);
              if (merged.length !== prev.length || JSON.stringify(merged) !== JSON.stringify(prev)) {
                return merged;
              }
              return prev;
            });
          }
        }
      } catch (e) {}
    }, 2500);

    // ตรวจสอบข้อมูลจาก Server ทุกๆ 8 วินาที เพื่อความเรียลไทม์ข้ามเครื่อง
    const serverPollInterval = setInterval(() => {
      syncAllDataWithServer();
    }, 8000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      if (channel) channel.close();
      clearInterval(pollInterval);
      clearInterval(serverPollInterval);
    };
  }, []);

  // บันทึกข้อมูลลง LocalStorage พร้อมผสานข้อมูลป้องกันการชนกัน (Concurrent Save Safety)
  const saveOrdersToStorage = (updatedOrders: Order[], deletedId?: string) => {
    try {
      const stored = localStorage.getItem('nunuh_orders');
      let currentStored: Order[] = [];
      if (stored) {
        currentStored = JSON.parse(stored);
      }
      // ผสานระหว่างข้อมูลที่มีอยู่ล่าสุดในเครื่อง กับข้อมูลที่กำลังบันทึกใหม่
      let fullyMerged = mergeOrders(currentStored, updatedOrders);
      if (deletedId) {
        fullyMerged = fullyMerged.filter(o => o.id !== deletedId);
      }
      
      setOrders(fullyMerged);
      localStorage.setItem('nunuh_orders', JSON.stringify(fullyMerged));

      // ซิงค์ส่งขึ้น Server ทันที
      syncWithServer(fullyMerged);

      // ส่งสัญญาณ BroadcastChannel ไปยังแท็บหรืออุปกรณ์อื่นทันที
      try {
        const channel = new BroadcastChannel('nunuh_multiuser_sync_channel');
        channel.postMessage({ type: 'ORDERS_UPDATE', orders: fullyMerged });
        channel.close();
      } catch (e) {}
    } catch (e) {
      let finalOrders = updatedOrders;
      if (deletedId) {
        finalOrders = finalOrders.filter(o => o.id !== deletedId);
      }
      setOrders(finalOrders);
      localStorage.setItem('nunuh_orders', JSON.stringify(finalOrders));
      syncWithServer(finalOrders);
    }
  };

  // การเพิ่มออเดอร์ใหม่
  const handleAddOrder = (newOrder: Order) => {
    const orderWithTime = { ...newOrder, updatedAt: Date.now() };
    const updated = [orderWithTime, ...orders];
    saveOrdersToStorage(updated);
    // หลังบันทึกย้ายแท็บไปหน้าติดตามงาน (หากเป็นพนักงานให้คงอยู่ที่เดิมเพื่อความปลอดภัย)
    if (isStaffMode) {
      setActiveTab('orderForm');
      alert(`บันทึกออเดอร์ใหม่ของคุณ ${newOrder.customerName} เรียบร้อยแล้วค่ะ! ✨`);
    } else {
      setActiveTab('tracker');
    }
  };

  // ปรับปรุงสถานะติดตามงาน (Update Status)
  const handleUpdateOrderStatus = (orderId: string, nextStatus: OrderStatus) => {
    const target = orders.find(o => o.id === orderId);
    if (target?.isLocked || target?.pickupSignature) {
      alert("🔒 ไม่สามารถเปลี่ยนสถานะได้ เนื่องจากออเดอร์นี้ถูกล็อกถาวรหลังจากลูกค้าเซ็นรับมอบชุดเรียบร้อยแล้ว");
      return;
    }
    const updated = orders.map(o => {
      if (o.id === orderId) {
        return { ...o, status: nextStatus, updatedAt: Date.now() };
      }
      return o;
    });
    saveOrdersToStorage(updated);
  };

  // ลบออเดอร์
  const handleDeleteOrder = async (orderId: string) => {
    const target = orders.find(o => o.id === orderId);
    if (target?.isLocked || target?.pickupSignature) {
      alert("🔒 ห้ามลบออเดอร์นี้เด็ดขาด! เนื่องจากลูกค้าได้เซ็นรับมอบชุดและระบบได้ล็อกข้อมูลถาวรแล้วเพื่อใช้เป็นหลักฐาน");
      return;
    }

    // 1. เพิ่ม ID ไปยังรายการที่ถูกลบในเครื่อง เพื่อป้องกันการคืนชีพเมื่อผสาน
    const deletedIdsStr = localStorage.getItem('nunuh_deleted_order_ids') || '[]';
    let deletedIds: string[] = [];
    try {
      deletedIds = JSON.parse(deletedIdsStr);
    } catch (e) {}
    if (!deletedIds.includes(orderId)) {
      deletedIds.push(orderId);
      localStorage.setItem('nunuh_deleted_order_ids', JSON.stringify(deletedIds));
    }

    // 2. ลบออกจากระบบเซิร์ฟเวอร์โดยตรงทันที
    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.warn("Server delete failed, will sync later:", err);
    }

    // 3. ปรับปรุงสถานะ Local และเซฟแบบคลีน
    const updated = orders.filter(o => o.id !== orderId);
    saveOrdersToStorage(updated, orderId);
  };

  // แก้ไขรายละเอียดออเดอร์ทั้งหมด
  const handleUpdateOrder = (updatedOrder: Order) => {
    const target = orders.find(o => o.id === updatedOrder.id);
    if (target?.isLocked || target?.pickupSignature) {
      alert("🔒 ออเดอร์นี้ถูกล็อกถาวรเนื่องจากลูกค้าเซ็นรับมอบชุดเรียบร้อยแล้ว ห้ามแก้ไขข้อมูลเด็ดขาด");
      return;
    }
    const orderWithTime = { ...updatedOrder, updatedAt: Date.now() };
    const updated = orders.map(o => o.id === updatedOrder.id ? orderWithTime : o);
    saveOrdersToStorage(updated);
  };

  // บันทึกลายเซ็นลูกค้ารับมอบชุด และล็อกออเดอร์ถาวร
  const handleConfirmPickupSignature = (orderId: string, signatureDataUrl: string, signeeName: string, signedAt: string) => {
    const updated = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          pickupSignature: signatureDataUrl,
          pickupSigneeName: signeeName,
          pickupSignedAt: signedAt,
          isLocked: true,
          status: OrderStatus.COMPLETED,
          updatedAt: Date.now()
        };
      }
      return o;
    });
    saveOrdersToStorage(updated);
  };

  // ฟังก์ชันเลือกแบบชุดจากแคตตาล็อกเพื่อนำมาใส่หน้าฟอร์มรับออเดอร์ทันที
  const handleSelectDesignForOrder = (designId: string) => {
    setPreselectedDesignId(designId);
    setActiveTab('orderForm');
    // โครงสร้างฟอร์มจะดึงไอดีการเลือกนี้ไปเปิดอัตโนมัติเนื่องจากถูกเลือกและส่งต่อไปที่คอมโพเนนต์
    setTimeout(() => {
      const designSelect = document.querySelector('select');
      if (designSelect) {
        designSelect.value = designId;
        // ทริกเกอร์อีเวนต์จำลองเพื่อให้อัพเดตสเตตในคอมโพเนนต์ลูก
        const event = new Event('change', { bubbles: true });
        designSelect.dispatchEvent(event);
      }
    }, 200);
  };

  // การอัปโหลด / เพิ่มแบบชุดใหม่เข้าไปยังแคตตาล็อกของทางร้าน
  const handleAddCatalogueItem = async (newItem: CatalogueItem) => {
    const updated = [...catalogue, newItem];
    setCatalogue(updated);
    localStorage.setItem('nunuh_catalogue', JSON.stringify(updated));
    try {
      await fetch('/api/catalogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) {
      console.warn('Failed to upload new catalogue item to server:', e);
    }
  };

  // การลบแบบชุดออกจากแคตตาล็อก
  const handleDeleteCatalogueItem = async (designId: string) => {
    const updated = catalogue.filter(item => item.id !== designId);
    setCatalogue(updated);
    localStorage.setItem('nunuh_catalogue', JSON.stringify(updated));
    try {
      await fetch('/api/catalogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) {
      console.warn('Failed to delete catalogue item from server:', e);
    }
  };

  // การแก้ไขรายละเอียดแบบชุดในแคตตาล็อก
  const handleUpdateCatalogueItem = async (updatedItem: CatalogueItem) => {
    const updated = catalogue.map(item => item.id === updatedItem.id ? updatedItem : item);
    setCatalogue(updated);
    localStorage.setItem('nunuh_catalogue', JSON.stringify(updated));
    try {
      await fetch('/api/catalogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) {
      console.warn('Failed to update catalogue item on server:', e);
    }
  };

  // จัดการรีวิวและความพึงพอใจของลูกค้า (Customer Reviews & Feedback Handlers)
  const handleAddReview = async (newReview: CustomerReview) => {
    const updated = [newReview, ...reviews];
    setReviews(updated);
    localStorage.setItem('nunuh_reviews', JSON.stringify(updated));
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) {
      console.warn('Failed to save new review to server:', e);
    }
  };

  const handleUpdateReview = async (updatedReview: CustomerReview) => {
    const updated = reviews.map(r => r.id === updatedReview.id ? updatedReview : r);
    setReviews(updated);
    localStorage.setItem('nunuh_reviews', JSON.stringify(updated));
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) {
      console.warn('Failed to update review on server:', e);
    }
  };

  const handleDeleteReview = async (id: string) => {
    const updated = reviews.filter(r => r.id !== id);
    setReviews(updated);
    localStorage.setItem('nunuh_reviews', JSON.stringify(updated));
    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (e) {
      console.warn('Failed to delete review from server:', e);
    }
  };

  // คำนวณรหัสออเดอร์ถัดไปแบบอัตโนมัติ (เช่น NU-26007)
  const getNextOrderNumber = () => {
    if (orders.length === 0) return "NU-26001";
    
    // ค้นหารหัสสูงสุดที่มีเลขต่อท้าย
    const orderNumbers = orders
      .map(o => {
        const match = o.orderNumber.match(/NU-(\d+)/);
        return match ? parseInt(match[1]) : 26000;
      });
    const maxNum = Math.max(...orderNumbers, 26000);
    return `NU-${maxNum + 1}`;
  };

  // ฟังก์ชันกลับสู่หน้าแรกระบบจัดการห้องเสื้อ (Home / Tracker Dashboard)
  const handleGoHome = () => {
    setIsCustomerMode(false);
    setIsStaffMode(false);
    localStorage.removeItem('nunuh_user_mode');
    setActiveTab('tracker');
    if (window.history && window.history.pushState) {
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  return (
    <div className={`min-h-screen bg-natural-cream text-natural-espresso pb-16 font-sans transition-colors duration-300 ${theme === 'sand' ? '' : `theme-${theme}`}`}>
      
      {/* 1. BRAND HERO HEADER */}
      <header className="bg-white/80 backdrop-blur-md border-b border-natural-wheat sticky top-0 z-50 shadow-xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Elegant Logo Group (Click to Home) */}
            <div 
              onClick={handleGoHome}
              className="flex items-center space-x-3.5 cursor-pointer group transition-all"
              title="คลิกเพื่อกลับสู่หน้าแรกระบบห้องเสื้อ NUNUH"
            >
              <div className="h-11 w-11 rounded-2xl bg-natural-espresso group-hover:bg-natural-clay transition-colors flex items-center justify-center text-natural-cream shadow-sm">
                <Store className="h-5 w-5 text-natural-ochre" />
              </div>
              <div>
                <h1 className="text-2xl font-serif font-black tracking-widest text-natural-espresso group-hover:text-natural-clay transition-colors uppercase">
                  NUNUH
                </h1>
                <p className="text-[9px] font-bold tracking-widest text-natural-espresso/50 uppercase">
                  {isCustomerMode 
                    ? 'CUSTOMER HUB • SECURE PORTAL' 
                    : isStaffMode 
                    ? 'STAFF PORTAL • ORDER & RECOMMEND ONLY' 
                    : 'ATELIER & COUTURE ORDER SYSTEM'}
                </p>
              </div>
            </div>

            {/* Top Workspace Tab Navs */}
            {!isCustomerMode ? (
              <nav className="flex items-center space-x-1 bg-natural-sand/50 p-1.5 rounded-2xl border border-natural-wheat/40">
                {!isStaffMode && (
                  <button
                    onClick={() => setActiveTab('tracker')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                      activeTab === 'tracker'
                        ? 'bg-natural-clay text-white shadow-xs'
                        : 'text-natural-espresso/70 hover:bg-natural-sand/80 hover:text-natural-espresso'
                    }`}
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">หน้าแรก (ติดตามงาน)</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('orderForm')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                    activeTab === 'orderForm'
                      ? 'bg-natural-clay text-white shadow-xs'
                      : 'text-natural-espresso/70 hover:bg-natural-sand/80 hover:text-natural-espresso'
                  }`}
                >
                  <PlusCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">รับออเดอร์ใหม่</span>
                </button>

                {!isStaffMode && (
                  <button
                    onClick={() => setActiveTab('calendar')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                      activeTab === 'calendar'
                        ? 'bg-natural-clay text-white shadow-xs'
                        : 'text-natural-espresso/70 hover:bg-natural-sand/80 hover:text-natural-espresso'
                    }`}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">ตารางกำหนดส่งชุด</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('catalogue')}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                    activeTab === 'catalogue'
                      ? 'bg-natural-clay text-white shadow-xs'
                      : 'text-natural-espresso/70 hover:bg-natural-sand/80 hover:text-natural-espresso'
                  }`}
                >
                  <Scissors className="h-4 w-4" />
                  <span className="hidden sm:inline">แบบชุดเสนอแนะนำ</span>
                </button>

                {!isStaffMode && (
                  <>
                    <button
                      onClick={() => setActiveTab('customerDashboard')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                        activeTab === 'customerDashboard'
                          ? 'bg-natural-clay text-white shadow-xs'
                          : 'text-natural-espresso/70 hover:bg-natural-sand/80 hover:text-natural-espresso'
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">แดชบอร์ดลูกค้า & รีวิว (IDD IDH)</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('customer')}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                        activeTab === 'customer'
                          ? 'bg-natural-clay text-white shadow-xs'
                          : 'text-natural-espresso/70 hover:bg-natural-sand/80 hover:text-natural-espresso'
                      }`}
                    >
                      <Sparkles className="h-4 w-4 text-natural-ochre" />
                      <span>สำหรับลูกค้า</span>
                    </button>
                  </>
                )}
              </nav>
            ) : (
              <button
                type="button"
                onClick={handleGoHome}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-natural-espresso text-natural-cream hover:bg-natural-clay transition-all shadow-xs cursor-pointer"
              >
                <span>🏠 กลับสู่หน้าแรกระบบห้องเสื้อ</span>
              </button>
            )}

            {/* Elegant Theme Switcher */}
            <div className="flex items-center space-x-3 no-print">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase tracking-widest text-natural-espresso/40 font-bold hidden md:inline-block">
                  ธีมร้าน:
                </span>
                <div className="flex items-center space-x-1 bg-natural-sand/50 p-1 rounded-xl border border-natural-wheat/40">
                  <button
                    type="button"
                    onClick={() => setTheme('sand')}
                    className={`w-6 h-6 rounded-lg transition-all cursor-pointer relative flex items-center justify-center bg-[#FAF6F0] border ${
                      theme === 'sand'
                        ? 'border-natural-clay ring-2 ring-natural-clay/20 shadow-xs scale-105'
                        : 'border-natural-wheat/40 hover:border-natural-clay/30'
                    }`}
                    title="ธีมสีอบอุ่นลินิน (Atelier Sand - Default)"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#B96248]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('lavender')}
                    className={`w-6 h-6 rounded-lg transition-all cursor-pointer relative flex items-center justify-center bg-[#F9F5FB] border ${
                      theme === 'lavender'
                        ? 'border-natural-clay ring-2 ring-natural-clay/20 shadow-xs scale-105'
                        : 'border-natural-wheat/40 hover:border-natural-clay/30'
                    }`}
                    title="ธีมสีม่วงราชสำนัก (Royal Lavender)"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#7A5299]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('sage')}
                    className={`w-6 h-6 rounded-lg transition-all cursor-pointer relative flex items-center justify-center bg-[#F5F8F6] border ${
                      theme === 'sage'
                        ? 'border-natural-clay ring-2 ring-natural-clay/20 shadow-xs scale-105'
                        : 'border-natural-wheat/40 hover:border-natural-clay/30'
                    }`}
                    title="ธีมสีเขียวใบเซจ (Botanical Sage)"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#3B7A57]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('crimson')}
                    className={`w-6 h-6 rounded-lg transition-all cursor-pointer relative flex items-center justify-center bg-[#FAF5F5] border ${
                      theme === 'crimson'
                        ? 'border-natural-clay ring-2 ring-natural-clay/20 shadow-xs scale-105'
                        : 'border-natural-wheat/40 hover:border-natural-clay/30'
                    }`}
                    title="ธีมสีแดงกำมะหยี่หรู (Crimson Velvet)"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#9E2A2B]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('pink')}
                    className={`w-6 h-6 rounded-lg transition-all cursor-pointer relative flex items-center justify-center bg-[#FFF5F8] border ${
                      theme === 'pink'
                        ? 'border-natural-clay ring-2 ring-natural-clay/20 shadow-xs scale-105'
                        : 'border-natural-wheat/40 hover:border-natural-clay/30'
                    }`}
                    title="ธีมสีชมพูบานเย็น (Fuchsia Royale)"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D91A5F]" />
                  </button>
                </div>
              </div>

              {!isCustomerMode && !isStaffMode && (
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(true)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-natural-sand/30 text-natural-espresso border border-natural-wheat/80 transition-all cursor-pointer shadow-3xs hover:scale-102"
                  title="ตั้งค่าข้อมูลห้องเสื้อ"
                >
                  <Settings className="h-3.5 w-3.5 text-natural-clay" />
                  <span className="hidden md:inline">ตั้งค่าร้าน</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* 2. MAIN CORE CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Staff Mode Information Banner */}
        {isStaffMode && (
          <div className="mb-6 bg-amber-50/90 border border-amber-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start space-x-3.5">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700 font-serif font-black shrink-0 text-lg">
                🛡️
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-950 font-serif">สิทธิ์การใช้งานสำหรับพนักงานรับออเดอร์ (Staff Workspace Portal)</h4>
                <p className="text-xs text-amber-800/80 leading-relaxed mt-0.5">
                  ระบบได้รับการจำกัดสิทธิ์ความปลอดภัยขั้นสูง: สามารถบันทึกรับออเดอร์ใหม่ และเปิดแบบชุดเสนอแนะจากดีไซเนอร์เท่านั้น 
                  ทางระบบได้ปิดกั้นสรุปยอดการเงิน สถิติทางธุรกิจ ประวัติลูกค้า ตลอดจนปุ่มแก้ไขดีไซน์อื่นๆ เรียบร้อยแล้วเพื่อความปลอดภัยสูงสุดของแบรนด์ NUNUH
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 shadow-3xs">
                เปิดระบบความปลอดภัยพนักงาน ✓
              </span>
            </div>
          </div>
        )}

        {/* Admin/Owner Copy Staff Link Widget */}
        {!isCustomerMode && !isStaffMode && (
          <div className="mb-6 bg-white border border-natural-wheat rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start space-x-3.5">
              <div className="h-10 w-10 rounded-xl bg-natural-clay/10 flex items-center justify-center text-natural-clay shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-natural-espresso font-serif">ระบบสิทธิ์พนักงานรับออเดอร์ (Staff Ordering Portal)</h4>
                <p className="text-xs text-natural-espresso/70 leading-relaxed mt-0.5">
                  ส่งลิงก์ด้านขวาให้กับพนักงานรับหน้าร้าน เพื่อให้พนักงานใช้งานเฉพาะหน้า <strong>"รับออเดอร์ใหม่"</strong> และ <strong>"แบบชุดเสนอแนะนำ (แคตตาล็อกอ่านอย่างเดียว)"</strong> 
                  โดยที่ระบบจะซิงค์ข้อมูลเรียลไทม์ขึ้นมาที่โต๊ะดีไซเนอร์หลังบ้าน และพนักงานจะไม่สามารถดูยอดการเงินหรือสถิติส่วนบุคคลของลูกค้าท่านอื่นได้
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0 self-start md:self-center">
              <button
                onClick={() => {
                  const staffUrl = `${window.location.origin}${window.location.pathname}?mode=staff`;
                  navigator.clipboard.writeText(staffUrl);
                  setCopiedStaffLink(true);
                  setTimeout(() => setCopiedStaffLink(false), 3000);
                }}
                className={`px-4.5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 flex items-center space-x-2 shadow-xs cursor-pointer ${
                  copiedStaffLink 
                    ? 'bg-natural-sage text-white' 
                    : 'bg-natural-clay hover:bg-natural-clay-dark text-white'
                }`}
              >
                <span>{copiedStaffLink ? 'คัดลอกลิงก์สำเร็จ! ✓' : '📋 คัดลอกลิงก์รับออเดอร์สำหรับพนักงาน'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Stats Banner */}
        {!isCustomerMode && !isStaffMode && <DashboardStats orders={orders} onSelectTab={setActiveTab} />}

        {/* Tab Content Display Area with Framer Motion Transition */}
        <div className="mt-2 min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {activeTab === 'tracker' && (
                <div className="space-y-4">
                  <div className="border-b border-natural-wheat pb-3">
                    <h2 className="text-xl font-serif font-bold text-natural-espresso">ระบบติดตามและอัพเดตสเตตัสงาน (Order Tracking Board)</h2>
                    <p className="text-xs text-natural-espresso/60">คลิกการ์ดรายการเพื่อขยายข้อมูลความต้องการ สรุปยอดค้างชำระ และข้อมูลสัดส่วนการวัดตัวลูกค้า</p>
                  </div>
                  <OrderTracker 
                    orders={orders} 
                    catalogue={catalogue}
                    onUpdateOrderStatus={handleUpdateOrderStatus}
                    onDeleteOrder={handleDeleteOrder}
                    onEditOrder={handleUpdateOrder}
                    onConfirmPickupSignature={handleConfirmPickupSignature}
                  />
                </div>
              )}

              {activeTab === 'orderForm' && (
                <div className="space-y-4">
                  <div className="border-b border-natural-wheat pb-3">
                    <h2 className="text-xl font-serif font-bold text-natural-espresso">ลงบันทึกออเดอร์ตัดเย็บใหม่ (Create Custom Order)</h2>
                    <p className="text-xs text-natural-espresso/60">กรอกข้อมูลผู้จอง สเปกแบบตัดเย็บ รายการเนื้อผ้า อัตราสัดส่วนวัดตัว ตลอดจนราคาและกำหนดส่งมอบชุด</p>
                  </div>
                  <OrderForm 
                    catalogue={catalogue} 
                    onAddOrder={handleAddOrder}
                    nextOrderNumber={getNextOrderNumber()}
                    orders={orders}
                    preselectedDesignId={preselectedDesignId}
                    onClearPreselectedDesign={() => setPreselectedDesignId('custom')}
                  />
                </div>
              )}

              {activeTab === 'calendar' && (
                <div className="space-y-4">
                  <div className="border-b border-natural-wheat pb-3">
                    <h2 className="text-xl font-serif font-bold text-natural-espresso">ตารางเวลาจัดเตรียมและจัดส่งเสื้อผ้า (Timeline & Calendar)</h2>
                    <p className="text-xs text-natural-espresso/60">ตรวจสอบกำหนดการส่งงานแบบปฏิทินรายวัน และดูจัดลำดับรอบเตรียมแพ็คจัดส่งที่รอคุณอยู่อย่างง่ายดาย</p>
                  </div>
                  <DeliveryCalendar 
                    orders={orders} 
                    onUpdateOrderStatus={handleUpdateOrderStatus}
                  />
                </div>
              )}

              {activeTab === 'catalogue' && (
                <div className="space-y-4">
                  <div className="border-b border-natural-wheat pb-3">
                    <h2 className="text-xl font-serif font-bold text-natural-espresso">คลังแบบชุดและชุดเสนอแนะเฉพาะตัว (Designer Catalogue Panel)</h2>
                    <p className="text-xs text-natural-espresso/60">แคตตาล็อกแบบพรีเมียมพร้อมเครื่องมือผสมผสานสไตล์ชุดแบบด่วน เพื่อแชร์เป็นข้อความทางการประเมินราคาส่งให้ลูกค้า</p>
                  </div>
                  <DressCatalogue 
                    catalogue={catalogue} 
                    onSelectDesignForOrder={handleSelectDesignForOrder}
                    onAddCatalogueItem={handleAddCatalogueItem}
                    onDeleteCatalogueItem={handleDeleteCatalogueItem}
                    onUpdateCatalogueItem={handleUpdateCatalogueItem}
                    isReadOnly={isStaffMode}
                  />
                </div>
              )}

              {activeTab === 'customerDashboard' && (
                <div className="space-y-4">
                  <div className="border-b border-natural-wheat pb-3">
                    <h2 className="text-xl font-serif font-bold text-natural-espresso">ระบบศูนย์ข้อมูลลูกค้าและรีวิวความพึงพอใจ (Customer CRM & Satisfaction Feedback)</h2>
                    <p className="text-xs text-natural-espresso/60">วิเคราะห์ข้อมูลประวัติการสั่งตัด จำแนกกลุ่มลูกค้าประเภท IDD, IDH และระดับบัตรสมาชิก พร้อมเจาะลึกรายละเอียดสัดส่วนตัวและติดตามรีวิวคำติชมสะสมในที่เดียว</p>
                  </div>
                  <CustomerDashboard 
                    orders={orders}
                    reviews={reviews}
                    onSelectTab={setActiveTab}
                    onAddReview={handleAddReview}
                    onUpdateReview={handleUpdateReview}
                    onDeleteReview={handleDeleteReview}
                  />
                </div>
              )}

              {activeTab === 'customer' && (
                <div className="space-y-4">
                  <div className="border-b border-natural-wheat pb-3">
                    <h2 className="text-xl font-serif font-bold text-natural-espresso">ศูนย์บริการและติดตามความคืบหน้าของลูกค้า (Customer Care & Booking)</h2>
                    <p className="text-xs text-natural-espresso/60">พื้นที่สำหรับลูกค้าเพื่อจองแบบสไตล์คอลเลกชัน ค้นหาคิวประวัติ และประเมินความคืบหน้าง่ายๆ ด้วยเบอร์โทรศัพท์</p>
                  </div>
                  <CustomerPortal 
                    orders={orders}
                    catalogue={catalogue}
                    reviews={reviews}
                    onAddReview={handleAddReview}
                    onAddOrder={handleAddOrder}
                    onUpdateOrders={saveOrdersToStorage}
                    nextOrderNumber={getNextOrderNumber()}
                    isCustomerLocked={isCustomerMode}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto" id="settings-modal">
            <div className="flex min-h-screen items-center justify-center p-4 text-center">
              {/* Overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsSettingsOpen(false)}
                className="fixed inset-0 bg-natural-espresso/35 backdrop-blur-xs transition-opacity"
              />

              {/* Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative transform overflow-hidden rounded-3xl bg-white p-6 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md border border-natural-wheat z-50"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-natural-wheat pb-4 mb-5">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-lg bg-natural-sand/50 flex items-center justify-center text-natural-clay">
                      <Settings className="h-4 w-4" />
                    </div>
                    <h3 className="text-lg font-serif font-bold text-natural-espresso">
                      ตั้งค่าข้อมูลติดต่อห้องเสื้อ
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="rounded-lg p-1 text-natural-espresso/40 hover:bg-natural-sand/30 hover:text-natural-espresso transition-all cursor-pointer"
                  >
                    <span className="sr-only">ปิด</span>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Body */}
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setIsSettingsOpen(false);
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-natural-espresso/70 mb-1.5 flex items-center space-x-1">
                      <Phone className="h-3 w-3 text-natural-clay" />
                      <span>เบอร์โทรศัพท์ห้องเสื้อ (Atelier Phone Number)</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={boutiquePhone}
                      onChange={(e) => handleUpdateBoutiquePhone(e.target.value)}
                      placeholder="เช่น 086-555-1234"
                      className="w-full text-sm px-3 py-2.5 rounded-xl border border-natural-wheat focus:outline-none focus:ring-2 focus:ring-natural-clay/20 focus:border-natural-clay bg-white text-natural-espresso font-semibold"
                    />
                    <p className="text-[10px] text-natural-espresso/45 mt-1 leading-relaxed">
                      * เบอร์โทรศัพท์นี้จะถูกนำไปใช้อัปเดตข้อมูลการติดต่อในใบเสร็จรับเงิน, เอกสารพิมพ์ใบออเดอร์ และปุ่มสำหรับลูกค้าเพื่อ "โทรติดต่อห้องเสื้อ" อัตโนมัติ
                    </p>
                  </div>

                  <div className="pt-3 border-t border-natural-wheat/50 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleUpdateBoutiquePhone('086-555-1234');
                      }}
                      className="px-3 py-2 text-xs font-bold text-natural-espresso/60 hover:text-natural-espresso hover:bg-natural-sand/30 rounded-xl transition-all cursor-pointer"
                    >
                      คืนค่าเริ่มต้น
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 text-xs font-bold text-white bg-natural-clay hover:bg-natural-clay-dark rounded-xl transition-all cursor-pointer shadow-xs"
                    >
                      บันทึกตั้งค่า
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. ATELIER FOOTER */}
      <footer className="mt-20 border-t border-natural-wheat bg-white/40 py-10 text-center text-natural-espresso/50 text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-serif font-bold tracking-widest uppercase text-natural-espresso">NUNUH BOUTIQUE</p>
          <p className="font-medium text-natural-espresso/60">ระบบคูตูร์แฮนด์เมดและจัดการรายการรับออเดอร์ลูกค้าอย่างมีระดับ</p>
          <p className="pt-2 text-[10px] text-natural-espresso/40">NUNUH Atelier © 2026. All rights reserved. Designed with precision for premium clothing salons.</p>
        </div>
      </footer>

    </div>
  );
}
