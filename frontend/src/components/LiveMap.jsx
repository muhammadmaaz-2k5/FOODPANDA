'use client';

import React, { useEffect, useRef } from 'react';

export default function LiveMap({
  restaurantLocation = { lat: 14.5995, lng: 120.9842, name: 'Restaurant' },
  customerLocation = { lat: 14.6050, lng: 120.9900, name: 'Delivery Address' },
  riderLocation = null,
}) {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);
  const riderMarkerRef = useRef(null);
  const polylineRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const initLeaflet = async () => {
      if (typeof window === 'undefined' || !mapContainer.current) return;

      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      if (!isMounted) return;

      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }

      const restLat = restaurantLocation.lat || 14.5995;
      const restLng = restaurantLocation.lng || 120.9842;
      const custLat = customerLocation.lat || 14.6050;
      const custLng = customerLocation.lng || 120.9900;

      // Initialize OpenStreetMap Leaflet Map
      const map = L.map(mapContainer.current, {
        center: [(restLat + custLat) / 2, (restLng + custLng) / 2],
        zoom: 14,
        zoomControl: false,
      });

      // High-performance OpenStreetMap CartoDB Tiles
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      // 1. Restaurant Pin (Foodpanda styled)
      const restaurantIcon = L.divIcon({
        className: 'custom-osm-rest-pin',
        html: `<div style="
          background: #d70f64;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(215, 15, 100, 0.4);
          border: 3px solid white;
        ">🍔</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -20],
      });

      L.marker([restLat, restLng], { icon: restaurantIcon })
        .bindPopup(`<strong style="font-size:12px; color:#1e293b;">🏪 ${restaurantLocation.name || 'Restaurant Kitchen'}</strong>`)
        .addTo(map);

      // 2. Customer Pin
      const customerIcon = L.divIcon({
        className: 'custom-osm-cust-pin',
        html: `<div style="
          background: #0f172a;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 18px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.4);
          border: 3px solid white;
        ">📍</div>`,
        iconSize: [38, 38],
        iconAnchor: [19, 19],
        popupAnchor: [0, -20],
      });

      L.marker([custLat, custLng], { icon: customerIcon })
        .bindPopup(`<strong style="font-size:12px; color:#1e293b;">🏠 ${customerLocation.name || 'Delivery Address'}</strong>`)
        .addTo(map);

      // 3. Real-Time Route Polyline Path
      const routePoints = [
        [restLat, restLng],
        riderLocation ? [riderLocation.lat, riderLocation.lng] : [(restLat + custLat) / 2, (restLng + custLng) / 2],
        [custLat, custLng],
      ];

      polylineRef.current = L.polyline(routePoints, {
        color: '#d70f64',
        weight: 4,
        opacity: 0.85,
        dashArray: '6, 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      // 4. Initial Rider Pin
      if (riderLocation?.lat && riderLocation?.lng) {
        const riderIcon = L.divIcon({
          className: 'custom-osm-rider-pin',
          html: `<div style="
            background: #10b981;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 22px;
            box-shadow: 0 6px 16px rgba(16, 185, 129, 0.5);
            border: 3px solid white;
            outline: 4px solid rgba(16, 185, 129, 0.25);
          ">🛵</div>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -24],
        });

        riderMarkerRef.current = L.marker([riderLocation.lat, riderLocation.lng], { icon: riderIcon })
          .bindPopup('<strong style="font-size:12px; color:#065f46;">🛵 Live Delivery Rider</strong>')
          .addTo(map);
      }

      const bounds = L.latLngBounds([[restLat, restLng], [custLat, custLng]]);
      if (riderLocation?.lat && riderLocation?.lng) {
        bounds.extend([riderLocation.lat, riderLocation.lng]);
      }
      map.fitBounds(bounds, { padding: [50, 50] });

      mapInstance.current = map;
    };

    initLeaflet();

    return () => {
      isMounted = false;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [restaurantLocation.lat, restaurantLocation.lng, customerLocation.lat, customerLocation.lng]);

  // Real-Time GPS updates for moving rider
  useEffect(() => {
    if (!mapInstance.current || !riderLocation?.lat || !riderLocation?.lng) return;

    const updateRider = async () => {
      const L = (await import('leaflet')).default;
      const riderLatLng = [riderLocation.lat, riderLocation.lng];

      if (!riderMarkerRef.current) {
        const riderIcon = L.divIcon({
          className: 'custom-osm-rider-pin',
          html: `<div style="
            background: #10b981;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 22px;
            box-shadow: 0 6px 16px rgba(16, 185, 129, 0.5);
            border: 3px solid white;
            outline: 4px solid rgba(16, 185, 129, 0.25);
          ">🛵</div>`,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -24],
        });

        riderMarkerRef.current = L.marker(riderLatLng, { icon: riderIcon })
          .bindPopup('<strong style="font-size:12px; color:#065f46;">🛵 Live Delivery Rider</strong>')
          .addTo(mapInstance.current);
      } else {
        riderMarkerRef.current.setLatLng(riderLatLng);
      }

      if (polylineRef.current) {
        const restLat = restaurantLocation.lat || 14.5995;
        const restLng = restaurantLocation.lng || 120.9842;
        const custLat = customerLocation.lat || 14.6050;
        const custLng = customerLocation.lng || 120.9900;
        polylineRef.current.setLatLngs([[restLat, restLng], riderLatLng, [custLat, custLng]]);
      }
    };

    updateRider();
  }, [riderLocation]);

  return (
    <div className="w-full h-80 rounded-3xl overflow-hidden shadow-inner border border-slate-200 relative">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
