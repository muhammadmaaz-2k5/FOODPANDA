'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { MapPin, CreditCard, Tag, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, subtotal, clearCart } = useCart();
  const { user } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [deliveryTier, setDeliveryTier] = useState('STANDARD');
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAddresses = async () => {
      try {
        const res = await api.get('/users/addresses');
        if (res.data.success && res.data.data?.length > 0) {
          setAddresses(res.data.data);
          const defaultAddr = res.data.data.find((a) => a.isDefault) || res.data.data[0];
          setSelectedAddressId(defaultAddr.id);
        }
      } catch (err) {
        console.error('Error fetching addresses:', err.message);
      }
    };
    loadAddresses();
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    setCouponError('');
    setCouponSuccess('');
    try {
      const res = await api.post('/marketing/coupons/validate', {
        code: couponCode,
        restaurantId: cart?.restaurantId,
        subtotal: parseFloat(subtotal),
      });
      if (res.data.success) {
        setDiscountAmount(res.data.data.discountAmount);
        setCouponSuccess(`Coupon applied: $${res.data.data.discountAmount.toFixed(2)} discount!`);
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      alert('Please select a delivery address');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        restaurantId: cart.restaurantId,
        deliveryAddressId: selectedAddressId,
        type: 'DELIVERY',
        deliveryTier,
        paymentMethod,
        couponCode: couponSuccess ? couponCode : undefined,
        deliveryInstructions: instructions,
      };

      const res = await api.post('/orders/checkout', payload);
      if (res.data.success) {
        await clearCart();
        router.push(`/orders/${res.data.data.id}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const deliveryFee = deliveryTier === 'EXPRESS' ? 4.99 : 2.99;
  const tax = ((parseFloat(subtotal) - discountAmount) * 0.05).toFixed(2);
  const finalTotal = (parseFloat(subtotal) + deliveryFee - discountAmount + parseFloat(tax)).toFixed(2);

  if (!cart?.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-md mx-auto p-12 text-center">
          <p className="text-xl font-bold text-slate-800">Your basket is empty</p>
          <button
            onClick={() => router.push('/')}
            className="mt-4 foodpanda-btn px-6 py-2.5 rounded-xl font-bold text-sm"
          >
            Explore Restaurants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-8">Review & Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Delivery Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Delivery Address */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <MapPin className="w-5 h-5 text-[#d70f64]" />
                <h3>Delivery Address</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                      selectedAddressId === addr.id
                        ? 'border-[#d70f64] bg-rose-50/40 font-semibold text-slate-900'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <div>
                      <span className="text-xs uppercase tracking-wider font-extrabold text-[#d70f64]">
                        {addr.label || 'Home'}
                      </span>
                      <p className="text-sm mt-1">{addr.line1}</p>
                      <p className="text-xs text-slate-400">{addr.city}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Delivery note (e.g. Leave at the doorstep, call on arrival)"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-[#d70f64]"
                />
              </div>
            </div>

            {/* 2. Delivery Speed */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900">Delivery Speed</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setDeliveryTier('STANDARD')}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    deliveryTier === 'STANDARD'
                      ? 'border-[#d70f64] bg-rose-50/40 text-slate-900 font-bold'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex justify-between">
                    <span>Standard Delivery</span>
                    <span>$2.99</span>
                  </div>
                  <p className="text-xs text-slate-400 font-normal mt-1">25 - 35 mins</p>
                </label>

                <label
                  onClick={() => setDeliveryTier('EXPRESS')}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    deliveryTier === 'EXPRESS'
                      ? 'border-[#d70f64] bg-rose-50/40 text-slate-900 font-bold'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="flex justify-between">
                    <span>⚡ Priority Express</span>
                    <span>$4.99</span>
                  </div>
                  <p className="text-xs text-slate-400 font-normal mt-1">15 - 20 mins (Direct to you)</p>
                </label>
              </div>
            </div>

            {/* 3. Payment Method */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold">
                <CreditCard className="w-5 h-5 text-[#d70f64]" />
                <h3>Payment Method</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {['CARD', 'CASH'].map((m) => (
                  <label
                    key={m}
                    onClick={() => setPaymentMethod(m)}
                    className={`p-4 rounded-2xl border cursor-pointer transition text-center ${
                      paymentMethod === m
                        ? 'border-[#d70f64] bg-rose-50/40 text-[#d70f64] font-bold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {m === 'CARD' ? '💳 Credit / Debit Card' : '💵 Cash on Delivery'}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary & Pay */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-bold text-slate-900 text-lg border-b border-slate-100 pb-3">Order Summary</h3>

              {/* Items preview */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cart.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs text-slate-600">
                    <span>{item.quantity}x {item.foodItem?.name}</span>
                    <span className="font-semibold text-slate-800">${((item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Coupon input */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon code (e.g. WELCOME50)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 text-xs border rounded-xl border-slate-200 uppercase font-semibold"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs font-bold hover:bg-slate-800"
                  >
                    Apply
                  </button>
                </div>
                {couponSuccess && <p className="text-xs text-emerald-600 font-semibold">{couponSuccess}</p>}
                {couponError && <p className="text-xs text-rose-600">{couponError}</p>}
              </div>

              {/* Cost calculations */}
              <div className="space-y-2 text-xs border-t border-slate-100 pt-3 text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${parseFloat(subtotal).toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>${deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (5%)</span>
                  <span>${tax}</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span className="text-[#d70f64]">${finalTotal}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={loading}
                className="foodpanda-btn w-full py-3.5 rounded-2xl font-bold text-white shadow-lg text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Processing Order...' : `Place Order • $${finalTotal}`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
