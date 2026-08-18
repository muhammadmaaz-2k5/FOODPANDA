'use client';

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function LiveMap({
  restaurantLocation = { lat: 14.5995, lng: 120.9842, name: 'Restaurant' },
  customerLocation = { lat: 14.6050, lng: 120.9900, name: 'Delivery Address' },
  riderLocation = null,
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const riderMarker = useRef(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const startLng = restaurantLocation.lng || 120.9842;
    const startLat = restaurantLocation.lat || 14.5995;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [startLng, startLat],
      zoom: 13.5,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      // 1. Restaurant Pin Marker
      const restEl = document.createElement('div');
      restEl.className = 'w-8 h-8 rounded-full bg-[#d70f64] text-white flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white';
      restEl.innerHTML = '🍔';
      new mapboxgl.Marker(restEl)
        .setLngLat([startLng, startLat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>${restaurantLocation.name}</strong>`))
        .addTo(map.current);

      // 2. Customer Pin Marker
      const custLng = customerLocation.lng || 120.9900;
      const custLat = customerLocation.lat || 14.6050;
      const custEl = document.createElement('div');
      custEl.className = 'w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white';
      custEl.innerHTML = '📍';
      new mapboxgl.Marker(custEl)
        .setLngLat([custLng, custLat])
        .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>${customerLocation.name}</strong>`))
        .addTo(map.current);

      // 3. Connect line between points
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [startLng, startLat],
              riderLocation ? [riderLocation.lng, riderLocation.lat] : [(startLng + custLng) / 2, (startLat + custLat) / 2],
              [custLng, custLat],
            ],
          },
        },
      });

      map.current.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#d70f64',
          'line-width': 4,
          'line-dasharray': [2, 2],
        },
      });

      // Fit bounds to show both spots
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([startLng, startLat]);
      bounds.extend([custLng, custLat]);
      if (riderLocation) bounds.extend([riderLocation.lng, riderLocation.lat]);
      map.current.fitBounds(bounds, { padding: 60 });
    });

    return () => {
      map.current?.remove();
    };
  }, [restaurantLocation, customerLocation]);

  // Update moving rider marker smoothly
  useEffect(() => {
    if (!map.current || !riderLocation) return;

    if (!riderMarker.current) {
      const riderEl = document.createElement('div');
      riderEl.className = 'w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-base shadow-xl border-2 border-white ring-4 ring-emerald-200 animate-bounce';
      riderEl.innerHTML = '🛵';

      riderMarker.current = new mapboxgl.Marker(riderEl)
        .setLngLat([riderLocation.lng, riderLocation.lat])
        .addTo(map.current);
    } else {
      riderMarker.current.setLngLat([riderLocation.lng, riderLocation.lat]);
    }
  }, [riderLocation]);

  return (
    <div className="w-full h-80 rounded-3xl overflow-hidden shadow-inner border border-slate-200 relative">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
