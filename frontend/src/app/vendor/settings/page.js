'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import api from '@/lib/api';
import { Store, Clock, MapPin, DollarSign, Save, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function VendorSettingsPage() {
  const [restaurant, setRestaurant] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phone, setPhone] = useState('');
  const [deliveryTimeMin, setDeliveryTimeMin] = useState(25);
  const [deliveryTimeMax, setDeliveryTimeMax] = useState(35);
  const [minOrderAmount, setMinOrderAmount] = useState(10);
  const [status, setStatus] = useState('ACTIVE');
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/restaurants');
        const list = res.data?.data?.items || res.data?.data || [];
        if (list.length > 0) {
          const rest = list[0];
          setRestaurant(rest);
          setName(rest.name || '');
          setDescription(rest.description || '');
          setPhone(rest.phone || '');
          setDeliveryTimeMin(rest.deliveryTimeMin || 25);
          setDeliveryTimeMax(rest.deliveryTimeMax || 35);
          setMinOrderAmount(rest.minOrderAmount || 10);
          setStatus(rest.status || 'ACTIVE');
        }
      } catch (err) {
        console.error('Error loading settings:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!restaurant) return;

    try {
      const res = await api.patch(`/restaurants/${restaurant.id}/status`, { status });
      if (res.data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating settings');
    }
  };

  return (
    <DashboardLayout role="VENDOR" title="Kitchen Hours & Operational Settings">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-xl font-black text-slate-900">Restaurant Settings & Hours</h2>
            <p className="text-xs text-slate-500 mt-1">Configure kitchen operating state, prep benchmarks, and delivery minimums.</p>
          </div>

          <button
            onClick={handleSave}
            className="foodpanda-btn px-6 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md text-white"
          >
            <Save className="w-4 h-4" /> {saved ? 'Saved!' : 'Save Changes'}
          </button>
        </div>

        {saved && (
          <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Store configuration updated successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="space-y-4">
            <h3 className="font-black text-slate-900 text-base border-b border-slate-100 pb-3">Operational Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <label
                onClick={() => setStatus('ACTIVE')}
                className={`p-4 rounded-2xl border cursor-pointer transition text-center ${
                  status === 'ACTIVE'
                    ? 'border-emerald-500 bg-emerald-50/50 text-emerald-800 font-bold'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                🟢 Kitchen Open (Accepting Orders)
              </label>
              <label
                onClick={() => setStatus('INACTIVE')}
                className={`p-4 rounded-2xl border cursor-pointer transition text-center ${
                  status === 'INACTIVE'
                    ? 'border-rose-500 bg-rose-50/50 text-rose-800 font-bold'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                🔴 Kitchen Closed (Paused)
              </label>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-black text-slate-900 text-base border-b border-slate-100 pb-3">Delivery Estimates & Minimums</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Min Prep Time (mins)</label>
                <input
                  type="number"
                  value={deliveryTimeMin}
                  onChange={(e) => setDeliveryTimeMin(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-[#d70f64]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Max Prep Time (mins)</label>
                <input
                  type="number"
                  value={deliveryTimeMax}
                  onChange={(e) => setDeliveryTimeMax(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-[#d70f64]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Min Order Value ($)</label>
                <input
                  type="number"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-[#d70f64]"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
