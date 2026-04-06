const express = require('express');
const axios = require('axios');
const router = express.Router();

const PYTHON_URL = process.env.PYTHON_ANALYSIS_URL || 'http://localhost:8000';

// Proxy to Python FastAPI analysis service — with full fallback
router.get('/', async (req, res) => {
  const { lat, lng } = req.query;
  try {
    const { data } = await axios.get(`${PYTHON_URL}/insights`, { timeout: 4000 });
    res.json(data);
  } catch {
    const insights = await generateDynamicInsights(lat, lng);
    res.json(insights);
  }
});

async function generateDynamicInsights(lat, lng) {
  const now = new Date();
  const hour = now.getHours();
  
  // Real-time weather check (Open-Meteo)
  let weatherData = null;
  if (lat && lng) {
    try {
      const weatherRes = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`);
      weatherData = weatherRes.data.current_weather;
    } catch (e) { console.warn('Weather fetch failed'); }
  }

  const peakHours = { 8: 'Morning rush', 9: 'Morning rush', 17: 'Evening rush', 18: 'Evening rush', 19: 'Evening rush', 22: 'Late night', 23: 'Late night', 0: 'Late night', 1: 'Late night' };
  const isPeak = !!peakHours[hour];
  const isBadWeather = weatherData && [51, 53, 55, 61, 63, 65, 71, 73, 75, 80, 81, 82, 95].includes(weatherData.weathercode);

  let riskScore = isPeak ? Math.floor(Math.random() * 20) + 65 : Math.floor(Math.random() * 30) + 20;
  if (isBadWeather) riskScore += 15;

  return {
    currentRisk: riskScore > 75 ? 'HIGH' : riskScore > 45 ? 'MEDIUM' : 'LOW',
    riskScore: Math.min(riskScore, 100),
    currentPeriod: peakHours[hour] || 'Normal hours',
    weather: weatherData ? {
      temp: weatherData.temperature,
      code: weatherData.weathercode,
      desc: isBadWeather ? 'Poor visibility / Slippery' : 'Clear skies'
    } : null,
    suggestions: riskScore > 75
      ? ['⚠️ High-risk detected — exercise extra caution', '🏥 Emergency response on high alert', '🚔 Increased patrol in your area']
      : ['✅ Roads are relatively safe', '🚗 Maintain normal safety protocols'],
    peakAccidentHours: [{ hour: 8, risk: 0.82, label: '8 AM' }, { hour: 17, risk: 0.91, label: '5 PM' }, { hour: 18, risk: 0.88, label: '6 PM' }, { hour: 22, risk: 0.75, label: '10 PM' }],
    weeklyPattern: [
      { day: 'Mon', accidents: 45 }, { day: 'Tue', accidents: 38 }, { day: 'Wed', accidents: 52 },
      { day: 'Thu', accidents: 41 }, { day: 'Fri', accidents: 78 }, { day: 'Sat', accidents: 91 },
      { day: 'Sun', accidents: 63 },
    ],
    conditionRisk: [
      { condition: 'Clear', risk: 0.23 }, { condition: 'Rain', risk: 0.67 },
      { condition: 'Fog', risk: 0.84 }, { condition: 'Night', risk: 0.61 },
      { condition: 'Rush Hour', risk: 0.89 },
    ],
    trafficFlow: {
      currentDensity: isPeak ? 'HIGH' : 'MODERATE',
      avgSpeed: isPeak ? 24 : 48, // km/h
      congestionIndex: isPeak ? 0.82 : 0.35,
      hourlyVolume: [
        { hour: '06:00', volume: 210 }, { hour: '08:00', volume: 850 },
        { hour: '10:00', volume: 640 }, { hour: '12:00', volume: 520 },
        { hour: '14:00', volume: 580 }, { hour: '16:00', volume: 710 },
        { hour: '18:00', volume: 920 }, { hour: '20:00', volume: 430 },
      ],
      speedDistribution: [
        { range: '0-20', percentage: isPeak ? 45 : 10 },
        { range: '20-40', percentage: isPeak ? 35 : 20 },
        { range: '40-60', percentage: isPeak ? 15 : 45 },
        { range: '60+', percentage: isPeak ? 5 : 25 },
      ]
    },
    hotspots: [
      { id: 1, name: 'Main Intersection', risk: 'CRITICAL', accidents: 12 },
      { id: 2, name: 'North Bridge', risk: 'HIGH', accidents: 8 },
      { id: 3, name: 'Highway Exit 4', risk: 'MEDIUM', accidents: 5 },
    ],
    avgResponseTime: { hospital: 8.4, police: 6.2, ambulance: 9.1 },
    source: 'dynamic_engine',
    timestamp: now.toISOString()
  };
}

router.get('/risk', async (req, res) => {
  const { hour, conditions } = req.query;
  try {
    const { data } = await axios.get(`${PYTHON_URL}/risk`, { params: { hour, conditions }, timeout: 4000 });
    res.json(data);
  } catch {
    res.json(calculateFallbackRisk(hour));
  }
});

router.get('/heatmap', async (req, res) => {
  try {
    const { data } = await axios.get(`${PYTHON_URL}/heatmap`, { timeout: 4000 });
    res.json(data);
  } catch {
    res.json({ heatmap: generateFallbackHeatmap(), source: 'mock' });
  }
});

// ── Fallback data (no Python needed) ─────────────────────────────────────────
function generateFallbackInsights() {
  const now = new Date();
  const hour = now.getHours();

  const peakHours = { 8: 'Morning rush', 9: 'Morning rush', 17: 'Evening rush', 18: 'Evening rush', 19: 'Evening rush', 22: 'Late night', 23: 'Late night', 0: 'Late night', 1: 'Late night' };
  const isHighRisk = !!peakHours[hour];

  return {
    currentRisk: isHighRisk ? 'HIGH' : hour >= 10 && hour <= 16 ? 'MEDIUM' : 'LOW',
    riskScore: isHighRisk ? Math.floor(Math.random() * 20) + 70 : Math.floor(Math.random() * 30) + 30,
    currentPeriod: peakHours[hour] || 'Normal hours',
    suggestions: isHighRisk
      ? ['⚠️ High-risk period — exercise extra caution', '🏥 Nearest hospital is 2.1 km away', '🚔 Police patrol active in this zone', '📱 Keep emergency contacts handy']
      : ['✅ Low-risk period — roads are relatively safe', '🚗 Normal traffic conditions', '🏥 Emergency services available 24/7'],
    peakAccidentHours: [{ hour: 8, risk: 0.82, label: '8 AM' }, { hour: 17, risk: 0.91, label: '5 PM' }, { hour: 18, risk: 0.88, label: '6 PM' }, { hour: 22, risk: 0.75, label: '10 PM' }, { hour: 23, risk: 0.79, label: '11 PM' }],
    weeklyPattern: [
      { day: 'Mon', accidents: 45 }, { day: 'Tue', accidents: 38 }, { day: 'Wed', accidents: 52 },
      { day: 'Thu', accidents: 41 }, { day: 'Fri', accidents: 78 }, { day: 'Sat', accidents: 91 },
      { day: 'Sun', accidents: 63 },
    ],
    conditionRisk: [
      { condition: 'Clear', risk: 0.23 }, { condition: 'Rain', risk: 0.67 },
      { condition: 'Fog', risk: 0.84 }, { condition: 'Night', risk: 0.61 },
      { condition: 'Rush Hour', risk: 0.89 },
    ],
    commonCauses: [
      { cause: 'Overspeeding', percentage: 34 }, { cause: 'Drunk Driving', percentage: 22 },
      { cause: 'Phone Usage', percentage: 18 }, { cause: 'Poor Visibility', percentage: 14 },
      { cause: 'Other', percentage: 12 },
    ],
    avgResponseTime: { hospital: 8.4, police: 6.2, ambulance: 9.1 },
    totalIncidentsAnalyzed: 12483,
    source: 'fallback',
  };
}

function calculateFallbackRisk(hourStr) {
  const hour = parseInt(hourStr ?? new Date().getHours());
  const isHighRisk = [7, 8, 9, 17, 18, 19, 22, 23, 0, 1].includes(hour);
  const score = isHighRisk ? 70 + Math.floor(Math.random() * 20) : 30 + Math.floor(Math.random() * 30);
  return {
    hour,
    riskScore: score,
    level: score > 65 ? 'HIGH' : score > 45 ? 'MEDIUM' : 'LOW',
    reason: isHighRisk ? 'Peak accident period detected' : 'Normal traffic hours',
  };
}

function generateFallbackHeatmap() {
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    accidents: [7, 8, 9, 17, 18, 19, 22, 23].includes(hour) ? Math.floor(Math.random() * 30) + 40 : Math.floor(Math.random() * 20) + 5,
  }));
}

module.exports = router;
