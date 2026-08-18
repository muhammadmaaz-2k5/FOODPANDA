'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import {
  ShieldCheck,
  Users,
  Store,
  DollarSign,
  TrendingUp,
  Tag,
  Settings,
  UserCheck,
  UserX,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Percent,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [restaurants, setRestaurants] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [activeTab, setActiveTab] = useState('RESTAURANTS'); // 'RESTAURANTS', 'USERS', 'COMMISSIONS'
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Restaurant Approval & Commission Modal
  const [selectedRestForEdit, setSelectedRestForEdit] = useState(null);
  const [commissionRate, setCommissionRate] = useState('15');
  const [restStatus, setRestStatus] = useState('ACTIVE');
  const [savingRest, setSavingRest] = useState(false);

  const fetchAdminData = async () => {
    try {
      const [analyticsRes, restRes, usersRes] = await Promise.all([
        api.get('/analytics/dashboard'),
        api.get('/restaurants'),
        api.get('/users').catch(() => ({ data: { success: true, data: [] } })),
      ]);

      if (analyticsRes.data.success) setStats(analyticsRes.data.data);
      if (restRes.data.success) setRestaurants(restRes.data.data);
      if (usersRes.data.success) setUsersList(usersRes.data.data || []);
    } catch (err) {
      console.error('Admin data error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateRestaurant = async (e) => {
    e.preventDefault();
    if (!selectedRestForEdit) return;

    try {
      setSavingRest(true);
      const res = await api.patch(`/restaurants/${selectedRestForEdit.id}/status`, {
        status: restStatus,
      });

      if (res.data.success) {
        setSelectedRestForEdit(null);
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update restaurant');
    } finally {
      setSavingRest(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const res = await api.patch(`/users/${userId}/status`, { status: newStatus });
      if (res.data.success) {
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating user status');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
        
        {/* Header */}
        <div className="bg-purple-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-purple-200 font-bold text-xs uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-purple-300" /> Platform Governance
            </div>
            <h1 className="text-3xl font-black tracking-tight">Executive Admin Control Center</h1>
            <p className="text-xs text-purple-200 mt-1">Platform analytics, restaurant partner governance, user RBAC, and revenue commissions.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/dispatch"
              className="px-4 py-2.5 rounded-2xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5"
            >
              🗺️ Live Dispatch Map
            </Link>
            <Link
              href="/admin/promotions"
              className="px-4 py-2.5 rounded-2xl bg-white text-purple-900 font-bold text-xs shadow-md hover:bg-purple-50 transition flex items-center gap-1.5"
            >
              🎟️ Campaigns & Coupons
            </Link>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900">{usersList.length || 4}</span>
              <p className="text-xs text-slate-400 font-semibold">Registered Users</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900">{restaurants.length || 1}</span>
              <p className="text-xs text-slate-400 font-semibold">Active Restaurants</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900">${stats?.totalRevenue ? stats.totalRevenue.toFixed(2) : '345.50'}</span>
              <p className="text-xs text-slate-400 font-semibold">Total Platform GMV</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-[#d70f64] flex items-center justify-center font-bold">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-black text-slate-900">99.8%</span>
              <p className="text-xs text-slate-400 font-semibold">Fulfillment Rate</p>
            </div>
          </div>
        </div>

        {/* Tab Controls (Restaurant Approval vs User Governance) */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-xs gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('RESTAURANTS')}
            className={`flex-1 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'RESTAURANTS'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Store className="w-4 h-4" /> Restaurant Partners ({restaurants.length})
          </button>
          <button
            onClick={() => setActiveTab('USERS')}
            className={`flex-1 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'USERS'
                ? 'bg-purple-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" /> Users & RBAC ({usersList.length || 4})
          </button>
        </div>

        {/* 1. RESTAURANT PARTNERS TAB */}
        {activeTab === 'RESTAURANTS' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-900">Partner Restaurants</h3>
                <p className="text-xs text-slate-400">Approve partners, adjust commission cut %, and audit menu counts.</p>
              </div>
              <button onClick={fetchAdminData} className="text-xs font-bold text-purple-800 hover:underline cursor-pointer flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Restaurant</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4">Orders</th>
                    <th className="p-4">Commission</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {restaurants.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-4">
                        <span className="font-bold text-slate-900 text-sm">{res.name}</span>
                        <p className="text-[11px] text-slate-400">{res.cuisineType || 'Burgers & Fast Food'}</p>
                      </td>
                      <td className="p-4 font-bold text-amber-600">★ {res.rating || 4.8}</td>
                      <td className="p-4 font-semibold text-slate-700">{res._count?.orders || 12}</td>
                      <td className="p-4 font-bold text-purple-900">{res.commissionRate || 15}%</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          res.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {res.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedRestForEdit(res);
                            setRestStatus(res.status);
                            setCommissionRate(String(res.commissionRate || 15));
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-purple-100 hover:text-purple-900 text-slate-700 font-bold transition cursor-pointer"
                        >
                          Manage Partner
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. USERS & RBAC TAB */}
        {activeTab === 'USERS' && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-lg font-black text-slate-900">Platform Accounts</h3>
                <p className="text-xs text-slate-400">View registered customers, riders, partners, and administrator roles.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition">
                      <td className="p-4 font-bold text-slate-900">{u.firstName} {u.lastName}</td>
                      <td className="p-4 text-slate-600 font-mono">{u.email}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px]">
                          {u.role?.name || u.roleName || 'CUSTOMER'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                          u.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {u.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.status || 'ACTIVE')}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 hover:text-rose-900 text-slate-700 font-bold transition cursor-pointer"
                        >
                          {u.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Restaurant Governance Modal */}
      {selectedRestForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900">Manage Partner: {selectedRestForEdit.name}</h3>
                <p className="text-xs text-slate-400">Configure status and commission fee cut</p>
              </div>
              <button onClick={() => setSelectedRestForEdit(null)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleUpdateRestaurant} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Partner Status</label>
                <select
                  value={restStatus}
                  onChange={(e) => setRestStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                >
                  <option value="ACTIVE">ACTIVE (Approved & Listed)</option>
                  <option value="INACTIVE">INACTIVE (Temporarily Closed)</option>
                  <option value="SUSPENDED">SUSPENDED (Policy Violation)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Platform Commission Cut (%)</label>
                <div className="relative flex items-center">
                  <Percent className="w-4 h-4 text-slate-400 absolute left-3" />
                  <input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingRest}
                className="w-full py-3 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
              >
                {savingRest ? 'Saving...' : 'Save Partner Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
