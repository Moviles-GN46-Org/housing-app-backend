const FilterStrategy = require('./filterStrategy');
const { haversineDistance } = require('../../utils/haversine');

class DistanceFilter extends FilterStrategy {
  /**
   * @param {Array} properties - Array of property objects with latitude/longitude
   * @param {{ lat: number, lng: number, radiusKm: number }} params
   * @returns {Array} properties within the radius, each augmented with distanceKm
   */
  filter(properties, { lat, lng, radiusKm }) {
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radius = parseFloat(radiusKm);

    return properties
      .map((p) => ({
        ...p,
        distanceKm: haversineDistance(userLat, userLng, p.latitude, p.longitude),
      }))
      .filter((p) => p.distanceKm <= radius);
  }
}

module.exports = DistanceFilter;
