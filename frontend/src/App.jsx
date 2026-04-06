import { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

import Header         from './components/Header';
import Toast          from './components/Toast';
import Home           from './pages/Home';
import Dashboard      from './pages/Dashboard';
import SafetyInsights from './pages/SafetyInsights';
import EmergencySOS   from './pages/EmergencySOS';

import { useGeolocation } from './hooks/useGeolocation';
import { useSocket }      from './hooks/useSocket';
import { api }            from './services/api';

export default function App() {
  const location                = useGeolocation();
  const { connected, emitSOS, lastAlert, setLastAlert, newHazard, setNewHazard } = useSocket();

  const [insights, setInsights]           = useState(null);
  const [toast, setToast]                 = useState(null);

  // ── Notify user on remote SOS ─────────────────────────────────────────────
  useEffect(() => {
    if (lastAlert) {
      setToast({ 
        type: 'error', 
        message: `🚨 REMOTE SOS: ${lastAlert.urgencyLevel || 'CRITICAL'} emergency near ${lastAlert.address || 'Unknown'}` 
      });
      setLastAlert(null);
    }
  }, [lastAlert, setLastAlert]);

  // ── Notify user on remote Hazard ──────────────────────────────────────────
  useEffect(() => {
    if (newHazard) {
      setToast({ 
        type: 'warning', 
        message: `⚠️ NEW HAZARD: ${newHazard.type} reported at ${newHazard.address}` 
      });
      setNewHazard(null);
    }
  }, [newHazard, setNewHazard]);

  const geocodedRef = useRef(false);

  // ── Geocode address after location is known ───────────────────────────────
  useEffect(() => {
    if (!location.lat || !location.lng || geocodedRef.current) return;
    geocodedRef.current = true;
    api.geocode(location.lat, location.lng).then(res => {
      if (res?.address) location.setAddress(res.address);
    });
  }, [location]);

  // ── Fetch AI insights (refresh every 5 min) ───────────────────────────────
  const fetchInsights = useCallback(() => {
    if (!location.lat || !location.lng) return;
    api.getInsights(location.lat, location.lng).then(res => {
      if (res) setInsights(res);
    });
  }, [location.lat, location.lng]);

  useEffect(() => {
    fetchInsights();
    const interval = setInterval(fetchInsights, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchInsights]);

  const riskLevel = insights?.currentRisk || null;

  return (
    <Router>
      <div className="app-shell">
        <Header connected={connected} location={location} riskLevel={riskLevel} />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route 
            path="/dashboard" 
            element={<Dashboard location={location} riskLevel={riskLevel} setToast={setToast} />} 
          />
          <Route 
            path="/insights" 
            element={<SafetyInsights setToast={setToast} location={location} />} 
          />
          <Route 
            path="/sos" 
            element={<EmergencySOS location={location} emitSOS={emitSOS} connected={connected} setToast={setToast} />} 
          />
        </Routes>

        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </div>
    </Router>
  );
}
