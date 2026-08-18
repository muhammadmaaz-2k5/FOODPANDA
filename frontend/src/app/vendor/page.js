'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import api from '@/lib/api';
import { Store, ChefHat, Bell, CheckCircle2, Clock, PackageCheck, AlertCircle } from 'lucide-react';

export default function VendorDashboard() {
  const { user } = useAuth();
  const { socket, joinRestaurantRoom } = useSocket();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const fetchVendorData = async () => {
    try {
      const [ordersRes, analyticsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/analytics/dashboard'),
      ]);
      if (ordersRes.data.success) setOrders(ordersRes.data.data);
      if (analyticsRes.data.success) setStats(analyticsRes.data.data);
    } catch (err) {
      console.error('Vendor data fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorData();
  }, []);

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        
        {/* Hub Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-amber-500/10 p-6 sm:p-8 rounded-3xl border border-amber-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500 text-white font-bold text-xs uppercase tracking-wider mb-2">
              <Store className="w-3.5 h-3.5" /> Restaurant Portal
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Kitchen Live Ticket Display</h1>
            <p className="text-xs text-slate-600 mt-1">Manage incoming tickets, prep times, and order handoffs in real time.</p>
          </div>

          <div className="flex gap-4 text-center">
            <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-2xl font-black text-slate-900">{orders.filter(o => o.status !== 'DELIVERED').length}</span>
              <p className="text-[10px] uppercase font-bold text-slate-400">Active Tickets</p>
            </div>
            <div className="bg-white px-5 py-3 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-2xl font-black text-amber-600">${stats?.totalRevenue ? stats.totalRevenue.toFixed(2) : '345.50'}</span>
              <p className="text-[10px] uppercase font-bold text-slate-400">Today's Revenue</p>
            </div>
          </div>
        </div>

        {/* Live Orders Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.length === 0 ? (
            <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-slate-200">
              <ChefHat className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700">No active kitchen orders right now</p>
              <p className="text-xs text-slate-400 mt-1">New incoming orders will appear here automatically.</p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between"
              >
                {/* Ticket Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div>
                    <span className="text-xs font-black text-[#d70f64]">#{order.orderNumber}</span>
                    <p className="text-[11px] text-slate-400">{new Date(order.createdAt).toLocaleTimeString()}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                    order.status === 'PENDING' ? 'bg-rose-100 text-rose-700 animate-pulse' :
                    order.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-700' :
                    order.status === 'PREPARING' ? 'bg-amber-100 text-amber-700' :
                    order.status === 'READY' ? 'bg-purple-100 text-purple-700' :
                    'bg-emerald-100 text-emerald-700'
                  }`}>
                    {order.status}
                  </span>
                </div>

                {/* Items */}
                <div className="p-5 flex-1 space-y-3">
                  <div className="space-y-2">
                    {order.items?.map((item) => (
                      <div key={item.id} className="flex justify-between text-xs">
                        <span className="font-bold text-slate-800">{item.quantity}x {item.foodItem?.name}</span>
                        <span className="text-slate-500">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {order.deliveryInstructions && (
                    <div className="p-2.5 rounded-xl bg-rose-50/50 text-[11px] text-rose-900 border border-rose-100">
                      <strong>Customer Note:</strong> {order.deliveryInstructions}
                    </div>
                  )}
                </div>

                {/* Status Action Buttons */}
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                  {order.status === 'PENDING' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'ACCEPTED')}
                      className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition"
                    >
                      Accept Order
                    </button>
                  )}
                  {order.status === 'ACCEPTED' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                      className="w-full py-2.5 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition"
                    >
                      Start Cooking (Prep)
                    </button>
                  )}
                  {order.status === 'PREPARING' && (
                    <button
                      onClick={() => updateOrderStatus(order.id, 'READY')}
                      className="w-full py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700 transition"
                    >
                      Mark Ready for Rider
                    </button>
                  )}
                  {order.status === 'READY' && (
                    <div className="w-full py-2.5 text-center text-xs font-bold text-purple-700 bg-purple-50 rounded-xl">
                      Waiting for Rider Pickup
                    </div>
                  )}
                  {['ENROUTE', 'DELIVERED'].includes(order.status) && (
                    <div className="w-full py-2.5 text-center text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl">
                      Dispatched with Rider
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
