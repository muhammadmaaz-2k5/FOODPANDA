'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { Bike, Navigation, MapPin, CheckCircle2, PackageCheck, Phone, ArrowUpRight } from 'lucide-react';

export default function RiderDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [availableJobs, setAvailableJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchRiderData = async () => {
    try {
      const [profileRes, availableRes, ordersRes] = await Promise.all([
        api.get('/riders/profile'),
        api.get('/riders/deliveries/available'),
        api.get('/orders'),
      ]);

      if (profileRes.data.success) {
        setProfile(profileRes.data.data);
        setIsOnline(profileRes.data.data.status === 'AVAILABLE');
      }
      if (availableRes.data.success) setAvailableJobs(availableRes.data.data);

      if (ordersRes.data.success) {
        const ongoing = ordersRes.data.data.find(o => ['ACCEPTED', 'PREPARING', 'READY', 'ENROUTE'].includes(o.status));
        setActiveJob(ongoing || null);
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
        fetchRiderData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error marking delivery');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        
        {/* Rider Status Bar */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">{profile?.user?.firstName || 'Active Rider'}</h1>
              <p className="text-xs text-slate-500">{profile?.vehicleType || 'Motorcycle'} • Total Deliveries: {profile?.totalDeliveries || 48}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleStatus}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer ${
                isOnline
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                  : 'bg-slate-200 text-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-slate-400'}`} />
              {isOnline ? 'ONLINE & READY' : 'OFFLINE'}
            </button>
          </div>
        </div>

        {/* Active Delivery HUD */}
        {activeJob ? (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 sm:p-8 rounded-3xl shadow-xl space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold uppercase text-emerald-400 tracking-wider">Active Job in Progress</span>
                <h2 className="text-2xl font-black mt-1">Order #{activeJob.orderNumber}</h2>
                <p className="text-xs text-slate-300">From {activeJob.restaurant?.name}</p>
              </div>
              <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold">
                {activeJob.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-white/10 p-4 rounded-2xl">
              <div>
                <span className="text-slate-400 block font-semibold">Pickup Location:</span>
                <p className="font-bold text-white mt-0.5">{activeJob.restaurant?.name || 'Restaurant Spot'}</p>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Dropoff Address:</span>
                <p className="font-bold text-white mt-0.5">{activeJob.deliveryAddress?.line1 || 'Customer Address'}</p>
              </div>
            </div>

            <div className="flex gap-3">
              {['ACCEPTED', 'PREPARING', 'READY'].includes(activeJob.status) && (
                <button
                  onClick={() => handleMarkPickup(activeJob.id)}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4" /> Pick Up Order & Start Delivery
                </button>
              )}
              {activeJob.status === 'ENROUTE' && (
                <button
                  onClick={() => handleMarkDelivered(activeJob.id)}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/30"
                >
                  <CheckCircle2 className="w-4 h-4" /> Mark Order as Delivered
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-slate-900">Available Deliveries Nearby</h2>
            
            {availableJobs.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">
                <Navigation className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-sm text-slate-700">No unassigned orders right now</p>
                <p className="text-xs text-slate-400 mt-1">Keep your status online to receive new requests instantly.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableJobs.map((job) => (
                  <div
                    key={job.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs"
                  >
                    <div>
                      <span className="text-xs font-black text-[#d70f64]">#{job.orderNumber}</span>
                      <h4 className="font-bold text-slate-900 text-sm">{job.restaurant?.name}</h4>
                      <p className="text-xs text-slate-500">{job.deliveryAddress?.city || 'Downtown District'} • Total: ${job.total.toFixed(2)}</p>
                    </div>

                    <button
                      onClick={() => handleAcceptJob(job.id)}
                      className="foodpanda-btn px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      Accept Job <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
