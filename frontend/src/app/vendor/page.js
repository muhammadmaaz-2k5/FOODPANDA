'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import api from '@/lib/api';
import {
  Store,
  ChefHat,
  Bell,
  CheckCircle2,
  Clock,
  PackageCheck,
  AlertCircle,
  Volume2,
  VolumeX,
  Printer,
  Sparkles,
  Flame,
  Check,
  Settings,
  UtensilsCrossed,
  Filter
} from 'lucide-react';

const KITCHEN_STAGES = [
  { key: 'ALL', label: 'All Active' },
  { key: 'PENDING', label: 'New / Incoming 🚨' },
  { key: 'ACCEPTED', label: 'Accepted 📝' },
  { key: 'PREPARING', label: 'In Kitchen 🍳' },
  { key: 'READY', label: 'Ready for Pickup 📦' },
];

export default function VendorDashboard() {
  const { user } = useAuth();
  const { socket, joinRestaurantRoom } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [stageFilter, setStageFilter] = useState('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedTicketForPrint, setSelectedTicketForPrint] = useState(null);

  const fetchVendorData = async () => {
    try {
      const [ordersRes, analyticsRes] = await Promise.all([
        api.get('/orders').catch(() => ({ data: { success: true, data: [] } })),
        api.get('/analytics/dashboard').catch(() => ({ data: { success: true, data: null } })),
      ]);
      if (ordersRes.data?.success) setOrders(ordersRes.data.data || []);
      if (analyticsRes.data?.success) setStats(analyticsRes.data.data);
    } catch (err) {
      console.warn('Vendor data fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorData();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_order_placed', (order) => {
      setOrders((prev) => [order, ...prev]);
      if (soundEnabled) {
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.play().catch(() => {});
        } catch (e) {}
      }
    });

    socket.on('order_status_changed', () => {
      fetchVendorData();
    });

    return () => {
      socket.off('new_order_placed');
      socket.off('order_status_changed');
    };
  }, [socket, soundEnabled]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        fetchVendorData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (stageFilter === 'ALL') return o.status !== 'DELIVERED';
    return o.status === stageFilter;
  });

  return (
    <DashboardLayout role="VENDOR" title="Kitchen Display System (KDS)">
      <div className="space-y-6">
        
        {/* Top Operational Bar */}
        <div className="bg-slate-800/90 border border-slate-700/80 p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs uppercase tracking-wider mb-2">
              <ChefHat className="w-3.5 h-3.5" /> Kitchen Display System (KDS)
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">Live Kitchen Display & Ticket Hub</h1>
            <p className="text-xs text-slate-400 mt-1">Real-time incoming orders, preparation timers, and dispatch handoffs for staff.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border ${
                soundEnabled
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                  : 'bg-slate-700 border-slate-600 text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              {soundEnabled ? 'Chime ON' : 'Chime OFF'}
            </button>

            <Link
              href="/vendor/menu"
              className="px-4 py-2.5 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 border border-slate-600"
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" /> Menu Builder
            </Link>

            <Link
              href="/vendor/settings"
              className="px-4 py-2.5 rounded-2xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs shadow-xs transition flex items-center gap-1.5 border border-slate-600"
            >
              <Settings className="w-3.5 h-3.5 text-slate-300" /> Store Settings
            </Link>
          </div>
        </div>

        {/* Kitchen Stage Selector */}
        <div className="flex bg-slate-800 p-1.5 rounded-2xl border border-slate-700 gap-1 overflow-x-auto text-xs font-bold">
          {KITCHEN_STAGES.map((stage) => (
            <button
              key={stage.key}
              onClick={() => setStageFilter(stage.key)}
              className={`px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0 ${
                stageFilter === stage.key
                  ? 'bg-[#d70f64] text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {stage.label}
            </button>
          ))}
        </div>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrders.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-slate-800/60 rounded-3xl border border-slate-700">
              <ChefHat className="w-16 h-16 text-slate-600 mx-auto mb-3" />
              <h3 className="font-bold text-slate-300 text-lg">No orders in this stage</h3>
              <p className="text-xs text-slate-500 mt-1">New incoming tickets will ring and populate automatically.</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isUrgent = order.status === 'PENDING';
              return (
                <div
                  key={order.id}
                  className={`bg-slate-800 rounded-3xl border shadow-xl flex flex-col justify-between overflow-hidden transition ${
                    isUrgent
                      ? 'border-rose-500 ring-2 ring-rose-500/30'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {/* Ticket Header */}
                  <div className="p-5 border-b border-slate-700/80 bg-slate-800/90 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white">#{order.orderNumber}</span>
                        {isUrgent && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500 text-white animate-pulse">
                            NEW
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.items?.length || 1} Items
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedTicketForPrint(order)}
                        className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white cursor-pointer transition"
                        title="Print Kitchen Slip"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase ${
                        order.status === 'PENDING'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : order.status === 'PREPARING'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  {/* Itemized Kitchen Prep List */}
                  <div className="p-5 space-y-3 flex-1">
                    {order.items?.map((item) => (
                      <div key={item.id} className="border-b border-slate-700/50 pb-2.5 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start font-bold text-sm text-white">
                          <span>
                            <span className="text-amber-400 font-black mr-2 text-base">{item.quantity}x</span>
                            {item.foodItem?.name}
                          </span>
                          <span className="text-slate-400 text-xs">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                        {item.variation && (
                          <p className="text-xs text-rose-300 ml-6 mt-0.5 font-semibold">
                            Size: {item.variation.name}
                          </p>
                        )}
                        {item.instructions && (
                          <p className="text-xs text-amber-300/90 ml-6 mt-1 italic bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                            Note: "{item.instructions}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons for Kitchen Staff */}
                  <div className="p-4 bg-slate-900/60 border-t border-slate-700/80 flex gap-2">
                    {order.status === 'PENDING' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'ACCEPTED')}
                        className="foodpanda-btn flex-1 py-3 rounded-2xl text-xs font-black text-white shadow-lg cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4" /> Accept Ticket
                      </button>
                    )}

                    {order.status === 'ACCEPTED' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                        className="flex-1 py-3 rounded-2xl text-xs font-black bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-lg cursor-pointer flex items-center justify-center gap-1.5 transition"
                      >
                        <Flame className="w-4 h-4" /> Start Cooking
                      </button>
                    )}

                    {order.status === 'PREPARING' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'READY')}
                        className="flex-1 py-3 rounded-2xl text-xs font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg cursor-pointer flex items-center justify-center gap-1.5 transition"
                      >
                        <PackageCheck className="w-4 h-4" /> Mark Ready for Rider
                      </button>
                    )}

                    {order.status === 'READY' && (
                      <div className="flex-1 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-center font-bold text-xs border border-emerald-500/30">
                        Waiting for Rider Pickup 🛵
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      {/* Printable Kitchen Slip Modal */}
      {selectedTicketForPrint && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl font-mono text-xs">
            <div className="text-center border-b-2 border-dashed border-slate-300 pb-3">
              <h3 className="text-base font-black uppercase">Panda Burger Grill</h3>
              <p className="text-[10px] text-slate-500">Kitchen Order Ticket</p>
              <h2 className="text-xl font-black mt-1">#{selectedTicketForPrint.orderNumber}</h2>
              <p className="text-[10px] text-slate-400">
                {new Date(selectedTicketForPrint.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="space-y-2 border-b-2 border-dashed border-slate-300 pb-3">
              {selectedTicketForPrint.items?.map((item) => (
                <div key={item.id} className="flex justify-between font-bold">
                  <span>{item.quantity}x {item.foodItem?.name}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between font-black text-sm">
              <span>TOTAL</span>
              <span>${selectedTicketForPrint.total?.toFixed(2)}</span>
            </div>

            <div className="pt-2 flex gap-2 no-print">
              <button
                onClick={() => setSelectedTicketForPrint(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 text-white font-bold"
              >
                Print Slip
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
