'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import { User, Mail, Phone, Calendar, UploadCloud, CheckCircle2, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('MALE');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/users/profile');
        if (res.data?.success && res.data.data) {
          const profile = res.data.data;
          setFirstName(profile.firstName || '');
          setLastName(profile.lastName || '');
          setPhone(profile.phone || '');
          setGender(profile.gender || 'MALE');
          setAvatarUrl(profile.avatarUrl || '');
          if (profile.dateOfBirth) {
            setDateOfBirth(new Date(profile.dateOfBirth).toISOString().split('T')[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
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
        setAvatarUrl(data.secure_url);
      }
    } catch (err) {
      alert('Avatar upload failed: ' + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await api.put('/users/profile', {
        firstName,
        lastName,
        phone,
        gender,
        avatarUrl,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      });

      if (res.data?.success) {
        setSavedSuccess(true);
        // Refresh local storage user representation
        if (user) {
          const updatedUserObj = { ...user, ...res.data.data };
          localStorage.setItem('user', JSON.stringify(updatedUserObj));
        }
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const userRole = (typeof user?.role === 'string' ? user.role : user?.role?.name || 'CUSTOMER').toUpperCase();
  const normalizedRole = userRole.includes('ADMIN')
    ? 'ADMIN'
    : userRole.includes('RESTAURANT') || userRole.includes('VENDOR')
    ? 'VENDOR'
    : userRole.includes('RIDER')
    ? 'RIDER'
    : 'CUSTOMER';

  return (
    <DashboardLayout role={normalizedRole} title="My Account & Profile Settings">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#d70f64] to-rose-400 p-0.5 shadow-md flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <span className="text-3xl text-white font-black">
                      {firstName?.[0] || user?.email?.[0]?.toUpperCase() || 'P'}
                    </span>
                  )}
                </div>
                <label className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition cursor-pointer">
                  <UploadCloud className="w-6 h-6" />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  {firstName ? `${firstName} ${lastName}` : user?.email}
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <Shield className="w-3 h-3 text-[#d70f64]" /> {userRole}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
                {uploadingAvatar && <p className="text-xs text-[#d70f64] font-semibold mt-1">Uploading avatar to Cloudinary...</p>}
              </div>
            </div>

            <label className="foodpanda-btn px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm text-white">
              <UploadCloud className="w-4 h-4" /> Change Avatar
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
            </label>
          </div>

          {savedSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Profile successfully updated and saved!
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">First Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-sm focus:outline-[#d70f64]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Last Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Morgan"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-sm focus:outline-[#d70f64]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-[#d70f64]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-sm focus:outline-[#d70f64]"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other / Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Date of Birth</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-[#d70f64]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Email Address (Read Only)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving || uploadingAvatar}
                className="foodpanda-btn px-8 py-3.5 rounded-2xl font-bold text-white text-xs shadow-md cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
