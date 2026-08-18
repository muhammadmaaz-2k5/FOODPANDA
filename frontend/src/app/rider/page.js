'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import api from '@/lib/api';
import {
  Bike,
  Navigation,
  MapPin,
  CheckCircle2,
  PackageCheck,
  Phone,
  ArrowUpRight,
  DollarSign,
  Award,
  Zap,
  TrendingUp,
  RotateCcw,
  Check,
  ChevronRight
} from 'lucide-react';

export default function RiderDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [profile, setProfile] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [earnings, setEarnings] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [activeTab, setActiveTab] = useState('DISPATCH'); // 'DISPATCH' or 'EARNINGS'
  const [loading, setLoading] = useState(true);

  // GPS Simulation / Live Broadcast
  const [simulatingGps, setSimulatingGps] = useState(false);
  const [currentCoords, setCurrentCoords] = useState({ lat: 14.5995, lng: 120.9842 });
  const gpsIntervalRef = useRef(null);

  // Cash Collection Modal
  const [showCodModal, setShowCodModal] = useState(false);

  const fetchRiderData = async () => {
    try {
      const [profileRes, availableRes, ordersRes, earningsRes] = await Promise.all([
        api.get('/riders/profile'),
        api.get('/riders/deliveries/available'),
        api.get('/orders'),
        api.get('/riders/earnings/summary').catch(() => ({ data: { success: true, data: null } })),
      ]);

      if (profileRes.data.success) {
        setProfile(profileRes.data.data);
        setIsOnline(profileRes.data.data.status === 'AVAILABLE');
      }
      if (availableRes.data.success) setAvailableJobs(availableRes.data.data || []);

      if (ordersRes.data.success) {
        const ongoing = ordersRes.data.data.find((o) =>
          ['ACCEPTED', 'PREPARING', 'READY', 'ENROUTE'].includes(o.status)
        );
        setActiveJob(ongoing || null);
      }

      if (earningsRes.data?.success && earningsRes.data.data) {
        setEarnings(earningsRes.data.data);
      }
    } catch (err) {
      console.error('Rider data error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiderData();
  }, []);

  // Continuous GPS Broadcaster when Enroute
  useEffect(() => {
    if (activeJob && activeJob.status === 'ENROUTE') {
      setSimulatingGps(true);
      gpsIntervalRef.current = setInterval(async () => {
        setCurrentCoords((prev) => {
          const nextLat = prev.lat + 0.0003;
          const nextLng = prev.lng + 0.0003;

          // Broadcast to Backend & WebSockets
          api.post('/riders/location', {
            latitude: nextLat,
            longitude: nextLng,
            orderId: activeJob.id,
          }).catch((err) => console.error('GPS broadcast err:', err.message));

          return { lat: nextLat, lng: nextLng };
        });
      }, 4000);
    } else {
      setSimulatingGps(false);
      if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
    }

    return () => {
      if (gpsIntervalRef.current) clearInterval(gpsIntervalRef.current);
    };
  }, [activeJob]);

  const toggleStatus = async () => {
    const newStatus = isOnline ? 'OFFLINE' : 'AVAILABLE';
    try {
      const res = await api.patch('/riders/status', { status: newStatus });
      if (res.data.success) {
        setIsOnline(newStatus === 'AVAILABLE');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleAcceptJob = async (orderId) => {
    try {
      const res = await api.post('/riders/deliveries/accept', { orderId });
      if (res.data.success) {
        fetchRiderData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error accepting delivery job');
    }
  };

  const handleMarkPickup = async (orderId) => {
    try {
      const res = await api.patch(`/riders/orders/${orderId}/pickup`);
      if (res.data.success) {
        fetchRiderData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error marking pickup');
    }
  };

  const handleMarkDelivered = async (orderId) => {
    try {
      const res = await api.patch(`/riders/orders/${orderId}/deliver`);
      if (res.data.success) {
        setShowCodModal(false);
        fetchRiderData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error marking delivery');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-6">
        {/* Status Bar */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xl">
              🛵
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">Rider Hub: {user?.firstName || 'Rider'}</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 text-slate-700">
                  {profile?.vehicleType || 'Motorcycle'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Shift Status:{' '}
                <strong className={isOnline ? 'text-emerald-600' : 'text-slate-400'}>
                  {isOnline ? '🟢 Online & Ready for Orders' : '⚪ Offline'}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleStatus}
              className={`px-5 py-2.5 rounded-2xl font-bold text-xs shadow-xs transition cursor-pointer ${
                isOnline
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isOnline ? 'Go Offline' : 'Start Shift (Go Online)'}
            </button>
          </div>
        </div>

        {/* Tab Selector (Jobs Dispatch vs Earnings Wallet) */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-xs gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('DISPATCH')}
            className={`flex-1 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'DISPATCH'
                ? 'bg-[#d70f64] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Zap className="w-4 h-4" /> Live Dispatch & Active Trip
          </button>
          <button
            onClick={() => setActiveTab('EARNINGS')}
            className={`flex-1 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'EARNINGS'
                ? 'bg-[#d70f64] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <DollarSign className="w-4 h-4" /> Earnings & Shift Payouts
          </button>
        </div>

        {/* 1. DISPATCH VIEW */}
        {activeTab === 'DISPATCH' && (
          <div className="space-y-6">
            {/* Active Delivery HUD */}
            {activeJob ? (
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs uppercase mb-2">
                      <Zap className="w-3.5 h-3.5 text-emerald-400" /> Active Trip in Progress
                    </div>
                    <h2 className="text-2xl font-black">Order #{activeJob.orderNumber}</h2>
                    <p className="text-xs text-slate-300 mt-1">
                      Status: <strong className="text-emerald-400 font-black uppercase">{activeJob.status}</strong>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-emerald-400">
                      ${activeJob.total?.toFixed(2)}
                    </span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {activeJob.paymentMethod === 'CASH_ON_DELIVERY' ? '💵 Collect Cash' : '💳 Paid Online'}
                    </p>
                  </div>
                </div>

                {/* GPS Broadcasting Status Indicator */}
                {simulatingGps && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-2xl text-xs text-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Transmitting live GPS telemetry to customer...</span>
                    </div>
                    <span className="font-mono text-[11px] text-emerald-400">
                      {currentCoords.lat.toFixed(4)}, {currentCoords.lng.toFixed(4)}
                    </span>
                  </div>
                )}

                {/* Pickup & Dropoff Route Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-300">
                      Step 1: Restaurant Pickup
                    </span>
                    <h4 className="font-bold text-sm text-white">{activeJob.restaurant?.name}</h4>
                    <p className="text-xs text-slate-400">{activeJob.restaurant?.address || 'Downtown Center'}</p>
                  </div>

                  <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      Step 2: Customer Dropoff
                    </span>
                    <h4 className="font-bold text-sm text-white">{activeJob.deliveryAddress?.line1 || 'Customer Destination'}</h4>
                    <p className="text-xs text-slate-400">{activeJob.deliveryAddress?.city || 'Metro City'}</p>
                  </div>
                </div>

                {/* 1-Tap Action Flow */}
                <div className="pt-2">
                  {activeJob.status === 'READY' || activeJob.status === 'PREPARING' || activeJob.status === 'ACCEPTED' ? (
                    <button
                      onClick={() => handleMarkPickup(activeJob.id)}
                      className="foodpanda-btn w-full py-4 rounded-2xl text-sm font-black text-white shadow-lg cursor-pointer flex items-center justify-center gap-2"
                    >
                      <PackageCheck className="w-5 h-5" /> Confirm Food Picked Up from Kitchen
                    </button>
                  ) : activeJob.status === 'ENROUTE' ? (
                    <button
                      onClick={() => {
                        if (activeJob.paymentMethod === 'CASH_ON_DELIVERY') {
                          setShowCodModal(true);
                        } else {
                          handleMarkDelivered(activeJob.id);
                        }
                      }}
                      className="w-full py-4 rounded-2xl text-sm font-black bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg cursor-pointer flex items-center justify-center gap-2 transition"
                    >
                      <CheckCircle2 className="w-5 h-5" /> Complete Dropoff & Mark Delivered
                    </button>
                  ) : (
                    <div className="p-3 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-2xl text-center">
                      Order completed! Ready for next request.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
                <Bike className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <h3 className="font-bold text-slate-700 text-base">No active trip currently</h3>
                <p className="text-xs text-slate-400 mt-1">Accept available delivery jobs below to start earning.</p>
              </div>
            )}

            {/* Available Deliveries Queue */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-slate-900 text-lg">
                  Available Delivery Requests ({availableJobs.length})
                </h3>
                <button onClick={fetchRiderData} className="text-xs font-bold text-[#d70f64] hover:underline cursor-pointer">
                  Refresh Feed
                </button>
              </div>

              {availableJobs.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-400">
                  No nearby jobs waiting right now. Keep your app online.
                </div>
              ) : (
                availableJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-slate-900">Order #{job.orderNumber}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          {job.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-slate-900">{job.restaurant?.name}</h4>
                      <p className="text-xs text-slate-500">
                        Dropoff: <strong className="text-slate-800">{job.deliveryAddress?.line1 || 'Customer Address'}</strong>
                      </p>
                      <p className="text-xs font-black text-emerald-600 pt-1">
                        Est. Payout: $4.50 + Tips • {job.paymentMethod}
                      </p>
                    </div>

                    <button
                      onClick={() => handleAcceptJob(job.id)}
                      className="foodpanda-btn px-6 py-3 rounded-2xl text-xs font-bold text-white shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      Accept Job <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 2. EARNINGS & WALLET VIEW */}
        {activeTab === 'EARNINGS' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Today's Earnings</span>
                <h3 className="text-3xl font-black text-slate-900">${earnings?.todayEarnings || '42.50'}</h3>
                <p className="text-xs text-emerald-600 font-bold">8 Completed Trips</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Weekly Total</span>
                <h3 className="text-3xl font-black text-[#d70f64]">${earnings?.weekEarnings || '285.00'}</h3>
                <p className="text-xs text-slate-500 font-semibold">48 Trips Completed</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-1">
                <span className="text-xs font-bold text-slate-400 uppercase">Rider Rating</span>
                <h3 className="text-3xl font-black text-amber-500">★ {profile?.rating || '4.95'}</h3>
                <p className="text-xs text-slate-500 font-semibold">Top Courier Tier</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h4 className="font-black text-slate-900 text-base">Recent Delivery Payouts</h4>
              <div className="divide-y divide-slate-100 text-xs">
                {[
                  { id: '101', time: '12:30 PM', rest: 'Panda Burger Grill', payout: '$5.50', status: 'PAID' },
                  { id: '102', time: '11:45 AM', rest: 'Tokyo Ramen Hub', payout: '$6.00', status: 'PAID' },
                  { id: '103', time: '10:15 AM', rest: 'Italian Pizza Oven', payout: '$4.50', status: 'PAID' },
                ].map((item) => (
                  <div key={item.id} className="py-3.5 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-800">{item.rest}</p>
                      <p className="text-slate-400 text-[11px]">{item.time} • Base + Delivery Distance</p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-600 text-sm">{item.payout}</span>
                      <span className="block text-[10px] text-slate-400 font-bold">{item.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Cash on Delivery Confirmation Modal */}
      {showCodModal && activeJob && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 sm:p-8 space-y-6 shadow-2xl text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl">
              💵
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">Cash on Delivery</h3>
              <p className="text-xs text-slate-500 mt-1">Please collect the exact cash payment from the customer before completing the order.</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
              <span className="text-xs font-bold text-amber-800">Amount to Collect</span>
              <h2 className="text-3xl font-black text-amber-900 mt-0.5">${activeJob.total?.toFixed(2)}</h2>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCodModal(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleMarkDelivered(activeJob.id)}
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Cash Collected ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
