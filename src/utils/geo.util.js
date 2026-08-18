/**
 * Calculate Haversine distance between two coordinates in kilometers
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} distance in km
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const radLat1 = (Math.PI * lat1) / 180;
  const radLat2 = (Math.PI * lat2) / 180;
  const theta = lon1 - lon2;
  const radTheta = (Math.PI * theta) / 180;
  let dist =
    Math.sin(radLat1) * Math.sin(radLat2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.cos(radTheta);
  if (dist > 1) dist = 1;
  dist = Math.acos(dist);
  dist = (dist * 180) / Math.PI;
  dist = dist * 60 * 1.1515 * 1.609344; // km
  return parseFloat(dist.toFixed(2));
};

/**
 * Check if a point (lat, lng) is inside a GeoJSON Polygon / array of [lng, lat] vertices
 * Ray-casting algorithm
 * @param {number} lat 
 * @param {number} lng 
 * @param {Object|Array} polygon GeoJSON Geometry or array of coordinates
 * @returns {boolean}
 */
const isPointInPolygon = (lat, lng, polygon) => {
  let coords = [];
  if (polygon && polygon.type === 'Polygon' && polygon.coordinates) {
    coords = polygon.coordinates[0]; // exterior ring
  } else if (Array.isArray(polygon)) {
    coords = polygon;
  } else {
    return true; // if no valid polygon specified, assume in range
  }

  let inside = false;
  for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
    const xi = coords[i][0]; // lng
    const yi = coords[i][1]; // lat
    const xj = coords[j][0]; // lng
    const yj = coords[j][1]; // lat

    const intersect = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

/**
 * Calculate dynamic delivery fee based on distance and delivery tier
 * @param {number} distanceKm 
 * @param {string} tier 'STANDARD' | 'EXPRESS' | 'PRIORITY'
 * @returns {number}
 */
const calculateDeliveryFee = (distanceKm, tier = 'STANDARD') => {
  const baseFee = 2.0; // Base $2.00
  const perKmRate = 0.75; // $0.75 per km
  let fee = baseFee + distanceKm * perKmRate;

  if (tier === 'EXPRESS') {
    fee += 1.5;
  } else if (tier === 'PRIORITY') {
    fee += 3.0;
  }

  return parseFloat(fee.toFixed(2));
};

module.exports = {
  calculateDistance,
  isPointInPolygon,
  calculateDeliveryFee,
};
