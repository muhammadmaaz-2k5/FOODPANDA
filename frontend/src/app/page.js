'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Link from 'next/link';
import api from '@/lib/api';
import { Search, Star, Clock, Flame, Tag, ChevronRight } from 'lucide-react';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredRestaurants = restaurants.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <CartDrawer />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#d70f64] to-[#9c0b49] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs tracking-wide">
            <Flame className="w-4 h-4 text-amber-300" /> Craving something special?
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
            Order food & groceries from the best spots near you
          </h1>
          <p className="text-lg text-rose-100 max-w-2xl mx-auto">
            Super fast delivery from your favorite local eateries and verified partners.
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
                className="w-full px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-hidden text-base"
              />
              <button className="foodpanda-btn px-6 py-3 rounded-xl font-bold text-sm shrink-0">
                Find Food
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Promotional Banners */}
      {banners.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 p-6 text-white shadow-md flex items-center justify-between"
              >
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 text-xs font-bold uppercase bg-white/20 px-2 py-0.5 rounded">
                    <Tag className="w-3 h-3" /> Special Deal
                  </span>
                  <h3 className="text-xl font-black">{banner.title}</h3>
                  <p className="text-xs text-amber-50">{banner.subtitle || 'Limited time offer on orders'}</p>
                </div>
                <div className="text-4xl font-extrabold opacity-90">🎉</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Restaurant List Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Featured Restaurants</h2>
            <p className="text-sm text-slate-500 mt-1">Handpicked quality dining delivering directly to your door.</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-72 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <p className="text-lg font-bold text-slate-700">No restaurants found</p>
            <p className="text-sm text-slate-400 mt-1">Try searching with different keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((res) => (
              <Link
                key={res.id}
                href={`/restaurant/${res.id}`}
                className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                {/* Restaurant Cover Image */}
                <div className="h-44 w-full bg-slate-100 relative overflow-hidden">
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
                      {res.description || 'Gourmet burgers, fries & refreshing shakes'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{res.deliveryTimeMin || 25}-{res.deliveryTimeMax || 35} mins</span>
                    </div>
                    <span className="text-[#d70f64] flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
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
          <p>© {new Date().getFullYear()} FoodPanda. High-Performance Full Stack Food Delivery Platform.</p>
        </div>
      </footer>
    </div>
  );
}
