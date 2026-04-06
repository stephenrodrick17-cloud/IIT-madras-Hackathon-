// Central API service — all backend calls live here
const BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

async function req(path, opts = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...opts,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch (err) {
    console.warn(`API error [${path}]:`, err.message);
    return null;
  }
}

export const api = {
  // Emergency services
  getNearbyServices: (lat, lng, radius = 5000) =>
    req(`/api/emergency/nearby?lat=${lat}&lng=${lng}&radius=${radius}`),

  geocode: (lat, lng) =>
    req(`/api/emergency/geocode?lat=${lat}&lng=${lng}`),

  // SOS
  triggerSOS: (payload) =>
    req('/api/sos/trigger', { method: 'POST', body: JSON.stringify(payload) }),

  getActiveSOS: () => req('/api/sos/active'),

  resolveSOS: (id) =>
    req(`/api/sos/${id}/resolve`, { method: 'PATCH' }),

  // Insights
  getInsights: (lat, lng) => 
    req(`/api/insights?${lat && lng ? `lat=${lat}&lng=${lng}` : ''}`),
  getRisk: (hour, conditions) =>
    req(`/api/insights/risk?hour=${hour}&conditions=${conditions}`),

  // Hazards
  getHazards: () => req('/api/hazards'),
  reportHazard: (payload) => 
    req('/api/hazards/report', { method: 'POST', body: JSON.stringify(payload) }),
  voteHazard: (id) => 
    req(`/api/hazards/${id}/vote`, { method: 'PATCH' }),

  // Health
  health: () => req('/api/health'),
};
