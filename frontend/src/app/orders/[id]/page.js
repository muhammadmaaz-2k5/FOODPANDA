'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useSocket } from '@/context/SocketContext';
import api from '@/lib/api';
import { CheckCircle2, Clock, ChefHat, Bike, PackageCheck, MapPin, Phone } from 'lucide-react';

const STATUS_STEPS = [
  { key: 'PENDING', label: 'Order Placed', desc: 'Waiting for restaurant confirmation', icon: Clock },
  { key: 'ACCEPTED', label: 'Order Accepted', desc: 'Kitchen received your ticket', icon: CheckCircle2 },
  { key: 'PREPARING', label: 'Preparing Food', desc: 'Chef is cooking your meal fresh', icon: ChefHat },
  { key: 'READY', label: 'Ready for Pickup', desc: 'Dispatched to nearby rider', icon: PackageCheck },
  { key: 'ENROUTE', label: 'Out for Delivery', desc: 'Rider is zooming to your location', icon: Bike },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Bon appétit!', icon: CheckCircle2 },
];

export default function OrderTrackingPage() {
  const { id } = useParams();
  const { socket, joinOrderRoom } = useSocket();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch (err) {
      console.error('Fetch order error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchOrder();
      joinOrderRoom(id);
    }
  }, [id]);

  useEffect(() => {
    if (!socket) return;

    socket.on('order_status_changed', (data) => {
      if (data.orderId === id) {
        fetchOrder();
      }
    });

    return () => {
      socket.off('order_status_changed');
    };
  }, [socket, id]);

  if (loading || !order) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-3xl mx-auto p-12 text-center">
          <div className="w-12 h-12 rounded-full border-4 border-[#d70f64] border-t-transparent animate-spin mx-auto mb-4" />
          <p className="font-bold text-slate-700">Connecting to live tracking...</p>
        </div>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        {/* Order Header Summary */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-[#d70f64] font-black text-xs uppercase tracking-wider mb-2">
              Live Order Status
            </div>
            <h1 className="text-2xl font-black text-slate-900">Order #{order.orderNumber}</h1>
            <p className="text-xs text-slate-500 mt-1">
              From <strong className="text-slate-800">{order.restaurant?.name}</strong> • Estimated {order.estimatedDeliveryTime || 30} mins
            </p>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black text-[#d70f64]">${order.total?.toFixed(2)}</span>
            <p className="text-xs text-slate-400 mt-0.5">{order.paymentMethod} • {order.paymentStatus}</p>
          </div>
        </div>

        {/* Real-Time Stepper Progress */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-lg font-black text-slate-900">Live Delivery Progress</h2>

          <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-100 space-y-8 my-4">
            {STATUS_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isPast = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;

              return (
                <div key={step.key} className="relative flex items-start gap-4">
                  {/* Dot icon */}
                  <div
                    className={`absolute -left-[35px] sm:-left-[43px] w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-[#d70f64] text-white ring-4 ring-rose-100 shadow-md scale-110'
                        : isPast
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1">
                    <h4 className={`text-sm font-black ${isPast ? 'text-slate-900' : 'text-slate-400'}`}>
                      {step.label} {isCurrent && <span className="text-[#d70f64] ml-2 text-xs animate-pulse">● In Progress</span>}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Items Detail */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">Items Ordered</h3>
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-sm">
                <div>
                  <span className="font-bold text-slate-800">{item.quantity}x {item.foodItem?.name}</span>
                  {item.variation && <p className="text-xs text-slate-400">Size: {item.variation.name}</p>}
                </div>
                <span className="font-bold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
