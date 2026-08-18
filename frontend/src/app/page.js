'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Link from 'next/link';
import api from '@/lib/api';
import { Search, Star, Clock, Flame, Tag, ChevronRight, SlidersHorizontal, Sparkles } from 'lucide-react';

const CUISINES = [
  { label: 'All Cuisines', value: 'ALL', icon: '🍽️' },
  { label: 'Burgers & Grill', value: 'BURGER', icon: '🍔' },
  { label: 'Pizza & Italian', value: 'PIZZA', icon: '🍕' },
  { label: 'Asian & Noodles', value: 'ASIAN', icon: '🍜' },
  { label: 'Desserts & Sweets', value: 'DESSERT', icon: '🍩' },
  { label: 'Beverages & Coffee', value: 'DRINKS', icon: '🥤' },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('ALL');
  const [selectedSort, setSelectedSort] = useState('RATING'); // 'RATING', 'FASTEST', 'PRICE'
  const [restaurants, setRestaurants] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [restRes, bannerRes] = await Promise.all([
          api.get('/restaurants'),
          api.get('/marketing/banners'),
        ]);

        if (restRes.data.success) setRestaurants(restRes.data.data);
        if (bannerRes.data.success) setBanners(bannerRes.data.data);
      } catch (err) {
        console.error('Home data load error:', err.message);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  let filteredRestaurants = restaurants.filter((r) => {
    const matchQuery = r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCuisine = selectedCuisine === 'ALL' ||
      r.cuisineType?.toUpperCase().includes(selectedCuisine) ||
      r.name.toUpperCase().includes(selectedCuisine) ||
      r.description?.toUpperCase().includes(selectedCuisine);
    return matchQuery && matchCuisine;
  });

  if (selectedSort === 'RATING') {
    filteredRestaurants.sort((a, b) => (b.rating || 4.5) - (a.rating || 4.5));
  } else if (selectedSort === 'FASTEST') {
    filteredRestaurants.sort((a, b) => (a.deliveryTimeMin || 25) - (b.deliveryTimeMin || 25));
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <CartDrawer />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#d70f64] via-[#b50b52] to-[#800739] text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 text-xs font-bold backdrop-blur-xs tracking-wide shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" /> Fastest Food & Grocery Delivery
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
            Order food & groceries from top spots in your city
          </h1>
          <p className="text-base sm:text-lg text-rose-100 max-w-2xl mx-auto">
            Super fast delivery from your favorite local eateries and verified restaurant partners.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative pt-4">
            <div className="flex items-center bg-white rounded-2xl p-2 shadow-2xl">
              <Search className="w-6 h-6 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Search for restaurants, burgers, pizza, or Asian cuisine..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-hidden text-sm sm:text-base"
              />
              <button className="foodpanda-btn px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shrink-0">
                Find Food
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Cuisine Quick-Filter Chips */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 w-full">
        <div className="bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl flex gap-2.5 overflow-x-auto scrollbar-none">
          {CUISINES.map((c) => (
            <button
              key={c.value}
              onClick={() => setSelectedCuisine(c.value)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 flex items-center gap-2 transition cursor-pointer ${
                selectedCuisine === c.value
                  ? 'bg-[#d70f64] text-white shadow-md'
                  : 'bg-slate-100/80 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              <span>{c.icon}</span>
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Promotional Banners */}
      {banners.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 to-rose-500 p-6 text-white shadow-md flex items-center justify-between"
              >
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase bg-white/25 px-2 py-0.5 rounded-md">
                    <Tag className="w-3 h-3" /> Special Deal
                  </span>
                  <h3 className="text-xl font-black">{banner.title}</h3>
                  <p className="text-xs text-amber-50 font-medium">{banner.subtitle || 'Limited time offer on orders'}</p>
                </div>
                <div className="text-4xl font-extrabold opacity-90">🎉</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Restaurant List Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Featured Restaurants</h2>
            <p className="text-xs text-slate-500 mt-1">Handpicked quality dining delivering directly to your door.</p>
          </div>

          {/* Sort Filter Selector */}
          <div className="flex items-center gap-2 text-xs font-bold bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Sort by:</span>
            <button
              onClick={() => setSelectedSort('RATING')}
              className={`px-2 py-1 rounded-lg ${selectedSort === 'RATING' ? 'bg-[#d70f64] text-white' : 'text-slate-700'}`}
            >
              Top Rated
            </button>
            <button
              onClick={() => setSelectedSort('FASTEST')}
              className={`px-2 py-1 rounded-lg ${selectedSort === 'FASTEST' ? 'bg-[#d70f64] text-white' : 'text-slate-700'}`}
            >
              Fastest
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-72 rounded-3xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
            <p className="text-lg font-bold text-slate-700">No restaurants found</p>
            <p className="text-xs text-slate-400 mt-1">Try clearing your filters or search keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((res) => (
              <Link
                key={res.id}
                href={`/restaurant/${res.id}`}
                className="group bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                {/* Restaurant Cover Image */}
                <div className="h-48 w-full bg-slate-100 relative overflow-hidden">
                  {res.coverImage ? (
                    <img
                      src={res.coverImage}
                      alt={res.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-rose-50 text-[#d70f64] text-5xl">
                      🍔
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 flex items-center gap-1 shadow-xs">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>{res.rating || 4.8}</span>
                    <span className="text-slate-400 text-[10px]">({res.ratingCount || 120})</span>
                  </div>
                </div>

                {/* Info Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-[#d70f64] transition">
                      {res.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {res.description || 'Gourmet burgers, crispy fries & signature shakes'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{res.deliveryTimeMin || 25}-{res.deliveryTimeMax || 35} mins</span>
                    </div>
                    <span className="text-[#d70f64] font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                      View Menu <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} FoodPanda. Fast & Reliable Food Delivery Platform.</p>
        </div>
      </footer>
    </div>
  );
}
