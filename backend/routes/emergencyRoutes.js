const express = require('express');
const axios = require('axios');
const router = express.Router();

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const PLACES_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';

// Fetch nearby emergency services via Google Places API
router.get('/nearby', async (req, res) => {
  const { lat, lng, radius = 5000 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  // If no API key → use OSM Overpass API for real data instead of just mock
  if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'your_google_maps_api_key_here') {
    return fetchOSMServices(parseFloat(lat), parseFloat(lng), radius, res);
  }

  try {
    const serviceTypes = [
      { type: 'hospital', keyword: 'trauma center hospital', icon: '🏥', category: 'trauma' },
      { type: 'hospital', keyword: 'emergency ambulance service', icon: '🚑', category: 'ambulance' },
      { type: 'police', keyword: 'police station traffic police', icon: '🚔', category: 'police' },
      { type: 'car_repair', keyword: 'vehicle rescue towing service', icon: '🛟', category: 'rescue' },
    ];

    const results = await Promise.all(
      serviceTypes.map(({ type, keyword, icon, category }) =>
        axios.get(PLACES_URL, {
          params: {
            location: `${lat},${lng}`,
            radius,
            type,
            keyword,
            key: GOOGLE_API_KEY,
          },
        }).then(r =>
          r.data.results.slice(0, 5).map(p => ({
            id: p.place_id,
            name: p.name,
            category,
            icon,
            address: p.vicinity,
            lat: p.geometry.location.lat,
            lng: p.geometry.location.lng,
            rating: p.rating || null,
            openNow: p.opening_hours?.open_now ?? null,
            distance: haversine(parseFloat(lat), parseFloat(lng), p.geometry.location.lat, p.geometry.location.lng),
          }))
        )
      )
    );

    const services = results.flat().sort((a, b) => a.distance - b.distance);
    res.json({ services, source: 'google_places' });
  } catch (err) {
    console.error('Google Places error:', err.message);
    res.json({ services: generateMockServices(parseFloat(lat), parseFloat(lng)).services, source: 'mock_fallback' });
  }
});

// Geocode a lat/lng to a human-readable address
router.get('/geocode', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

  if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'your_google_maps_api_key_here') {
    return res.json({ address: `Location: ${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}` });
  }

  try {
    const r = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: { latlng: `${lat},${lng}`, key: GOOGLE_API_KEY },
    });
    const address = r.data.results[0]?.formatted_address || 'Unknown location';
    res.json({ address });
  } catch (err) {
    res.json({ address: `${parseFloat(lat).toFixed(5)}, ${parseFloat(lng).toFixed(5)}` });
  }
});

// ── OSM Data Fetching (No key required) ──────────────────────────────────────
async function fetchOSMServices(lat, lng, radius, res) {
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="hospital"](around:${radius},${lat},${lng});
      node["amenity"="police"](around:${radius},${lat},${lng});
      node["amenity"="fire_station"](around:${radius},${lat},${lng});
      node["emergency"="ambulance"](around:${radius},${lat},${lng});
      node["emergency"="trauma"](around:${radius},${lat},${lng});
      node["amenity"="car_repair"](around:${radius},${lat},${lng});
    );
    out body;
    >;
    out skel qt;
  `;
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(url, { timeout: 10000 });
    const services = response.data.elements.map(p => {
       const amenity = p.tags.amenity;
       const emergency = p.tags.emergency;
       
       let category = 'ambulance';
       let icon = '🚑';

       if (emergency === 'trauma' || (amenity === 'hospital' && p.tags.name?.toLowerCase().includes('trauma'))) {
         category = 'trauma';
         icon = '🏥';
       } else if (amenity === 'police') {
         category = 'police';
         icon = '🚔';
       } else if (amenity === 'car_repair' || p.tags.name?.toLowerCase().includes('rescue') || p.tags.name?.toLowerCase().includes('towing')) {
         category = 'rescue';
         icon = '🛟';
       } else if (amenity === 'hospital') {
         category = 'trauma';
         icon = '🏥';
       }
      
      return {
        id: p.id,
        name: p.tags.name || `${category.charAt(0).toUpperCase() + category.slice(1)} Service`,
        category,
        icon,
        address: p.tags['addr:street'] || 'Nearby area',
        lat: p.lat,
        lng: p.lon,
        rating: 4.5, // Mocked rating
        openNow: true,
        distance: haversine(lat, lng, p.lat, p.lon),
      };
    }).sort((a, b) => a.distance - b.distance);

    if (services.length === 0) {
      console.warn('No OSM data found for this area');
      return res.json({ services: generateMockServices(lat, lng).services, source: 'mock_fallback', message: 'No local data found, using estimated locations' });
    }
    res.json({ services, source: 'openstreetmap' });
  } catch (err) {
    const isRateLimit = err.response?.status === 429;
    console.warn(`OSM Error (${isRateLimit ? 'Rate Limited' : err.message}), falling back to mock`);
    res.json({ 
      services: generateMockServices(lat, lng).services, 
      source: 'mock_fallback', 
      error: isRateLimit ? 'Service busy' : 'Fetch failed' 
    });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
}

function generateMockServices(lat, lng) {
  const offsets = [
    [0.012, 0.015], [-0.009, 0.022], [0.025, -0.011],
    [-0.018, -0.008], [0.031, 0.019], [-0.004, 0.037],
  ];
  const hospitals = [
    'City General Hospital', 'Apollo Emergency Center', 'St. Mary\'s Hospital',
    'Care Emergency Hospital', 'AIIMS Trauma Center',
  ];
  const police = [
    'Central Police Station', 'Traffic Police HQ', 'Highway Patrol Unit',
    'City Police Station', 'Emergency Response Unit',
  ];
  const ambulance = [
    'City Fire & Ambulance', 'LifeLine Emergency Services', 'Swift Ambulance Unit',
    'Red Cross Emergency', '108 Ambulance Service',
  ];

  const services = [];
  offsets.forEach(([dlat, dlng], i) => {
    const slat = lat + dlat;
    const slng = lng + dlng;
    const idx = i % 5;
    if (i < 2)
      services.push({ id: `hospital-${i}`, name: hospitals[idx], category: 'hospital', icon: '🏥', address: `${Math.floor(Math.random() * 200) + 1} Medical Ave`, lat: slat, lng: slng, rating: (3.5 + Math.random() * 1.5).toFixed(1), openNow: true, distance: haversine(lat, lng, slat, slng), phone: '+911234567890', estimatedTime: Math.floor(Math.random() * 10) + 3 });
    else if (i < 4)
      services.push({ id: `police-${i}`, name: police[idx], category: 'police', icon: '🚔', address: `${Math.floor(Math.random() * 200) + 1} Law Road`, lat: slat, lng: slng, rating: (4 + Math.random()).toFixed(1), openNow: true, distance: haversine(lat, lng, slat, slng), phone: '+91100', estimatedTime: Math.floor(Math.random() * 8) + 2 });
    else
      services.push({ id: `ambulance-${i}`, name: ambulance[idx], category: 'ambulance', icon: '🚑', address: `${Math.floor(Math.random() * 200) + 1} Emergency Blvd`, lat: slat, lng: slng, rating: (4.2 + Math.random() * 0.8).toFixed(1), openNow: true, distance: haversine(lat, lng, slat, slng), phone: '+91108', estimatedTime: Math.floor(Math.random() * 6) + 2 });
  });

  return { services: services.sort((a, b) => a.distance - b.distance), source: 'mock_data' };
}

module.exports = router;
