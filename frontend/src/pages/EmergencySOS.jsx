import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, MapPin, Phone, MessageSquare, Navigation, CheckCircle2, AlertTriangle, LifeBuoy, HeartPulse, ShieldCheck, Activity, Clock } from 'lucide-react';
import { api } from '../services/api';
import MapView from '../components/MapView';

export default function EmergencySOS({ location, emitSOS, connected, setToast }) {
  const [activeSOS, setActiveSOS] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sentStatus, setSentStatus] = useState(null); // 'sending' | 'success' | 'error'
  const [selectedUrgency, setSelectedUrgency] = useState('CRITICAL');

  useEffect(() => {
    const fetchActive = () => {
      api.getActiveSOS().then(res => {
        setActiveSOS(res?.active || []);
        setLoading(false);
      });
    };
    fetchActive();
    const interval = setInterval(fetchActive, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const [holdProgress, setHoldProgress] = useState(0);
  const holdIntervalRef = useRef(null);

  const startHold = () => {
    if (isSending || sentStatus === 'success') return;
    setHoldProgress(0);
    holdIntervalRef.current = setInterval(() => {
      setHoldProgress(prev => {
        if (prev >= 100) {
          clearInterval(holdIntervalRef.current);
          handleSOS();
          return 100;
        }
        return prev + 2; // ~1 second hold
      });
    }, 20);
  };

  const stopHold = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      if (holdProgress < 100) setHoldProgress(0);
    }
  };

  const handleSOS = async () => {
    if (!location.lat || !location.lng) {
      setToast({ type: 'warning', message: 'Location not ready. Please wait for GPS lock.' });
      return;
    }
    setIsSending(true);
    setSentStatus('sending');
    try {
      console.log('Broadcasting SOS...', { lat: location.lat, lng: location.lng, urgency: selectedUrgency });
      const res = await api.triggerSOS({
        lat: location.lat,
        lng: location.lng,
        address: location.address || 'Unknown Address',
        urgencyLevel: selectedUrgency,
        timestamp: new Date().toISOString()
      });
      if (res?.success) {
        emitSOS({ lat: location.lat, lng: location.lng, address: location.address, urgency: selectedUrgency });
        setSentStatus('success');
        setToast({ type: 'success', message: 'Emergency broadcast sent successfully!' });
        setTimeout(() => {
          setSentStatus(null);
          setHoldProgress(0);
        }, 5000);
      } else {
        setSentStatus('error');
        setToast({ type: 'error', message: 'Failed to broadcast SOS. Please call emergency services directly.' });
      }
    } catch (err) {
      console.error('SOS Broadcast Failed:', err);
      setSentStatus('error');
      setToast({ type: 'error', message: 'Network error. SOS could not be sent.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="sos-root">
      <div className="sos-container-layout">
        {/* Top: Emergency Stats (Real-time friendliness) */}
        <div className="sos-stats-bar glass-card">
          <div className="stat-pill">
            <span className="label">ACTIVE</span>
            <span className="value">{activeSOS.length}</span>
          </div>
          <div className="stat-pill">
            <span className="label">GPS STATUS</span>
            <span className={`value ${location.lat ? 'green' : 'red'}`}>{location.lat ? 'LOCKED' : 'SEARCHING...'}</span>
          </div>
          <div className="stat-pill">
            <span className="label">NETWORK</span>
            <span className={`value ${connected ? 'green' : 'red'}`}>{connected ? 'STABLE' : 'CONNECTING...'}</span>
          </div>
        </div>

        <div className="sos-main-content">
          {/* Map Column */}
          <div className="sos-map-panel glass-card">
          <MapView 
            location={location} 
            services={[]} 
            incidents={activeSOS}
          />
          <div className="map-overlay-info">
            <div className="live-status">
              <span className="pulse-dot"></span>
              Live Incident Map
            </div>
          </div>
        </div>

        {/* SOS Trigger Control */}
        <div className="sos-control-panel">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sos-card glass-card main-trigger"
          >
            <div className="sos-header">
              <ShieldAlert size={32} className="icon-pulse-red" />
              <div>
                <h2>Emergency Broadcast</h2>
                <p>Instant notification to all nearby trauma units and responders</p>
              </div>
            </div>

            <div className="urgency-selector">
              <p className="label">Select Urgency Level</p>
              <div className="urgency-options">
                {['CRITICAL', 'SERIOUS', 'MINOR'].map(level => (
                  <button 
                    key={level}
                    className={`urgency-btn ${level.toLowerCase()} ${selectedUrgency === level ? 'active' : ''}`}
                    onClick={() => setSelectedUrgency(level)}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="trigger-container">
              <motion.button
                whileHover={{ scale: location.lat ? 1.02 : 1 }}
                whileTap={{ scale: location.lat ? 0.98 : 1 }}
                disabled={isSending || !location.lat}
                onMouseDown={startHold}
                onMouseUp={stopHold}
                onMouseLeave={stopHold}
                onTouchStart={startHold}
                onTouchEnd={stopHold}
                className={`sos-master-btn ${sentStatus === 'success' ? 'success' : ''} ${isSending ? 'loading' : ''} ${!location.lat ? 'disabled' : ''}`}
              >
                <div className="hold-fill" style={{ height: `${holdProgress}%` }}></div>
                <div className="btn-glow"></div>
                <span className="btn-content">
                  {!location.lat ? 'WAITING FOR GPS...' : isSending ? 'BROADCASTING...' : sentStatus === 'success' ? 'ALERTS SENT' : 'HOLD TO TRIGGER SOS'}
                </span>
              </motion.button>
              <p className="hold-hint">
                {location.lat 
                  ? 'Hold for 1 second to confirm emergency broadcast' 
                  : 'Acquiring satellite lock for precise trauma targeting...'}
              </p>
            </div>

            <div className="location-footer glass-card">
              <MapPin size={16} color="var(--accent-red)" />
              <div className="loc-text">
                <span className="addr">{location.address || 'Locating...'}</span>
                <span className="coords">{location.lat?.toFixed(5)}, {location.lng?.toFixed(5)}</span>
              </div>
              <div className={`status-dot ${connected ? 'online' : 'offline'}`}></div>
            </div>
          </motion.div>

          <div className="quick-action-grid">
            <div className="action-card glass-card trauma">
              <HeartPulse size={24} />
              <h4>Trauma Unit</h4>
              <p>Direct line to critical care</p>
              <a href="tel:112" className="call-link">Call 112</a>
            </div>
            <div className="action-card glass-card rescue">
              <LifeBuoy size={24} />
              <h4>Vehicle Rescue</h4>
              <p>Roadside & towing aid</p>
              <a href="tel:108" className="call-link">Call 108</a>
            </div>
          </div>

          {/* Live Environment Card (New - Real-time friendliness) */}
          <div className="live-env-card glass-card">
            <div className="env-header">
              <Activity size={18} />
              <h4>Local Environment</h4>
            </div>
            <div className="env-stats">
              <div className="env-item">
                <span className="label">ROAD GRIP</span>
                <span className="value optimal">OPTIMAL</span>
              </div>
              <div className="env-item">
                <span className="label">VISIBILITY</span>
                <span className="value">10 KM</span>
              </div>
              <div className="env-item">
                <span className="label">WIND</span>
                <span className="value">12 KM/H</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Incidents & Monitoring */}
        <div className="sos-monitor-panel">
          <div className="monitor-header">
            <h3><Activity size={20} /> Active Incident Monitor</h3>
            <div className="live-tag">
              <span className="dot animate-pulse"></span>
              LIVE
            </div>
          </div>

          <div className="incident-list">
            <AnimatePresence mode="popLayout">
              {activeSOS.length > 0 ? (
                activeSOS.map((sos, i) => (
                  <motion.div 
                    key={sos.id || i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`incident-alert glass-card ${sos.urgencyLevel?.toLowerCase() || 'high'}`}
                  >
                    <div className="alert-badge">{sos.urgencyLevel || 'HIGH'}</div>
                    <div className="alert-content">
                      <div className="alert-time">
                        <Clock size={12} />
                        {new Date(sos.timestamp).toLocaleTimeString()}
                      </div>
                      <p className="alert-addr"><Navigation size={14} /> {sos.address}</p>
                      
                      {/* Responder Details (Real-time friendliness) */}
                      <div className="responder-status glass-card">
                        <div className="status-top">
                          <span className="status-label">RESPONDER STATUS</span>
                          <span className="eta">ETA: 6-8 MIN</span>
                        </div>
                        <div className="progress-bar-mini">
                          <div className="progress-fill-mini" style={{ width: '45%' }}></div>
                        </div>
                        <p className="status-desc">Unit dispatched from nearby trauma center</p>
                      </div>

                      <div className="alert-actions">
                        <button className="action-btn"><Phone size={14} /> Responder</button>
                        <button className="action-btn secondary"><ShieldCheck size={14} /> Track</button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="empty-monitor glass-card">
                  <CheckCircle2 size={48} />
                  <h4>No Active Incidents</h4>
                  <p>Monitoring regional emergency frequencies...</p>
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="emergency-protocol glass-card">
            <h4><ShieldCheck size={16} /> Emergency Protocol</h4>
            <ol>
              <li>Stay calm and move to a safe zone.</li>
              <li>Trigger the SOS broadcast above.</li>
              <li>Keep your phone line open for responders.</li>
              <li>If possible, provide first aid until help arrives.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>

      <style>{`
        .sos-root {
          padding: 20px;
          height: calc(100vh - 64px);
          background: var(--bg-primary);
          overflow-y: auto;
        }

        .sos-container-layout {
          max-width: 1600px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .sos-stats-bar {
          display: flex;
          gap: 24px;
          padding: 12px 24px;
        }

        .stat-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .stat-pill .label { color: var(--text-muted); }
        .stat-pill .value.green { color: var(--accent-green); }
        .stat-pill .value.red { color: var(--accent-red); animation: pulse-red 1s infinite; }

        .sos-main-content {
          display: grid;
          grid-template-columns: 1fr 1fr 0.8fr;
          gap: 20px;
          height: 700px;
        }

        .sos-map-panel {
          position: relative;
          overflow: hidden;
          height: 100%;
        }

        .map-overlay-info {
          position: absolute;
          top: 10px; left: 10px;
          z-index: 1000;
        }

        .live-status {
          background: var(--bg-glass);
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 8px;
          color: white;
        }

        .pulse-dot {
          width: 8px; height: 8px;
          background: var(--accent-red);
          border-radius: 50%;
          animation: pulse-red 1.5s infinite;
        }

        .sos-control-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
          height: 100%;
        }

        .sos-card.main-trigger {
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 32px;
          flex: 1;
          justify-content: center;
        }

        .sos-header {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .sos-header h2 {
          font-family: var(--font-head);
          font-size: 2rem;
          margin-bottom: 4px;
        }

        .sos-header p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .icon-pulse-red {
          color: var(--accent-red);
          animation: pulse-red 2s infinite;
        }

        .urgency-selector .label {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 12px;
        }

        .urgency-options {
          display: flex;
          gap: 12px;
        }

        .urgency-btn {
          flex: 1;
          padding: 12px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--bg-glass-2);
          color: var(--text-secondary);
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all var(--transition);
        }

        .urgency-btn.critical.active { background: var(--accent-red); color: white; border-color: var(--accent-red); box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3); }
        .urgency-btn.serious.active { background: var(--accent-orange); color: white; border-color: var(--accent-orange); box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3); }
        .urgency-btn.minor.active { background: var(--accent-blue); color: white; border-color: var(--accent-blue); box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3); }

        .trigger-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .sos-master-btn {
          width: 100%;
          max-width: 400px;
          height: 120px;
          border-radius: 20px;
          border: none;
          background: linear-gradient(135deg, #ef4444, #991b1b);
          color: white;
          font-size: 1.25rem;
          font-weight: 800;
          font-family: var(--font-head);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(239, 68, 68, 0.4);
          transition: all var(--spring);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .sos-master-btn.disabled {
          background: var(--bg-glass-2);
          color: var(--text-muted);
          cursor: not-allowed;
          box-shadow: none;
        }

        .hold-fill {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          background: rgba(255, 255, 255, 0.15);
          transition: height 0.05s linear;
          pointer-events: none;
        }

        .sos-master-btn.success { background: var(--accent-green); box-shadow: 0 10px 30px rgba(34, 197, 94, 0.4); }

        .btn-glow {
          position: absolute;
          top: 0; left: -100%;
          width: 100%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          animation: btn-shine 3s infinite;
        }

        .hold-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        .location-footer {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.03);
        }

        .loc-text {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .loc-text .addr { font-size: 0.85rem; font-weight: 600; }
        .loc-text .coords { font-size: 0.7rem; color: var(--text-muted); font-family: monospace; }

        .status-dot { width: 10px; height: 10px; border-radius: 50%; }
        .status-dot.online { background: var(--accent-green); box-shadow: 0 0 10px var(--accent-green); }
        .status-dot.offline { background: var(--accent-red); }

        .quick-action-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .action-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .action-card.trauma { border-left: 4px solid var(--accent-red); }
        .action-card.rescue { border-left: 4px solid var(--accent-orange); }

        .action-card h4 { font-size: 1rem; font-weight: 700; }
        .action-card p { font-size: 0.75rem; color: var(--text-secondary); }
        .call-link { font-size: 0.85rem; font-weight: 700; color: var(--accent-red); text-decoration: none; margin-top: 8px; }

        .live-env-card {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .env-header {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-muted);
        }

        .env-header h4 {
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .env-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }

        .env-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 10px;
          background: var(--bg-glass-2);
          border-radius: 8px;
        }

        .env-item .label {
          font-size: 0.55rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .env-item .value {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .env-item .value.optimal {
          color: var(--accent-green);
        }

        .sos-monitor-panel {
          display: flex;
          flex-direction: column;
          gap: 20px;
          height: 100%;
          overflow-y: auto;
          padding-right: 4px;
        }

        .monitor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .live-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: rgba(239, 68, 68, 0.1);
          color: var(--accent-red);
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 800;
        }

        .incident-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .incident-alert {
          padding: 16px;
          border-left: 4px solid var(--accent-red);
          position: relative;
        }

        .incident-alert.serious { border-left-color: var(--accent-orange); }
        .incident-alert.minor { border-left-color: var(--accent-blue); }

        .responder-status {
          padding: 12px;
          margin-bottom: 16px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
        }

        .status-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .status-label {
          font-size: 0.6rem;
          font-weight: 800;
          color: var(--text-muted);
        }

        .eta {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--accent-blue);
        }

        .progress-bar-mini {
          height: 4px;
          background: var(--bg-glass-2);
          border-radius: 2px;
          margin-bottom: 8px;
          overflow: hidden;
        }

        .progress-fill-mini {
          height: 100%;
          background: var(--accent-blue);
          border-radius: 2px;
          animation: progress-slide 2s infinite ease-in-out;
        }

        @keyframes progress-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }

        .status-desc {
          font-size: 0.65rem;
          color: var(--text-secondary);
        }

        .alert-badge {
          position: absolute;
          top: 12px; right: 12px;
          font-size: 0.6rem;
          font-weight: 800;
          padding: 2px 6px;
          background: var(--bg-glass-2);
          border-radius: 4px;
        }

        .alert-time { display: flex; align-items: center; gap: 4px; font-size: 0.7rem; color: var(--text-muted); margin-bottom: 8px; }
        .alert-addr { font-size: 0.85rem; font-weight: 600; margin-bottom: 16px; display: flex; align-items: center; gap: 6px; }

        .alert-actions { display: flex; gap: 8px; }
        .action-btn {
          flex: 1;
          padding: 8px;
          border-radius: 6px;
          border: none;
          background: var(--accent-red);
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
        }

        .action-btn.secondary { background: var(--bg-glass-2); color: var(--text-primary); border: 1px solid var(--border); }

        .empty-monitor {
          height: 200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: var(--text-muted);
          gap: 12px;
        }

        .emergency-protocol {
          padding: 20px;
          background: rgba(59, 130, 246, 0.05);
        }

        .emergency-protocol h4 { margin-bottom: 12px; display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }
        .emergency-protocol ol { padding-left: 20px; font-size: 0.8rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 8px; }

        @keyframes pulse-red {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes btn-shine {
          0% { left: -100%; }
          20% { left: 100%; }
          100% { left: 100%; }
        }

        @media (max-width: 900px) {
          .sos-container { grid-template-columns: 1fr; }
          .sos-root { overflow-y: auto; }
        }
      `}</style>
    </div>
  );
}
