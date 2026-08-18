'use client';

import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import api from '@/lib/api';
import { ShieldCheck, Bike, RefreshCw, MapPin } from 'lucide-react';

export default function AdminDispatchPage() {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDispatchData = async () => {
    try {
      const res = await api.get('/orders');
      if (res.data?.success) {
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
    let isMounted = true;

    const initDispatchMap = async () => {
      if (typeof window === 'undefined' || !mapContainer.current) return;

      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (!isMounted) return;

      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      // Leaflet OpenStreetMap Dark Matter CartoDB Basemap
      const map = L.map(mapContainer.current, {
        center: [14.5995, 120.9842],
        zoom: 13,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      // 1. Central Dispatch Hub Pin (OpenStreetMap)
      const hubIcon = L.divIcon({
        className: 'custom-osm-hub-pin',
        html: `<div style="
          background: #9333ea;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 20px;
          box-shadow: 0 4px 16px rgba(147, 51, 234, 0.6);
          border: 3px solid white;
          outline: 4px solid rgba(147, 51, 234, 0.3);
        ">👑</div>`,
        iconSize: [42, 42],
        iconAnchor: [21, 21],
        popupAnchor: [0, -22],
      });

      L.marker([14.5995, 120.9842], { icon: hubIcon })
        .bindPopup('<strong style="font-size:12px; color:#1e293b;">Central Dispatch City Hub</strong>')
        .addTo(map);

      // 2. Active Riders on City Fleet Map (OpenStreetMap)
      const ridersMock = [
        { lng: 120.9810, lat: 14.6020, name: 'Rider #1 (Active Delivery)' },
        { lng: 120.9890, lat: 14.5950, name: 'Rider #2 (Waiting Job)' },
        { lng: 120.9780, lat: 14.5910, name: 'Rider #3 (Enroute Dropoff)' },
      ];

      ridersMock.forEach((r) => {
        const riderIcon = L.divIcon({
          className: 'custom-osm-fleet-pin',
          html: `<div style="
            background: #10b981;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.5);
            border: 2px solid white;
          ">🛵</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -20],
        });

        L.marker([r.lat, r.lng], { icon: riderIcon })
          .bindPopup(`<strong style="font-size:12px; color:#1e293b;">${r.name}</strong>`)
          .addTo(map);
      });

      mapInstance.current = map;
    };

    initDispatchMap();

    return () => {
      isMounted = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <DashboardLayout role="ADMIN" title="Citywide Fleet Dispatch Map">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl">
          <div>
            <h2 className="text-xl font-black tracking-tight">Live Fleet Dispatch Map (OpenStreetMap)</h2>
            <p className="text-xs text-slate-400 mt-1">Real-time OpenStreetMap citywide visualization of active riders, pending orders, and route paths.</p>
          </div>

          <button
            onClick={fetchDispatchData}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Fleet
          </button>
        </div>

        {/* Dispatch Map Container */}
        <div className="w-full h-[540px] rounded-3xl overflow-hidden border border-slate-700 shadow-2xl relative">
          <div ref={mapContainer} className="w-full h-full" />
        </div>
      </div>
    </DashboardLayout>
  );
}
