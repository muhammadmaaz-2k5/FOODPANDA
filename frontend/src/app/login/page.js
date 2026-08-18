'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const authUser = await login(email, password);
      // Smart role-based redirect
      if (authUser.roles?.includes('ADMIN') || authUser.role?.name === 'ADMIN') {
        router.push('/admin');
      } else if (authUser.roles?.includes('RESTAURANT_OWNER') || authUser.role?.name === 'RESTAURANT_OWNER') {
        router.push('/vendor');
      } else if (authUser.roles?.includes('RIDER') || authUser.role?.name === 'RIDER') {
        router.push('/rider');
      } else {
        router.push('/');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#d70f64] flex items-center justify-center text-white font-black text-2xl shadow-sm">
              🐼
            </div>
            <span className="text-2xl font-black text-[#d70f64] tracking-tight">foodpanda</span>
          </Link>
          <h2 className="text-xl font-bold text-slate-900 pt-2">Welcome Back</h2>
          <p className="text-xs text-slate-500">Sign in to your account or try one of the demo roles below.</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-[#d70f64]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="foodpanda-btn w-full py-3 rounded-xl font-bold text-white shadow-md text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Logins */}
        <div className="border-t border-slate-100 pt-4 space-y-2 text-center">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">⚡ 1-Click Demo Accounts</p>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <button
              onClick={() => handleDemoLogin('customer@example.com')}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 cursor-pointer"
            >
              🛍️ Customer
            </button>
            <button
              onClick={() => handleDemoLogin('vendor@example.com')}
              className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 cursor-pointer"
            >
              🏪 Vendor
            </button>
            <button
              onClick={() => handleDemoLogin('rider@example.com')}
              className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 cursor-pointer"
            >
              🛵 Rider
            </button>
            <button
              onClick={() => handleDemoLogin('admin@foodpanda.com')}
              className="p-2 rounded-lg bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 cursor-pointer"
            >
              👑 Admin
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link href="/register" className="text-[#d70f64] font-bold hover:underline">
            Sign up now
          </Link>
        </div>
      </div>
    </div>
  );
}
