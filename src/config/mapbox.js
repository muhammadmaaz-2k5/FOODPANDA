const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;

/**
 * Forward Geocoding using Mapbox Geocoding API v5
 * @param {string} query 
 * @returns {Promise<Array>}
 */
const geocodeAddress = async (query) => {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=5`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox geocode failed: ${response.statusText}`);
    }
    const data = await response.json();
    return (data.features || []).map((feature) => ({
      placeName: feature.place_name,
      longitude: feature.center[0],
      latitude: feature.center[1],
      context: feature.context,
    }));
  } catch (error) {
    console.error('Mapbox Geocode Error:', error.message);
    return [];
  }
};

/**
 * Reverse Geocoding using Mapbox Geocoding API v5
 * @param {number} latitude 
 * @param {number} longitude 
 * @returns {Promise<Object|null>}
 */
const reverseGeocode = async (latitude, longitude) => {
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${MAPBOX_ACCESS_TOKEN}&limit=1`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox reverse geocode failed: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      return {
        placeName: feature.place_name,
        address: feature.text,
        city: feature.context?.find(c => c.id.startsWith('place'))?.text || null,
        country: feature.context?.find(c => c.id.startsWith('country'))?.text || null,
        postalCode: feature.context?.find(c => c.id.startsWith('postcode'))?.text || null,
      };
    }
    return null;
  } catch (error) {
    console.error('Mapbox Reverse Geocode Error:', error.message);
    return null;
  }
};

/**
 * Get estimated driving distance (km) and duration (mins) using Mapbox Directions Matrix API
 * @param {number} originLat 
 * @param {number} originLng 
 * @param {number} destLat 
 * @param {number} destLng 
 * @returns {Promise<{distanceKm: number, durationMinutes: number}>}
 */
const getRouteEstimate = async (originLat, originLng, destLat, destLng) => {
  try {
    const coordinates = `${originLng},${originLat};${destLng},${destLat}`;
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?access_token=${MAPBOX_ACCESS_TOKEN}&overview=false`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Mapbox directions error: ${response.statusText}`);
    }
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      return {
        distanceKm: parseFloat((route.distance / 1000).toFixed(2)),
        durationMinutes: Math.ceil(route.duration / 60),
      };
    }
  } catch (error) {
    console.warn('Mapbox Routing Fallback to Haversine:', error.message);
  }

  // Fallback to Haversine calculation if external API fails
  const { calculateDistance } = require('../utils/geo.util');
  const distanceKm = calculateDistance(originLat, originLng, destLat, destLng);
  // Assume avg 25 km/h urban delivery speed
  const durationMinutes = Math.max(10, Math.ceil((distanceKm / 25) * 60) + 15); // +15 mins prep/handoff
  return { distanceKm, durationMinutes };
};

module.exports = {
  MAPBOX_ACCESS_TOKEN,
  geocodeAddress,
  reverseGeocode,
  getRouteEstimate,
};
