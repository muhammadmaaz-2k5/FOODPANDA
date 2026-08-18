'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { User, Mail, Lock, Phone, Store, Bike, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [roleName, setRoleName] = useState('CUSTOMER'); // 'CUSTOMER', 'RESTAURANT_OWNER', 'RIDER'
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const authUser = await register({
        firstName,
        lastName,
        email,
        phone,
        password,
        roleName,
      });

      if (roleName === 'ADMIN') router.push('/admin');
      else if (roleName === 'RESTAURANT_OWNER') router.push('/vendor');
      else if (roleName === 'RIDER') router.push('/rider');
      else router.push('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#d70f64] flex items-center justify-center text-white font-black text-2xl shadow-sm">
              🐼
            </div>
            <span className="text-2xl font-black text-[#d70f64] tracking-tight">foodpanda</span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900 pt-2">Create Account</h2>
          <p className="text-xs text-slate-500">Choose your account type to get started.</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setRoleName('CUSTOMER')}
            className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
              roleName === 'CUSTOMER' ? 'bg-white text-[#d70f64] shadow-xs' : 'text-slate-500'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Customer
          </button>
          <button
            type="button"
            onClick={() => setRoleName('RESTAURANT_OWNER')}
            className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
              roleName === 'RESTAURANT_OWNER' ? 'bg-white text-amber-700 shadow-xs' : 'text-slate-500'
            }`}
          >
            <Store className="w-3.5 h-3.5" /> Partner
          </button>
          <button
            type="button"
            onClick={() => setRoleName('RIDER')}
            className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 ${
              roleName === 'RIDER' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500'
            }`}
          >
            <Bike className="w-3.5 h-3.5" /> Rider
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">First Name</label>
              <input
                type="text"
                required
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-[#d70f64]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Last Name</label>
              <input
                type="text"
                required
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-[#d70f64]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-[#d70f64]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Phone Number</label>
            <div className="relative flex items-center">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="tel"
                required
                placeholder="+1 234 567 890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-[#d70f64]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-[#d70f64]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="foodpanda-btn w-full py-3 rounded-xl font-bold text-white shadow-md text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : `Register as ${roleName === 'CUSTOMER' ? 'Customer' : roleName === 'RESTAURANT_OWNER' ? 'Partner' : 'Rider'}`}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="text-[#d70f64] font-bold hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
