'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import api from '@/lib/api';
import { ShoppingBag, Star, Clock, ChevronRight, RotateCcw, MapPin, Heart, Plus, Trash2 } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [activeTab, setActiveTab] = useState('ORDERS'); // 'ORDERS', 'FAVORITES', 'ADDRESSES'
  const [loading, setLoading] = useState(true);

  // Review Modal state
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState('');

  // New Address form
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [addrLabel, setAddrLabel] = useState('Home');
  const [addrLine, setAddrLine] = useState('');
  const [addrCity, setAddrCity] = useState('Metro City');

  const fetchData = async () => {
    try {
      const [ordersRes, favRes, addrRes] = await Promise.all([
        api.get('/orders'),
        api.get('/reviews/favorites/my'),
        api.get('/users/addresses'),
      ]);

      if (ordersRes.data.success) setOrders(ordersRes.data.data);
      if (favRes.data.success) setFavorites(favRes.data.data);
      if (addrRes.data.success) setAddresses(addrRes.data.data);
    } catch (err) {
      console.error('Error fetching account data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrderForReview) return;

    try {
      setReviewSubmitting(true);
      const res = await api.post('/reviews', {
        restaurantId: selectedOrderForReview.restaurantId,
        orderId: selectedOrderForReview.id,
        rating,
        comment,
      });

      if (res.data.success) {
        setReviewSuccess('Review published successfully! Thank you for your feedback.');
        setTimeout(() => {
          setSelectedOrderForReview(null);
          setReviewSuccess('');
          setComment('');
        }, 1800);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!addrLine) return;
    try {
      const res = await api.post('/users/addresses', {
        label: addrLabel,
        line1: addrLine,
        city: addrCity,
        postalCode: '10001',
        latitude: 14.605,
        longitude: 120.990,
      });
      if (res.data.success) {
        setIsAddressModalOpen(false);
        setAddrLine('');
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add address');
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      const res = await api.delete(`/users/addresses/${id}`);
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      alert('Error deleting address');
    }
  };

  return (
    <DashboardLayout role="CUSTOMER" title="My Orders & Profile Hub">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Profile Tabs */}
        <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex gap-2 text-xs font-bold">
            <button
              onClick={() => setActiveTab('ORDERS')}
              className={`px-4 py-2.5 rounded-2xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ORDERS'
                  ? 'bg-[#d70f64] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4" /> Order History ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('FAVORITES')}
              className={`px-4 py-2.5 rounded-2xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'FAVORITES'
                  ? 'bg-[#d70f64] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Heart className="w-4 h-4" /> Saved Favorites ({favorites.length})
            </button>
            <button
              onClick={() => setActiveTab('ADDRESSES')}
              className={`px-4 py-2.5 rounded-2xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ADDRESSES'
                  ? 'bg-[#d70f64] text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MapPin className="w-4 h-4" /> Addresses ({addresses.length})
            </button>
          </div>
        </div>

        {/* 1. ORDERS LIST */}
        {activeTab === 'ORDERS' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No orders yet</p>
                <p className="text-xs text-slate-400 mt-1">Discover top restaurants and order delicious food.</p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-md transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-[#d70f64]">#{order.orderNumber}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        order.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-base text-slate-900">{order.restaurant?.name}</h3>
                    <p className="text-xs text-slate-400">
                      {order.items?.map((i) => `${i.quantity}x ${i.name || i.foodItem?.name || 'Dish Item'}`).join(', ')}
                    </p>
                    <p className="text-xs font-bold text-slate-700 pt-1">
                      Total: <span className="text-[#d70f64]">${(Number(order.total) || 0).toFixed(2)}</span> • {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/orders/${order.id}`}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition"
                    >
                      Track Order
                    </Link>
                    {order.status === 'DELIVERED' && (
                      <button
                        onClick={() => setSelectedOrderForReview(order)}
                        className="foodpanda-btn px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer flex items-center gap-1"
                      >
                        <Star className="w-3.5 h-3.5 fill-white" /> Rate Order
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* 2. FAVORITES */}
        {activeTab === 'FAVORITES' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favorites.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-500">
                <Heart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No favorite spots saved yet</p>
              </div>
            ) : (
              favorites.map((fav) => (
                <Link
                  key={fav.id}
                  href={`/restaurant/${fav.restaurantId}`}
                  className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-center shadow-xs hover:border-[#d70f64] transition"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{fav.restaurant?.name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">★ {fav.restaurant?.rating || 4.8} ({fav.restaurant?.ratingCount || 100}+ reviews)</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              ))
            )}
          </div>
        )}

        {/* 3. ADDRESSES */}
        {activeTab === 'ADDRESSES' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-base">Saved Delivery Spots</h3>
              <button
                onClick={() => setIsAddressModalOpen(true)}
                className="foodpanda-btn px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Add Address
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {addresses.map((addr) => (
                <div key={addr.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex justify-between items-start shadow-xs">
                  <div>
                    <span className="text-xs uppercase font-extrabold text-[#d70f64]">{addr.label || 'Home'}</span>
                    <p className="text-sm font-bold text-slate-800 mt-1">{addr.line1}</p>
                    <p className="text-xs text-slate-400">{addr.city}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Review & Star Rating Modal */}
      {selectedOrderForReview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Review {selectedOrderForReview.restaurant?.name}</h3>
                <p className="text-xs text-slate-500">Order #{selectedOrderForReview.orderNumber}</p>
              </div>
              <button onClick={() => setSelectedOrderForReview(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            {reviewSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-2xl text-center">
                {reviewSuccess}
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="text-center space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Rate your experience</span>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="text-2xl cursor-pointer transition transform hover:scale-125"
                      >
                        <Star className={`w-8 h-8 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Comment / Feedback</label>
                  <textarea
                    required
                    placeholder="Food quality, packing, taste highlights..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-[#d70f64]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="foodpanda-btn w-full py-3 rounded-xl font-bold text-white text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  {reviewSubmitting ? 'Posting...' : 'Submit Rating'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Add Address Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900">Add New Address</h3>
              <button onClick={() => setIsAddressModalOpen(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Label</label>
                <select
                  value={addrLabel}
                  onChange={(e) => setAddrLabel(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm"
                >
                  <option value="Home">Home</option>
                  <option value="Office / Work">Office / Work</option>
                  <option value="Gym">Gym</option>
                  <option value="Partner's House">Partner's House</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apt 4B, 123 Sunshine Boulevard"
                  value={addrLine}
                  onChange={(e) => setAddrLine(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-[#d70f64]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">City</label>
                <input
                  type="text"
                  required
                  value={addrCity}
                  onChange={(e) => setAddrCity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-[#d70f64]"
                />
              </div>

              <button
                type="submit"
                className="foodpanda-btn w-full py-3 rounded-xl font-bold text-white text-xs shadow-md cursor-pointer"
              >
                Save Delivery Address
              </button>
            </form>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
