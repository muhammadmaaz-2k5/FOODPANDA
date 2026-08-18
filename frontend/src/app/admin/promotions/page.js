'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import api from '@/lib/api';
import { ShieldCheck, Tag, Plus, Check, Trash2, ArrowLeft, Percent, Gift, Megaphone } from 'lucide-react';

export default function AdminPromotionsPage() {
  const [coupons, setCoupons] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Coupon Form
  const [code, setCode] = useState('');
  const [type, setType] = useState('PERCENTAGE');
  const [value, setValue] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('15');
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Banner Form
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  const fetchPromotions = async () => {
    try {
      const [bannerRes] = await Promise.all([
        api.get('/marketing/banners'),
      ]);
      if (bannerRes.data.success) setBanners(bannerRes.data.data);
    } catch (err) {
      console.error('Error fetching promotions:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!code || !value) return;

    try {
      setSubmitting(true);
      const res = await api.post('/marketing/coupons', {
        code: code.toUpperCase(),
        type,
        value: parseFloat(value),
        minOrderValue: parseFloat(minOrderValue),
        startDate: new Date(),
        maxUsage: 1000,
        maxUsagePerUser: 3,
      });

      if (res.data.success) {
        setIsCouponModalOpen(false);
        setCode('');
        setValue('');
        alert('Coupon created successfully!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBanner = async (e) => {
    e.preventDefault();
    if (!bannerTitle) return;

    try {
      setSubmitting(true);
      const res = await api.post('/marketing/banners', {
        title: bannerTitle,
        subtitle: bannerSubtitle,
        imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
        position: 'TOP',
        isActive: true,
      });

      if (res.data.success) {
        setIsBannerModalOpen(false);
        setBannerTitle('');
        setBannerSubtitle('');
        fetchPromotions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create banner');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Admin Overview
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Campaigns & Promo Control</h1>
            <p className="text-xs text-slate-500 mt-1">Configure global discount promo codes, flash deals, and storefront hero banners.</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsCouponModalOpen(true)}
              className="foodpanda-btn px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md text-white"
            >
              <Tag className="w-3.5 h-3.5" /> Create Coupon
            </button>
            <button
              onClick={() => setIsBannerModalOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Megaphone className="w-3.5 h-3.5" /> Add Banner
            </button>
          </div>
        </div>

        {/* Banners Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-slate-900">Active Promotional Banners ({banners.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((b) => (
              <div key={b.id} className="p-6 rounded-3xl bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-extrabold uppercase bg-white/20 px-2 py-0.5 rounded">Storefront Hero</span>
                  <h4 className="text-lg font-black mt-1">{b.title}</h4>
                  <p className="text-xs text-amber-100">{b.subtitle}</p>
                </div>
                <div className="text-3xl">🎉</div>
              </div>
            ))}
          </div>
        </div>

        {/* Coupons List Preset */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h2 className="text-lg font-black text-slate-900">Active Platform Coupons</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-xs font-black text-[#d70f64]">WELCOME50</span>
              <p className="text-sm font-bold text-slate-800">50% Off First Order</p>
              <p className="text-[11px] text-slate-400">Min Order: $20.00 • Active</p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-xs font-black text-[#d70f64]">FREEDELIVERY</span>
              <p className="text-sm font-bold text-slate-800">Free Delivery</p>
              <p className="text-[11px] text-slate-400">Min Order: $15.00 • Active</p>
            </div>
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-1">
              <span className="text-xs font-black text-[#d70f64]">FLAT10</span>
              <p className="text-sm font-bold text-slate-800">$10.00 Flat Discount</p>
              <p className="text-[11px] text-slate-400">Min Order: $30.00 • Active</p>
            </div>
          </div>
        </div>
      </main>

      {/* Create Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">Create Platform Coupon</h3>
              <button onClick={() => setIsCouponModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Coupon Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SUMMER25"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm uppercase font-bold focus:outline-[#d70f64]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Discount Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount ($)</option>
                    <option value="FREE_DELIVERY">Free Delivery</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Discount Value</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="25"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-[#d70f64]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Min Order Value ($)</label>
                <input
                  type="number"
                  required
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-[#d70f64]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="foodpanda-btn w-full py-3 rounded-xl font-bold text-white text-xs shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Publish Coupon'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Banner Modal */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">Add Hero Banner</h3>
              <button onClick={() => setIsBannerModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateBanner} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Banner Headline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Delivery Weekend!"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-[#d70f64]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Subtitle</label>
                <input
                  type="text"
                  placeholder="e.g. Use code FREEDELIVERY on all orders above $15"
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-[#d70f64]"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-purple-900 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Publish Banner'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
