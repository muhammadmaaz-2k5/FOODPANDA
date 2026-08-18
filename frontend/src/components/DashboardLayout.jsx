'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Compass,
  ShoppingBag,
  Heart,
  MapPin,
  ChefHat,
  UtensilsCrossed,
  Settings,
  Bike,
  DollarSign,
  ShieldCheck,
  Megaphone,
  Map,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';

export default function DashboardLayout({
  role = 'CUSTOMER', // 'CUSTOMER', 'VENDOR', 'RIDER', 'ADMIN'
  title = 'Dashboard',
  children,
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);

  // Configuration of navigation links per role
  const roleNavItems = {
    CUSTOMER: [
      { label: 'Explore Food & Deals', href: '/', icon: Compass },
      { label: 'Order History & Tracking', href: '/orders', icon: ShoppingBag },
      { label: 'My Account & Profile', href: '/profile', icon: User },
    ],
    VENDOR: [
      { label: 'Live Kitchen (KDS)', href: '/vendor', icon: ChefHat },
      { label: 'Menu & Dish Builder', href: '/vendor/menu', icon: UtensilsCrossed },
      { label: 'Kitchen & Delivery Hours', href: '/vendor/settings', icon: Settings },
      { label: 'Vendor Profile', href: '/profile', icon: User },
    ],
    RIDER: [
      { label: 'Dispatch & Available Jobs', href: '/rider', icon: Bike },
      { label: 'Rider Profile & Photo', href: '/profile', icon: User },
    ],
    ADMIN: [
      { label: 'Partners & User Moderation', href: '/admin', icon: ShieldCheck },
      { label: 'Live City Dispatch Map', href: '/admin/dispatch', icon: Map },
      { label: 'Campaigns, Coupons & Banners', href: '/admin/promotions', icon: Megaphone },
      { label: 'Admin Profile', href: '/profile', icon: User },
    ],
  };

  const currentNav = roleNavItems[role] || roleNavItems.CUSTOMER;

  const roleMeta = {
    CUSTOMER: { color: 'text-[#d70f64]', bg: 'bg-rose-50', badge: 'Customer Workspace', icon: '🛍️' },
    VENDOR: { color: 'text-amber-600', bg: 'bg-amber-50', badge: 'Kitchen Staff Workspace', icon: '👨‍🍳' },
    RIDER: { color: 'text-emerald-600', bg: 'bg-emerald-50', badge: 'Rider Logistics Workspace', icon: '🛵' },
    ADMIN: { color: 'text-purple-600', bg: 'bg-purple-50', badge: 'Executive Platform Admin', icon: '👑' },
  }[role] || { color: 'text-[#d70f64]', bg: 'bg-rose-50', badge: 'Portal', icon: '🐼' };

  return (
    <div className="min-h-screen bg-slate-100/70 flex">
      {/* Sleek Modern Dashboard Sidebar */}
      <aside
        className={`bg-slate-900 text-slate-100 flex flex-col justify-between transition-all duration-300 z-30 sticky top-0 h-screen shadow-2xl ${
          collapsed ? 'w-20' : 'w-64 sm:w-72'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-2xl bg-[#d70f64] flex items-center justify-center text-white font-black text-xl shadow-lg shrink-0">
              🐼
            </div>
            {!collapsed && (
              <div>
                <span className="text-xl font-black tracking-tight text-white block leading-tight">foodpanda</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-300">
                  {roleMeta.badge}
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition hidden md:block"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          {!collapsed && (
            <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-slate-500">
              Menu & Navigation
            </div>
          )}

          {currentNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-bold transition group ${
                  isActive
                    ? 'bg-[#d70f64] text-white shadow-lg shadow-rose-900/30'
                    : 'text-slate-400 hover:bg-slate-800/80 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer User Info & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
                {user?.firstName ? user.firstName[0].toUpperCase() : 'U'}
              </div>
              {!collapsed && (
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{user?.firstName || 'User'}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email || 'Logged In'}</p>
                </div>
              )}
            </div>

            <button
              onClick={logout}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Dashboard Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Floating Dashboard Navbar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 sm:px-8 py-4 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Workspace • {roleMeta.badge}
            </span>
            <h1 className="text-xl font-black text-slate-900 leading-tight">{title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-1.5"
            >
              🏪 View Storefront
            </Link>
          </div>
        </header>

        {/* Body Content */}
        <main className="p-6 sm:p-8 flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
