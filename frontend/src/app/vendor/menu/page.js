'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import api from '@/lib/api';
import { Store, Plus, Edit2, Trash2, Image as ImageIcon, Check, Eye, EyeOff, UploadCloud, ArrowLeft } from 'lucide-react';

export default function VendorMenuPage() {
  const [categories, setCategories] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isPopular, setIsPopular] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchVendorMenu = async () => {
    try {
      const restRes = await api.get('/restaurants');
      const restaurantList = restRes.data?.data?.items || restRes.data?.data || [];
      if (restaurantList.length > 0) {
        const myRest = restaurantList[0];
        setRestaurant(myRest);
        const catRes = await api.get(`/menu/restaurants/${myRest.id}/categories`);
        let catList = catRes.data?.data || [];

        // If restaurant has no food categories yet, create default categories
        if (catList.length === 0) {
          try {
            await api.post('/menu/categories', {
              name: 'Signature Dishes',
              description: 'Main chef specials & house recommendations',
              restaurantId: myRest.id,
            });
            const refreshedCats = await api.get(`/menu/restaurants/${myRest.id}/categories`);
            catList = refreshedCats.data?.data || [];
          } catch (e) {
            console.error('Auto create category error:', e.message);
          }
        }

        setCategories(catList);
        if (catList.length > 0) {
          setCategoryId(catList[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching menu:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorMenu();
  }, []);

  // Cloudinary Direct Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
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
        setImageUrl(data.secure_url);
      }
    } catch (err) {
      alert('Image upload failed: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateDish = async (e) => {
    e.preventDefault();
    if (!name || !price || !categoryId || !restaurant) return;

    try {
      setSubmitting(true);
      const res = await api.post('/menu/items', {
        name,
        description,
        price: parseFloat(price),
        restaurantId: restaurant.id,
        categoryId,
        image: imageUrl || undefined,
        isPopular,
      });

      if (res.data.success) {
        setIsModalOpen(false);
        setName('');
        setDescription('');
        setPrice('');
        setImageUrl('');
        setIsPopular(false);
        fetchVendorMenu();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create dish');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleItemAvailability = async (itemId, currentStatus) => {
    const newStatus = currentStatus === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE';
    try {
      const res = await api.patch(`/menu/items/${itemId}/status`, { status: newStatus });
      if (res.data.success) {
        fetchVendorMenu();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  return (
    <DashboardLayout role="VENDOR" title="Menu & Dish Builder">
      <div className="space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <h2 className="text-xl font-black text-slate-900">Menu & Dish Customizer</h2>
            <p className="text-xs text-slate-500 mt-1">Manage categories, dishes, prices, and high-res Cloudinary photos for {restaurant?.name}.</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="foodpanda-btn px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md text-white"
          >
            <Plus className="w-4 h-4" /> Add New Dish
          </button>
        </div>

        {/* Menu Categories List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div key={n} className="h-48 rounded-3xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => (
              <div key={category.id} className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">{category.name}</h3>
                    <p className="text-xs text-slate-400">{category.description || `${category.foodItems?.length || 0} items listed`}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
                    {category.foodItems?.length || 0} Dishes
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {category.foodItems?.map((item) => (
                    <div key={item.id} className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 transition">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-2xl shrink-0 overflow-hidden">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            '🍔'
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 text-sm">{item.name}</h4>
                            {item.isPopular && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
                          <span className="text-xs font-black text-[#d70f64] mt-1 block">
                            ${item.price.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleItemAvailability(item.id, item.status)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                            item.status === 'AVAILABLE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.status === 'AVAILABLE' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          {item.status}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Add New Dish Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-xl font-black text-slate-900">Add New Menu Dish</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700 text-lg">✕</button>
            </div>

            <form onSubmit={handleCreateDish} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Dish Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Truffle Bacon Smash Burger"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-[#d70f64]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="12.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-[#d70f64]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-[#d70f64]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Description</label>
                <textarea
                  placeholder="Ingredients and taste highlights..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-sm focus:outline-[#d70f64]"
                />
              </div>

              {/* Cloudinary Photo Uploader */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Dish Photo (Cloudinary)</label>
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 rounded-xl border border-dashed border-slate-300 hover:border-[#d70f64] bg-slate-50 text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer transition">
                    <UploadCloud className="w-4 h-4 text-[#d70f64]" />
                    {uploadingImage ? 'Uploading to Cloudinary...' : 'Upload Image'}
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {imageUrl && (
                    <img src={imageUrl} alt="Uploaded" className="w-10 h-10 rounded-xl object-cover border border-slate-200" />
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="popular"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  className="accent-[#d70f64] w-4 h-4 rounded"
                />
                <label htmlFor="popular" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Feature in Popular Section
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploadingImage}
                  className="flex-1 foodpanda-btn py-2.5 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Create Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
