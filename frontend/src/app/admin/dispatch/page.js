'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import api from '@/lib/api';
import { ShieldCheck, Bike, ArrowLeft, RefreshCw, MapPin } from 'lucide-react';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function AdminDispatchPage() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDispatchData = async () => {
    try {
      const res = await api.get('/orders');
      if (res.data.success) {
        setOrders(res.data.data || []);
      }
    } catch (err) {
      console.error('Dispatch fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatchData();
  }, []);

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [120.9842, 14.5995],
      zoom: 13,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      // Add Central City Hub Pin
      const hubEl = document.createElement('div');
      hubEl.className = 'w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xl border-2 border-white ring-4 ring-purple-400/40';
      hubEl.innerHTML = '👑';
      new mapboxgl.Marker(hubEl)
        .setLngLat([120.9842, 14.5995])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<strong>Central Dispatch City Hub</strong>'))
        .addTo(map.current);

      // Add Rider Fleet Mock Pins
      const ridersMock = [
        { lng: 120.9810, lat: 14.6020, name: 'Rider #1 (Active Delivery)' },
        { lng: 120.9890, lat: 14.5950, name: 'Rider #2 (Waiting Job)' },
        { lng: 120.9780, lat: 14.5910, name: 'Rider #3 (Enroute Dropoff)' },
      ];

      ridersMock.forEach((r) => {
        const el = document.createElement('div');
        el.className = 'w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shadow-lg border-2 border-white animate-bounce';
        el.innerHTML = '🛵';
        new mapboxgl.Marker(el)
          .setLngLat([r.lng, r.lat])
          .setPopup(new mapboxgl.Popup({ offset: 20 }).setHTML(`<strong>${r.name}</strong>`))
          .addTo(map.current);
      });
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <DashboardLayout role="ADMIN" title="Citywide Fleet Dispatch Map">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl">
          <div>
            <h2 className="text-xl font-black tracking-tight">Live Fleet Dispatch Map</h2>
            <p className="text-xs text-slate-400 mt-1">Real-time citywide visualization of active riders, pending orders, and route paths.</p>
          </div>

          <button
            onClick={fetchDispatchData}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Fleet
          </button>
        </div>

        {/* Dispatch Map Container */}
        <div className="w-full h-[540px] rounded-3xl overflow-hidden border border-slate-300 shadow-2xl relative">
          <div ref={mapContainer} className="w-full h-full" />
        </div>
      </div>
    </DashboardLayout>
  );
}
