'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import CartDrawer from '@/components/CartDrawer';
import Link from 'next/link';
import api from '@/lib/api';
import { Search, Star, Clock, Flame, Tag, ChevronRight, SlidersHorizontal, Sparkles, Utensils, Store } from 'lucide-react';

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
  const [selectedSort, setSelectedSort] = useState('relevance'); // 'relevance', 'rating', 'fastest', 'price_asc'
  const [searchResults, setSearchResults] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSearchResults = async (query = '', cuisine = 'ALL', sort = 'relevance') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (query.trim()) params.append('q', query.trim());
      if (cuisine && cuisine !== 'ALL') params.append('category', cuisine);
      if (sort) params.append('sortBy', sort);

      const res = await api.get(`/search?${params.toString()}`);
      if (res.data?.success) {
        setSearchResults(res.data.data?.items || res.data.data || []);
      }
    } catch (err) {
      console.error('Search API error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadBanners = async () => {
      try {
        const bannerRes = await api.get('/marketing/banners').catch(() => ({ data: { success: true, data: [] } }));
        if (bannerRes.data?.success) setBanners(bannerRes.data.data || []);
      } catch (e) {}
    };
    loadBanners();
    fetchSearchResults(searchQuery, selectedCuisine, selectedSort);
  }, []);

  // Debounced search trigger when typing
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSearchResults(searchQuery, selectedCuisine, selectedSort);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCuisine, selectedSort]);

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

          {/* Intelligent Search Input */}
          <div className="max-w-2xl mx-auto relative pt-4">
            <div className="flex items-center bg-white rounded-2xl p-2 shadow-2xl">
              <Search className="w-6 h-6 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                placeholder="Search for truffle burgers, pizza, drinks, restaurants or dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-hidden text-sm sm:text-base font-medium"
              />
              <button
                onClick={() => fetchSearchResults(searchQuery, selectedCuisine, selectedSort)}
                className="foodpanda-btn px-6 py-3 rounded-xl font-bold text-xs sm:text-sm shrink-0 cursor-pointer"
              >
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
                className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-500 via-rose-500 to-[#d70f64] p-6 sm:p-7 text-white shadow-lg flex items-center justify-between group cursor-pointer border border-white/10 hover:shadow-xl transition-all duration-300"
              >
                {banner.imageUrl && (
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:scale-105 group-hover:opacity-35 transition-all duration-500 pointer-events-none"
                  />
                )}
                <div className="relative z-10 space-y-1.5 max-w-[75%]">
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full shadow-xs">
                    <Tag className="w-3 h-3 text-amber-200" /> {banner.placement || 'Featured Promo'}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-xs">{banner.title}</h3>
                  <p className="text-xs text-amber-100 font-medium line-clamp-1">{banner.subtitle || 'Tap to explore special restaurant offers and promo discounts'}</p>
                </div>
                <div className="relative z-10 text-3xl sm:text-4xl font-extrabold opacity-95 group-hover:rotate-12 transition-transform duration-300">
                  🎉
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search Engine Results Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 w-full space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {searchQuery ? `Search Results for "${searchQuery}"` : 'Top Rated Restaurants & Dishes'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Found {searchResults.length} matching partner restaurants and chef specialties.
            </p>
          </div>

          {/* Search Sort by Engine */}
          <div className="flex items-center gap-2 text-xs font-bold bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500">Sort by:</span>
            <button
              onClick={() => setSelectedSort('relevance')}
              className={`px-2 py-1 rounded-lg transition ${selectedSort === 'relevance' ? 'bg-[#d70f64] text-white' : 'text-slate-700'}`}
            >
              Relevance
            </button>
            <button
              onClick={() => setSelectedSort('rating')}
              className={`px-2 py-1 rounded-lg transition ${selectedSort === 'rating' ? 'bg-[#d70f64] text-white' : 'text-slate-700'}`}
            >
              Top Rated
            </button>
            <button
              onClick={() => setSelectedSort('fastest')}
              className={`px-2 py-1 rounded-lg transition ${selectedSort === 'fastest' ? 'bg-[#d70f64] text-white' : 'text-slate-700'}`}
            >
              Fastest
            </button>
            <button
              onClick={() => setSelectedSort('price_asc')}
              className={`px-2 py-1 rounded-lg transition ${selectedSort === 'price_asc' ? 'bg-[#d70f64] text-white' : 'text-slate-700'}`}
            >
              Lowest Price
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-72 rounded-3xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 space-y-2">
            <p className="text-4xl">🔍</p>
            <p className="text-lg font-black text-slate-800">No matching food or restaurants found</p>
            <p className="text-xs text-slate-400">Try searching for other dish names, burger specials, or cuisines.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((item) => {
              const isRestaurant = item.type === 'RESTAURANT';
              return (
                <Link
                  key={item.id}
                  href={item.targetUrl || `/restaurant/${item.id}`}
                  className="group bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                  {/* Card Media Preview */}
                  <div className="h-48 w-full bg-slate-100 relative overflow-hidden">
                    {item.coverUrl || item.logoUrl || item.image ? (
                      <img
                        src={item.coverUrl || item.logoUrl || item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-rose-50 text-[#d70f64] text-5xl">
                        {isRestaurant ? '🍔' : '🍕'}
                      </div>
                    )}
                    
                    <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-md text-white px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                      {isRestaurant ? <Store className="w-3 h-3 text-[#d70f64]" /> : <Utensils className="w-3 h-3 text-amber-400" />}
                      <span>{isRestaurant ? 'Restaurant' : 'Menu Dish'}</span>
                    </div>

                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full text-xs font-bold text-slate-800 flex items-center gap-1 shadow-xs">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span>{item.rating || 4.8}</span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-[#d70f64] transition flex items-center justify-between">
                        <span className="line-clamp-1">{item.name}</span>
                        {item.price && (
                          <span className="text-sm font-extrabold text-[#d70f64] shrink-0 ml-2">
                            ${item.price.toFixed(2)}
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {item.description || (isRestaurant ? 'Handcrafted delicious recipes & meals' : `Offered at ${item.restaurant?.name || 'Partner Kitchen'}`)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1 text-slate-700">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.deliveryTimeMin || item.restaurant?.deliveryTimeMin || 20}-{item.deliveryTimeMax || item.restaurant?.deliveryTimeMax || 35} mins</span>
                      </div>
                      <span className="text-[#d70f64] font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition">
                        {isRestaurant ? 'View Restaurant' : 'Order Dish'} <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
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
