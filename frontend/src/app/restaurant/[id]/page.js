'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import { useCart } from '@/context/CartContext';
import api from '@/lib/api';
import { Star, Clock, MapPin, Plus, Check, Heart, Leaf, Flame, Award, Phone, Share2, ShoppingCart, ChevronRight, X } from 'lucide-react';
import Link from 'next/link';

const STATUS_CONFIG = {
  ACTIVE: { label: '🟢 Open Now', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  INACTIVE: { label: '🔴 Closed', color: 'bg-red-100 text-red-700 border-red-200' },
  SUSPENDED: { label: '⛔ Suspended', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  PENDING: { label: '⏳ Coming Soon', color: 'bg-amber-100 text-amber-700 border-amber-200' },
};

export default function RestaurantPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        const [restRes, catRes] = await Promise.all([
          api.get(`/restaurants/${id}`),
          api.get(`/menu/restaurants/${id}/categories`),
        ]);
        if (restRes.data.success) {
          setRestaurant(restRes.data.data);
        }
        if (catRes.data.success) {
          const cats = catRes.data.data || [];
          setCategories(cats);
          if (cats.length > 0) setActiveCategory(cats[0].id);
        }
      } catch (err) {
        console.error('Restaurant data fetch error:', err.message);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRestaurantData();
  }, [id]);

  const openItemModal = (item) => {
    setSelectedItem(item);
    setSelectedVariation(item.variations?.[0] || null);
    setSelectedAddons([]);
    setInstructions('');
    setQuantity(1);
  };

  const handleAddonToggle = (addon) => {
    if (selectedAddons.some((a) => a.id === addon.id)) {
      setSelectedAddons(selectedAddons.filter((a) => a.id !== addon.id));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const handleAddToCartSubmit = async () => {
    if (!selectedItem) return;
    await addToCart(
      selectedItem.id,
      restaurant.id,
      quantity,
      selectedVariation?.id || null,
      selectedAddons.map((a) => a.id),
      instructions
    );
    setSelectedItem(null);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2500);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="h-72 w-full bg-slate-200 animate-pulse" />
        <div className="max-w-6xl mx-auto p-8 space-y-6">
          <div className="h-10 w-64 bg-slate-200 animate-pulse rounded-2xl" />
          <div className="h-4 w-96 bg-slate-200 animate-pulse rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(n => <div key={n} className="h-40 bg-slate-200 animate-pulse rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <p className="text-5xl">🍽️</p>
          <h2 className="text-2xl font-black text-slate-800">Restaurant not found</h2>
          <Link href="/" className="foodpanda-btn px-5 py-3 rounded-xl text-white font-bold text-sm">← Back to Home</Link>
        </div>
      </div>
    );
  }

  const statusConf = STATUS_CONFIG[restaurant.status] || STATUS_CONFIG.ACTIVE;

  return (
    <div className="min-h-screen bg-[#f8f8fb] flex flex-col">
      <Navbar />
      <CartDrawer />

      {/* ===== HERO BANNER ===== */}
      <div className="relative w-full h-72 sm:h-96 overflow-hidden">
        {/* Cover Image */}
        {(restaurant.coverUrl || restaurant.logoUrl) ? (
          <img
            src={restaurant.coverUrl || restaurant.logoUrl}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#d70f64] via-[#9b0d48] to-[#5a0028] flex items-center justify-center">
            <span className="text-white text-8xl opacity-40">🍔</span>
          </div>
        )}

        {/* Dark overlay gradient for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

        {/* Top Back Button */}
        <div className="absolute top-4 left-4">
          <Link
            href="/"
            className="bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 hover:bg-black/70 transition"
          >
            ← Home
          </Link>
        </div>

        {/* Status Badge top right */}
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1.5 rounded-full text-xs font-extrabold border backdrop-blur-md ${statusConf.color}`}>
            {statusConf.label}
          </span>
        </div>

        {/* Restaurant Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-lg">
                {restaurant.name}
              </h1>
              <p className="text-sm text-white/80 max-w-xl line-clamp-2 drop-shadow">{restaurant.description}</p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold border border-white/20">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {restaurant.rating || 4.8} ({restaurant.ratingCount || 120}+ reviews)
                </span>
                <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold border border-white/20">
                  <Clock className="w-3.5 h-3.5" />
                  {restaurant.deliveryTimeMin || 20}–{restaurant.deliveryTimeMax || 35} mins
                </span>
                {restaurant.city && (
                  <span className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold border border-white/20">
                    <MapPin className="w-3.5 h-3.5" />
                    {restaurant.city}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={async () => {
                  try {
                    await api.post(`/reviews/restaurants/${id}/favorite`);
                    setAddedNotice(true);
                    setTimeout(() => setAddedNotice(false), 2000);
                  } catch (err) {
                    alert(err.response?.data?.message || 'Please log in to save favorites');
                  }
                }}
                className="bg-white/15 backdrop-blur-md border border-white/25 text-white p-3 rounded-2xl hover:bg-white/25 transition cursor-pointer"
              >
                <Heart className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigator.clipboard?.writeText(window.location.href)}
                className="bg-white/15 backdrop-blur-md border border-white/25 text-white p-3 rounded-2xl hover:bg-white/25 transition cursor-pointer"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== PROMO BANNER STRIP ===== */}
      <div className="bg-gradient-to-r from-[#d70f64] via-[#b50b52] to-[#900040] text-white py-3 px-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 font-bold">
            <Award className="w-4 h-4 text-amber-300 shrink-0" />
            <span>🎉 Free delivery on orders above $20 · Use code <span className="font-black bg-white/20 px-2 py-0.5 rounded-full ml-1">WELCOME50</span> for 50% off your first order!</span>
          </div>
          <span className="text-white/70 text-xs shrink-0">Limited time offer</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8 flex gap-8 flex-1">
        {/* ===== LEFT SIDEBAR: Category Navigation ===== */}
        {categories.length > 0 && (
          <aside className="hidden lg:flex flex-col w-52 shrink-0 gap-2 sticky top-20 h-fit">
            <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-1 px-2">Menu Categories</p>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  document.getElementById(`cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`text-left px-4 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer flex items-center justify-between ${
                  activeCategory === cat.id
                    ? 'bg-[#d70f64] text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-200 bg-white border border-slate-200'
                }`}
              >
                <span>{cat.name}</span>
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${activeCategory === cat.id ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {cat.foodItems?.length || 0}
                </span>
              </button>
            ))}
          </aside>
        )}

        {/* ===== MAIN MENU CONTENT ===== */}
        <main className="flex-1 space-y-12">
          {categories.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
              <p className="text-4xl mb-3">🍽️</p>
              <p className="text-lg font-black text-slate-800">Menu is being prepared</p>
              <p className="text-xs text-slate-400 mt-1">Check back soon for delicious dishes!</p>
            </div>
          ) : (
            categories.map((category) => (
              <section
                key={category.id}
                id={`cat-${category.id}`}
                className="space-y-5 scroll-mt-24"
              >
                {/* Category Header */}
                <div className="flex items-center gap-4">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{category.name}</h2>
                    {category.description && (
                      <p className="text-xs text-slate-500 mt-0.5">{category.description}</p>
                    )}
                  </div>
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs font-bold text-slate-400 shrink-0">{category.foodItems?.length || 0} items</span>
                </div>

                {/* Dishes Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(category.foodItems || []).map((item) => {
                    const dishImg = item.imageUrl || item.image;
                    return (
                      <div
                        key={item.id}
                        onClick={() => openItemModal(item)}
                        className="group bg-white rounded-2xl border border-slate-200/80 hover:border-[#d70f64]/50 hover:shadow-xl transition-all duration-250 cursor-pointer overflow-hidden flex gap-0"
                      >
                        {/* Dish Info */}
                        <div className="p-5 flex-1 flex flex-col justify-between min-w-0 space-y-2">
                          <div>
                            <div className="flex items-start gap-2">
                              <h3 className="text-base font-bold text-slate-900 group-hover:text-[#d70f64] transition leading-tight flex-1">
                                {item.name}
                              </h3>
                              {item.isVegetarian && (
                                <span className="shrink-0 mt-0.5">
                                  <Leaf className="w-4 h-4 text-emerald-500" />
                                </span>
                              )}
                              {item.isPopular && (
                                <span className="shrink-0 px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-[9px] font-extrabold uppercase tracking-wider mt-0.5 whitespace-nowrap flex items-center gap-0.5">
                                  <Flame className="w-2.5 h-2.5" /> Popular
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">{item.description}</p>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div>
                              <span className="text-base font-extrabold text-[#d70f64]">
                                ${item.discountedPrice ? item.discountedPrice.toFixed(2) : item.price.toFixed(2)}
                              </span>
                              {item.discountedPrice && (
                                <span className="text-xs text-slate-400 line-through ml-1.5">${item.price.toFixed(2)}</span>
                              )}
                            </div>
                            {item.calories && (
                              <span className="text-[10px] text-slate-400 font-semibold">{item.calories} kcal</span>
                            )}
                          </div>
                        </div>

                        {/* Dish Image */}
                        <div className="w-28 sm:w-32 h-full shrink-0 relative">
                          {dishImg ? (
                            <img
                              src={dishImg}
                              alt={item.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                              style={{ minHeight: '120px' }}
                            />
                          ) : (
                            <div className="w-full h-full min-h-[120px] bg-rose-50 flex items-center justify-center text-4xl">🍔</div>
                          )}
                          <button className="absolute bottom-2 right-2 bg-[#d70f64] text-white p-2 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 active:scale-95">
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </main>
      </div>

      {/* ===== ITEM CUSTOMIZER MODAL ===== */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Modal Dish Image */}
            <div className="relative h-52 w-full bg-slate-100">
              {(selectedItem.imageUrl || selectedItem.image) ? (
                <img
                  src={selectedItem.imageUrl || selectedItem.image}
                  alt={selectedItem.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-rose-50 text-[#d70f64] text-7xl">🍔</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/70 transition"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl font-black text-white drop-shadow">{selectedItem.name}</h3>
                {selectedItem.isPopular && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-400 text-amber-900 rounded-full text-[10px] font-extrabold mt-1">
                    <Flame className="w-2.5 h-2.5" /> Most Popular
                  </span>
                )}
              </div>
            </div>

            {/* Modal Scroll Content */}
            <div className="p-5 max-h-[50vh] overflow-y-auto space-y-5">
              {selectedItem.description && (
                <p className="text-sm text-slate-500 leading-relaxed">{selectedItem.description}</p>
              )}

              {/* Variations */}
              {selectedItem.variations?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Choose Size / Tier <span className="text-[#d70f64]">*</span></h4>
                  <div className="space-y-2">
                    {selectedItem.variations.map((v) => (
                      <label
                        key={v.id}
                        onClick={() => setSelectedVariation(v)}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                          selectedVariation?.id === v.id
                            ? 'border-[#d70f64] bg-rose-50 text-[#d70f64] font-bold'
                            : 'border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedVariation?.id === v.id ? 'border-[#d70f64] bg-[#d70f64]' : 'border-slate-300'}`}>
                            {selectedVariation?.id === v.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          <span>{v.name}</span>
                        </div>
                        <span className="font-bold">+${v.price.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Addons */}
              {selectedItem.addons?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Add-ons (Optional)</h4>
                  <div className="space-y-2">
                    {selectedItem.addons.map((addon) => {
                      const isChecked = selectedAddons.some((a) => a.id === addon.id);
                      return (
                        <label
                          key={addon.id}
                          onClick={() => handleAddonToggle(addon)}
                          className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition ${
                            isChecked
                              ? 'border-[#d70f64] bg-rose-50 text-[#d70f64] font-bold'
                              : 'border-slate-200 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center transition ${isChecked ? 'bg-[#d70f64] border-[#d70f64] text-white' : 'border-slate-300'}`}>
                              {isChecked && <Check className="w-2.5 h-2.5" />}
                            </div>
                            <span>{addon.name}</span>
                          </div>
                          <span className="font-bold">+${addon.price.toFixed(2)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div className="space-y-2">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Special Instructions</h4>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. No mayo, extra spicy sauce, allergies..."
                  className="w-full p-3.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-[#d70f64] resize-none text-slate-700 placeholder-slate-400"
                  rows={2}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-5 border-t border-slate-100 bg-white flex items-center justify-between gap-4 sticky bottom-0">
              <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-2xl">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-slate-700 font-black text-lg w-6 text-center cursor-pointer leading-none"
                >
                  −
                </button>
                <span className="font-black text-sm w-5 text-center text-slate-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="text-slate-700 font-black text-lg w-6 text-center cursor-pointer leading-none"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCartSubmit}
                className="foodpanda-btn flex-1 py-3.5 rounded-2xl font-black text-white shadow-lg text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart · ${(
                  ((selectedVariation ? selectedVariation.price : selectedItem.price) +
                    selectedAddons.reduce((acc, a) => acc + a.price, 0)) *
                  quantity
                ).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {addedNotice && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold text-sm shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-200">
          <Check className="w-4 h-4" /> Added to your cart!
        </div>
      )}
    </div>
  );
}
