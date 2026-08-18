'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import NotificationCenter from '@/components/NotificationCenter';
import {
  ShoppingBag,
  User,
  LogOut,
  LayoutDashboard,
  Bike,
  Store,
  ShieldCheck,
  ChevronDown,
  Compass,
  Heart,
  MapPin,
  Tag,
  ChefHat,
  UtensilsCrossed,
  Settings,
  Zap,
  DollarSign
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, hasRole } = useAuth();
  const { itemCount, setIsOpen } = useCart();
  const [isDashDropdownOpen, setIsDashDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dashDropdownRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dashDropdownRef.current && !dashDropdownRef.current.contains(event.target)) {
        setIsDashDropdownOpen(false);
      }
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Explore Links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-[#d70f64] flex items-center justify-center text-white font-black text-2xl shadow-sm">
              🐼
            </div>
            <span className="text-2xl font-black tracking-tight text-[#d70f64]">
              foodpanda
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 text-xs font-bold text-slate-600">
            <Link href="/" className="px-3 py-1.5 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-slate-400" /> Restaurants
            </Link>
            <Link href="/orders" className="px-3 py-1.5 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-slate-400" /> My Orders
            </Link>
          </nav>
        </div>

        {/* Right Nav Navigation */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          
          {/* Dedicated Role-Based Portal Switcher */}
          {user && (
            <div className="relative" ref={dashDropdownRef}>
              <button
                onClick={() => setIsDashDropdownOpen(!isDashDropdownOpen)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold bg-slate-100 hover:bg-slate-200/80 text-slate-800 transition cursor-pointer border border-slate-200"
              >
                <LayoutDashboard className="w-4 h-4 text-[#d70f64]" />
                <span className="hidden sm:inline">Portals & Workspaces</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isDashDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDashDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-50 p-2 space-y-1 animate-in fade-in-50 zoom-in-95">
                  <div className="px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    Switch Active Workspace
                  </div>

                  {/* Customer Portal */}
                  <Link
                    href="/"
                    onClick={() => setIsDashDropdownOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-rose-50/60 transition group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-rose-100 text-[#d70f64] flex items-center justify-center font-bold">
                      🛍️
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#d70f64]">Customer Storefront</h4>
                      <p className="text-[10px] text-slate-400">Explore food, deals & checkout</p>
                    </div>
                  </Link>

                  {/* Vendor / Restaurant Staff Portal */}
                  {(hasRole('RESTAURANT_OWNER') || hasRole('RESTAURANT_STAFF') || hasRole('ADMIN')) && (
                    <div className="space-y-1 pt-1 border-t border-slate-100">
                      <Link
                        href="/vendor"
                        onClick={() => setIsDashDropdownOpen(false)}
                        className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-amber-50/60 transition group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                          👨‍🍳
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700">Kitchen Display (KDS)</h4>
                          <p className="text-[10px] text-slate-400">Live prep tickets & orders</p>
                        </div>
                      </Link>

                      <Link
                        href="/vendor/menu"
                        onClick={() => setIsDashDropdownOpen(false)}
                        className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-amber-50/60 transition group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                          🍕
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700">Menu & Dish Builder</h4>
                          <p className="text-[10px] text-slate-400">Cloudinary dish manager</p>
                        </div>
                      </Link>

                      <Link
                        href="/vendor/settings"
                        onClick={() => setIsDashDropdownOpen(false)}
                        className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-amber-50/60 transition group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                          ⚙️
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-amber-700">Store Hours & Settings</h4>
                          <p className="text-[10px] text-slate-400">Kitchen open/pause limits</p>
                        </div>
                      </Link>
                    </div>
                  )}

                  {/* Rider Portal */}
                  {(hasRole('RIDER') || hasRole('ADMIN')) && (
                    <div className="pt-1 border-t border-slate-100">
                      <Link
                        href="/rider"
                        onClick={() => setIsDashDropdownOpen(false)}
                        className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-emerald-50/60 transition group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                          🛵
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-700">Rider Delivery App</h4>
                          <p className="text-[10px] text-slate-400">Available jobs & GPS telemetry</p>
                        </div>
                      </Link>
                    </div>
                  )}

                  {/* Admin Portal */}
                  {hasRole('ADMIN') && (
                    <div className="space-y-1 pt-1 border-t border-slate-100">
                      <Link
                        href="/admin"
                        onClick={() => setIsDashDropdownOpen(false)}
                        className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-purple-50/60 transition group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                          👑
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700">Admin Control Center</h4>
                          <p className="text-[10px] text-slate-400">Partners, users & GMV stats</p>
                        </div>
                      </Link>

                      <Link
                        href="/admin/dispatch"
                        onClick={() => setIsDashDropdownOpen(false)}
                        className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-purple-50/60 transition group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                          🗺️
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700">City Dispatch Map</h4>
                          <p className="text-[10px] text-slate-400">Live fleet tracking map</p>
                        </div>
                      </Link>

                      <Link
                        href="/admin/promotions"
                        onClick={() => setIsDashDropdownOpen(false)}
                        className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-purple-50/60 transition group"
                      >
                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                          🎟️
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 group-hover:text-purple-700">Campaigns & Coupons</h4>
                          <p className="text-[10px] text-slate-400">Discounts & hero banners</p>
                        </div>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notification Bell */}
          <NotificationCenter />

          {/* Cart Drawer Trigger */}
          <button
            onClick={() => setIsOpen(true)}
            className="relative p-2.5 rounded-full hover:bg-slate-100 transition text-slate-700 cursor-pointer"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#d70f64] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs animate-scale">
                {itemCount}
              </span>
            )}
          </button>

          {/* User Account / Profile Menu */}
          {user ? (
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition cursor-pointer text-xs font-bold text-slate-800"
              >
                <div className="w-6 h-6 rounded-full bg-[#d70f64] text-white flex items-center justify-center text-xs font-black">
                  {user.firstName ? user.firstName[0].toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline">{user.firstName || 'Account'}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-50 p-2 space-y-1 animate-in fade-in-50 zoom-in-95 text-xs">
                  <div className="p-3 border-b border-slate-100">
                    <p className="font-black text-slate-900">{user.firstName} {user.lastName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-rose-50 text-[#d70f64] text-[10px] font-extrabold uppercase">
                      {user.roleName || user.role?.name || 'Customer'}
                    </span>
                  </div>

                  {/* Quick role dashboard link */}
                  {hasRole('ADMIN') && (
                    <Link
                      href="/admin"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-purple-700 hover:bg-purple-50 font-bold"
                    >
                      <ShieldCheck className="w-4 h-4 text-purple-600" /> Admin Control Hub
                    </Link>
                  )}

                  {(hasRole('RESTAURANT_OWNER') || hasRole('RESTAURANT_STAFF')) && (
                    <Link
                      href="/vendor"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-amber-700 hover:bg-amber-50 font-bold"
                    >
                      <ChefHat className="w-4 h-4 text-amber-600" /> Kitchen (KDS) Hub
                    </Link>
                  )}

                  {hasRole('RIDER') && (
                    <Link
                      href="/rider"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-emerald-700 hover:bg-emerald-50 font-bold"
                    >
                      <Bike className="w-4 h-4 text-emerald-600" /> Rider Logistics Hub
                    </Link>
                  )}

                  <Link
                    href="/orders"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold"
                  >
                    <ShoppingBag className="w-4 h-4 text-slate-400" /> My Orders & History
                  </Link>

                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold cursor-pointer transition border-t border-slate-100 mt-1 pt-2"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-2 text-xs font-bold text-slate-700 hover:text-[#d70f64] transition"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="foodpanda-btn px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs"
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
