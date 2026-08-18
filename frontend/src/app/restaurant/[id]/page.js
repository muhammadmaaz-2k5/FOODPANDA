'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import { useCart } from '@/context/CartContext';
import api from '@/lib/api';
import { Star, Clock, MapPin, Plus, Check } from 'lucide-react';

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

  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        const [restRes, catRes] = await Promise.all([
          api.get(`/restaurants/${id}`),
          api.get(`/menu/restaurants/${id}/categories`),
        ]);
        if (restRes.data.success) setRestaurant(restRes.data.data);
        if (catRes.data.success) setCategories(catRes.data.data);
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
    setTimeout(() => setAddedNotice(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="max-w-6xl mx-auto p-8 space-y-6">
          <div className="h-60 rounded-3xl bg-slate-200 animate-pulse" />
          <div className="h-10 w-64 bg-slate-200 animate-pulse rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <CartDrawer />

      {/* Restaurant Header Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {restaurant?.name}
              </h1>
              <p className="text-sm text-slate-500 max-w-xl">{restaurant?.description}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
                <div className="flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full border border-amber-200">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{restaurant?.rating || 4.8} ({restaurant?.ratingCount || 100}+ reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{restaurant?.deliveryTimeMin || 25} - {restaurant?.deliveryTimeMax || 35} mins</span>
                </div>
                <div className="flex items-center gap-1 text-slate-500">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span>Downtown Hub (1.8 km)</span>
                </div>
              </div>
            </div>

            <div className="px-5 py-3 rounded-2xl bg-rose-50 border border-rose-100 text-center">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Free Delivery</span>
              <p className="text-xs text-rose-900 font-medium mt-0.5">On orders above $20 with code WELCOME50</p>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Categories & Items */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-12">
        {categories.map((category) => (
          <section key={category.id} className="space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{category.name}</h2>
              {category.description && (
                <p className="text-xs text-slate-500 mt-1">{category.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.foodItems?.map((item) => (
                <div
                  key={item.id}
                  onClick={() => openItemModal(item)}
                  className="group bg-white p-5 rounded-2xl border border-slate-200/80 hover:border-[#d70f64]/40 hover:shadow-lg transition-all duration-200 cursor-pointer flex justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-[#d70f64] transition">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">{item.description}</p>
                    <div className="pt-2 text-sm font-extrabold text-[#d70f64]">
                      ${item.price.toFixed(2)}
                    </div>
                  </div>

                  <div className="w-24 h-24 rounded-xl bg-rose-50 flex items-center justify-center text-3xl shrink-0 overflow-hidden relative">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      '🍔'
                    )}
                    <button className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full shadow-md text-[#d70f64] hover:bg-[#d70f64] hover:text-white transition">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Item Customizer Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900">{selectedItem.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedItem.description}</p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
              {/* Variations */}
              {selectedItem.variations?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Choose Size / Tier</h4>
                  <div className="space-y-2">
                    {selectedItem.variations.map((v) => (
                      <label
                        key={v.id}
                        onClick={() => setSelectedVariation(v)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                          selectedVariation?.id === v.id
                            ? 'border-[#d70f64] bg-rose-50/50 text-[#d70f64] font-bold'
                            : 'border-slate-200 text-slate-700'
                        }`}
                      >
                        <span>{v.name}</span>
                        <span>+${v.price.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Addons */}
              {selectedItem.addonGroups?.map((group) => (
                <div key={group.id} className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">{group.name}</h4>
                  <div className="space-y-2">
                    {group.addons?.map((addon) => {
                      const isChecked = selectedAddons.some((a) => a.id === addon.id);
                      return (
                        <label
                          key={addon.id}
                          onClick={() => handleAddonToggle(addon)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                            isChecked
                              ? 'border-[#d70f64] bg-rose-50/50 text-[#d70f64] font-bold'
                              : 'border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${isChecked ? 'bg-[#d70f64] border-[#d70f64] text-white' : 'border-slate-300'}`}>
                              {isChecked && <Check className="w-3 h-3" />}
                            </div>
                            <span>{addon.name}</span>
                          </div>
                          <span>+${addon.price.toFixed(2)}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Special Instructions */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Special Instructions</h4>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. No mayo, extra spicy sauce, allergies..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:outline-[#d70f64]"
                  rows={2}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-slate-600 font-bold px-1 text-lg"
                >
                  -
                </button>
                <span className="font-bold text-sm w-4 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="text-slate-600 font-bold px-1 text-lg"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCartSubmit}
                className="foodpanda-btn flex-1 py-3 rounded-xl font-bold text-white shadow-md text-sm"
              >
                Add to Cart • ${(
                  ((selectedVariation ? selectedVariation.price : selectedItem.price) +
                    selectedAddons.reduce((acc, a) => acc + a.price, 0)) *
                  quantity
                ).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
