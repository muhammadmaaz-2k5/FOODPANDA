'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import NotificationCenter from '@/components/NotificationCenter';
import { ShoppingBag, User, LogOut, LayoutDashboard, Bike, Store, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { user, logout, hasRole } = useAuth();
  const { itemCount, setIsOpen } = useCart();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#d70f64] flex items-center justify-center text-white font-extrabold text-2xl shadow-sm">
            🐼
          </div>
          <span className="text-2xl font-black tracking-tight text-[#d70f64]">
            foodpanda
          </span>
        </Link>

        {/* Navigation & Roles */}
        <div className="flex items-center gap-3 md:gap-6">
          {user && (
            <div className="hidden md:flex items-center gap-2">
              {hasRole('ADMIN') && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 transition"
                >
                  <ShieldCheck className="w-4 h-4" /> Admin Portal
                </Link>
              )}
              {hasRole('RESTAURANT_OWNER') && (
                <Link
                  href="/vendor"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 transition"
                >
                  <Store className="w-4 h-4" /> Vendor Hub
                </Link>
              )}
              {hasRole('RIDER') && (
                <Link
                  href="/rider"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition"
                >
                  <Bike className="w-4 h-4" /> Rider App
                </Link>
              )}
            </div>
          )}

          {/* Notification Bell */}
          <NotificationCenter />

          {/* Cart Trigger */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative p-2.5 rounded-full hover:bg-slate-100 transition text-slate-700 cursor-pointer"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-6 h-6" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#d70f64] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                {itemCount}
              </span>
            )}
          </button>

          {/* User Account / Auth Actions */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/orders"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
              >
                <User className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">{user.firstName || 'Account'}</span>
              </Link>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-[#d70f64] transition"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="foodpanda-btn px-4 py-2 rounded-lg text-sm font-bold shadow-xs"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
