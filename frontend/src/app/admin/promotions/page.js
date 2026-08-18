'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
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
  const [bannerImage, setBannerImage] = useState('');
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);

  const fetchPromotions = async () => {
    try {
      const [bannerRes, couponRes] = await Promise.all([
        api.get('/marketing/banners'),
        api.get('/marketing/coupons').catch(() => ({ data: { success: true, data: [] } })),
      ]);
      if (bannerRes.data?.success) setBanners(bannerRes.data.data || []);
      if (couponRes.data?.success) setCoupons(couponRes.data.data || []);
    } catch (err) {
      console.error('Error fetching promotions:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleBannerImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'vendor-food');

    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dlrbonrhc';
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setBannerImage(data.secure_url);
      }
    } catch (err) {
      alert('Banner image upload failed: ' + err.message);
    } finally {
      setUploadingBanner(false);
    }
  };

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
        fetchPromotions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      const res = await api.delete(`/marketing/coupons/${couponId}`);
      if (res.data.success) {
        fetchPromotions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete coupon');
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
        imageUrl: bannerImage || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836',
        position: 'TOP',
        isActive: true,
      });

      if (res.data.success) {
        setIsBannerModalOpen(false);
        setBannerTitle('');
        setBannerSubtitle('');
        setBannerImage('');
        fetchPromotions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create banner');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBanner = async (bannerId) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      const res = await api.delete(`/marketing/banners/${bannerId}`);
      if (res.data.success) {
        fetchPromotions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete banner');
    }
  };

  return (
    <DashboardLayout role="ADMIN" title="Campaigns & Promotional Coupons">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-xl font-black text-slate-900">Campaigns & Promo Control</h2>
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
          {banners.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200 text-center text-slate-400 text-sm">
              No promotional banners active. Click "+ Add Banner" to create one.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {banners.map((b) => (
                <div
                  key={b.id}
                  className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md p-6 flex justify-between items-center group"
                >
                  {b.imageUrl && (
                    <img
                      src={b.imageUrl}
                      alt={b.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                    />
                  )}
                  <div className="relative z-10 space-y-1">
                    <span className="text-[10px] font-extrabold uppercase bg-white/25 px-2 py-0.5 rounded backdrop-blur-xs">
                      {b.placement || 'Storefront Hero'}
                    </span>
                    <h4 className="text-lg font-black mt-1">{b.title}</h4>
                    <p className="text-xs text-amber-100">{b.subtitle || 'Active Campaign'}</p>
                  </div>
                  <div className="relative z-10 flex items-center gap-3">
                    <button
                      onClick={() => handleDeleteBanner(b.id)}
                      className="p-2 bg-white/20 hover:bg-rose-600 rounded-xl text-white backdrop-blur-xs transition cursor-pointer"
                      title="Delete Banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coupons List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-4">
          <h2 className="text-lg font-black text-slate-900">Active Platform Coupons ({coupons.length})</h2>
          {coupons.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 text-center text-slate-400 text-sm">
              No custom coupons created yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {coupons.map((c) => (
                <div key={c.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-[#d70f64]">{c.code}</span>
                    <p className="text-sm font-bold text-slate-800">
                      {c.type === 'PERCENTAGE' ? `${c.value}% Off` : c.type === 'FREE_DELIVERY' ? 'Free Delivery' : `$${c.value} Flat Off`}
                    </p>
                    <p className="text-[11px] text-slate-400">Min Order: ${c.minOrderValue?.toFixed(2)} • Active</p>
                  </div>
                  <button
                    onClick={() => handleDeleteCoupon(c.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition cursor-pointer"
                    title="Delete Coupon"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

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

              {/* Cloudinary Banner Image Uploader */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Banner Background Image (Cloudinary)</label>
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 rounded-xl border border-dashed border-slate-300 hover:border-purple-600 bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer transition">
                    <Megaphone className="w-4 h-4 text-purple-600" />
                    {uploadingBanner ? 'Uploading...' : 'Upload Image'}
                    <input type="file" accept="image/*" onChange={handleBannerImageUpload} className="hidden" />
                  </label>
                  {bannerImage && (
                    <img src={bannerImage} alt="Preview" className="w-12 h-8 rounded-lg object-cover border border-slate-200" />
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || uploadingBanner}
                className="w-full py-3 rounded-xl bg-purple-900 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Publish Banner'}
              </button>
            </form>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
