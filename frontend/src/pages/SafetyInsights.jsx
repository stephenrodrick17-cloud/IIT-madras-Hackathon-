import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, Clock, Activity, Calendar, ShieldCheck, MapPin, Wind, Zap, Gauge, Map as MapIcon, Info, Users, ShieldAlert } from 'lucide-react';
import { api } from '../services/api';
import MapView from '../components/MapView';

export default function SafetyInsights({ setToast, location }) {
  const [insights, setInsights] = useState(null);
  const [hazards, setHazards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      Promise.all([
        api.getInsights(location?.lat, location?.lng),
        api.getHazards()
      ]).then(([iRes, hRes]) => {
        if (iRes) setInsights(iRes);
        if (hRes?.reports) setHazards(hRes.reports);
        setLoading(false);
      });
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [location]);

  if (loading) return (
    <div className="loading-container">
      <Activity className="animate-spin" size={48} color="var(--accent-red)" />
      <h3>Generating Predictive Safety Report...</h3>
    </div>
  );

  return (
    <div className="insights-root">
      <header className="insights-header">
        <div className="header-info">
          <h1>Safety Analytics Command</h1>
          <p>Real-time predictive modeling and historical accident patterns</p>
        </div>
        <div className="header-meta glass-card">
          <Calendar size={16} />
          <span>Last Updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </header>

      <div className="insights-grid-main">
        {/* Row 1: Map Visualization */}
        <div className="analysis-row full-row">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="map-viz-card-full glass-card"
          >
            <div className="card-header">
              <div className="title-group">
                <MapIcon size={18} />
                <h3>Real-Time Traffic & Hazard Intelligence</h3>
              </div>
              <div className="status-badge live">LIVE NETWORK FEED</div>
            </div>
            <div className="map-container-insights">
              {location?.lat && location?.lng ? (
                <MapView 
                  location={location} 
                  services={[]} 
                  hazards={hazards}
                  showTraffic={true}
                  insights={insights}
                />
              ) : (
                <div className="map-placeholder">
                  <Activity className="animate-pulse" />
                  <span>Waiting for GPS Signal...</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Row 2: Traffic Flow & Congestion */}
        <div className="analysis-row traffic-row">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="chart-card glass-card traffic-volume"
          >
            <div className="card-header">
              <div className="title-group">
                <TrendingUp size={18} />
                <h3>Traffic Flow Volume (24h)</h3>
              </div>
              <div className="status-badge live">LIVE FEED</div>
            </div>
            <div className="volume-chart">
              {insights?.trafficFlow?.hourlyVolume?.map((v, i) => (
                <div key={i} className="volume-bar-group">
                  <div className="bar-wrapper">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${(v.volume / 1000) * 100}%` }}
                      className={`bar-fill ${v.volume > 800 ? 'high' : 'normal'}`}
                    />
                  </div>
                  <span className="bar-label">{v.hour}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="metric-card glass-card congestion-meter"
          >
            <div className="card-header">
              <Gauge size={18} />
              <h3>Congestion Level</h3>
            </div>
            <div className="meter-main">
              <div className="meter-circle">
                <svg viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="var(--bg-glass-2)" strokeWidth="10" />
                  <motion.circle 
                    cx="50" cy="50" r="45" fill="none" 
                    stroke={insights?.trafficFlow?.congestionIndex > 0.7 ? 'var(--accent-red)' : 'var(--accent-blue)'} 
                    strokeWidth="10"
                    strokeDasharray="283"
                    initial={{ strokeDashoffset: 283 }}
                    animate={{ strokeDashoffset: 283 - (283 * (insights?.trafficFlow?.congestionIndex || 0.5)) }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="meter-value">
                  <span className="val">{(insights?.trafficFlow?.congestionIndex * 100).toFixed(0)}%</span>
                  <span className="lab">{insights?.trafficFlow?.currentDensity}</span>
                </div>
              </div>
              <div className="speed-info">
                <div className="speed-stat">
                  <span className="l">Avg. Speed</span>
                  <span className="v">{insights?.trafficFlow?.avgSpeed} km/h</span>
                </div>
                <div className="speed-stat">
                  <span className="l">Road Occupancy</span>
                  <span className="v">{(insights?.trafficFlow?.congestionIndex * 100 + 12).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Row 2: Speed Distribution & Hotspots */}
        <div className="analysis-row">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="chart-card glass-card speed-analysis"
          >
            <div className="card-header">
              <Zap size={18} />
              <h3>Speed Distribution %</h3>
            </div>
            <div className="speed-grid">
              {insights?.trafficFlow?.speedDistribution?.map((s, i) => (
                <div key={i} className="speed-item">
                  <div className="speed-label">{s.range} km/h</div>
                  <div className="speed-bar">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${s.percentage}%` }}
                      className="speed-fill"
                    />
                  </div>
                  <div className="speed-pct">{s.percentage}%</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="analysis-card glass-card hotspot-list"
          >
            <div className="card-header">
              <MapIcon size={18} />
              <h3>Risk Hotspots</h3>
            </div>
            <div className="hotspot-items">
              {insights?.hotspots?.map(h => (
                <div key={h.id} className="hotspot-item">
                  <div className="h-info">
                    <span className="h-name">{h.name}</span>
                    <span className="h-accidents">{h.accidents} accidents / month</span>
                  </div>
                  <div className={`h-badge ${h.risk.toLowerCase()}`}>{h.risk}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Row 3: Metrics */}
        <div className="metrics-row">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="metric-card glass-card"
          >
            <div className="metric-header">
              <Activity size={20} color="var(--accent-red)" />
              <span>Current Risk Index</span>
            </div>
            <div className="metric-value">
              <span className={`number ${insights?.currentRisk?.toLowerCase()}`}>{insights?.riskScore}%</span>
              <span className="label">{insights?.currentRisk}</span>
            </div>
            <div className="metric-footer">
              <TrendingUp size={14} />
              <span>{insights?.currentPeriod}</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="metric-card glass-card"
          >
            <div className="metric-header">
              <Wind size={20} color="var(--accent-blue)" />
              <span>Environmental Factor</span>
            </div>
            <div className="metric-value">
              <span className="number">{insights?.weather?.temp || 24}°C</span>
              <span className="label">{insights?.weather?.desc || 'CLEAR'}</span>
            </div>
            <div className="metric-footer">
              <ShieldCheck size={14} />
              <span>Road Grip: OPTIMAL</span>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="metric-card glass-card"
          >
            <div className="metric-header">
              <Clock size={20} color="var(--accent-green)" />
              <span>Avg. Response Time</span>
            </div>
            <div className="metric-value">
              <span className="number">{insights?.avgResponseTime?.ambulance || 8.4}m</span>
              <span className="label">EXCELLENT</span>
            </div>
            <div className="metric-footer">
              <MapPin size={14} />
              <span>Region: Active Coverage</span>
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="protocol-section glass-card"
      >
        <div className="protocol-header">
          <ShieldCheck size={24} color="var(--accent-green)" />
          <h3>Active Safety Protocols</h3>
        </div>
        <div className="protocol-grid">
          <div className="protocol-item">
            <div className="p-num">01</div>
            <div className="p-text">
              <strong>Night Patrol</strong>
              <p>Increased police presence in high-risk zones from 22:00 - 04:00.</p>
            </div>
          </div>
          <div className="protocol-item">
            <div className="p-num">02</div>
            <div className="p-text">
              <strong>Trauma Standby</strong>
              <p>Ambulance units stationed within 2km of major accident hotspots.</p>
            </div>
          </div>
          <div className="protocol-item">
            <div className="p-num">03</div>
            <div className="p-text">
              <strong>Dynamic Speed</strong>
              <p>Real-time speed limit adjustments based on weather visibility.</p>
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        .insights-root {
          padding: 30px;
          height: calc(100vh - 64px);
          overflow-y: auto;
          background: var(--bg-primary);
        }
        .insights-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .header-info h1 { font-family: var(--font-head); font-size: 2.2rem; margin-bottom: 4px; }
        .header-info p { color: var(--text-secondary); }
        .header-meta { display: flex; align-items: center; gap: 10px; padding: 10px 20px; font-size: 0.85rem; color: var(--text-secondary); }
        .insights-grid-main { max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; gap: 24px; }
        .analysis-row { display: grid; gap: 24px; grid-template-columns: 1.5fr 1fr; }
        .analysis-row.traffic-row { grid-template-columns: 1fr 380px; }
        .analysis-row.full-row { grid-template-columns: 1fr; }

        .map-viz-card-full {
          padding: 24px;
        }

        .map-container-insights {
          height: 450px;
          border-radius: var(--radius);
          overflow: hidden;
          position: relative;
          background: var(--bg-secondary);
        }

        .map-placeholder {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: var(--text-muted);
        }

        .chart-card, .analysis-card, .metric-card { padding: 24px; }
        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; color: var(--text-secondary); }
        .card-header h3 { font-family: var(--font-head); font-size: 1.1rem; }
        .volume-chart { display: flex; align-items: flex-end; justify-content: space-between; height: 180px; padding-top: 20px; }
        .volume-bar-group { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .volume-bar-group .bar-wrapper { width: 14px; height: 100%; background: var(--bg-glass-2); border-radius: 99px; display: flex; align-items: flex-end; overflow: hidden; }
        .volume-bar-group .bar-fill { width: 100%; border-radius: 99px; background: var(--accent-blue); transition: height 1s ease; }
        .volume-bar-group .bar-fill.high { background: linear-gradient(to top, var(--accent-red), var(--accent-orange)); }
        .bar-label { font-size: 0.65rem; color: var(--text-muted); font-weight: 600; }
        .status-badge.live { font-size: 0.65rem; font-weight: 800; padding: 4px 8px; background: rgba(239, 68, 68, 0.1); color: var(--accent-red); border-radius: 4px; }
        .meter-main { display: flex; flex-direction: column; align-items: center; gap: 24px; }
        .meter-circle { position: relative; width: 150px; height: 150px; }
        .meter-value { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; }
        .meter-value .val { font-size: 2rem; font-weight: 800; font-family: var(--font-head); }
        .meter-value .lab { font-size: 0.6rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
        .speed-info { width: 100%; display: flex; justify-content: space-around; }
        .speed-stat { display: flex; flex-direction: column; align-items: center; }
        .speed-stat .l { font-size: 0.65rem; color: var(--text-muted); font-weight: 600; }
        .speed-stat .v { font-size: 1rem; font-weight: 700; color: var(--text-primary); }
        .speed-grid { display: flex; flex-direction: column; gap: 16px; }
        .speed-item { display: grid; grid-template-columns: 80px 1fr 40px; align-items: center; gap: 12px; }
        .speed-label { font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; }
        .speed-bar { height: 6px; background: var(--bg-glass-2); border-radius: 3px; overflow: hidden; }
        .speed-fill { height: 100%; background: var(--accent-purple); border-radius: 3px; }
        .speed-pct { font-size: 0.75rem; font-weight: 700; text-align: right; }
        .hotspot-items { display: flex; flex-direction: column; gap: 12px; }
        .hotspot-item { padding: 12px; background: var(--bg-glass-2); border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
        .h-info { display: flex; flex-direction: column; gap: 2px; }
        .h-name { font-size: 0.9rem; font-weight: 700; }
        .h-accidents { font-size: 0.7rem; color: var(--text-muted); }
        .h-badge { font-size: 0.6rem; font-weight: 800; padding: 4px 8px; border-radius: 4px; }
        .h-badge.critical { background: rgba(239, 68, 68, 0.1); color: var(--accent-red); }
        .h-badge.high { background: rgba(249, 115, 22, 0.1); color: var(--accent-orange); }
        .h-badge.medium { background: rgba(59, 130, 246, 0.1); color: var(--accent-blue); }
        .metrics-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .metric-header { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }
        .metric-value { display: flex; align-items: baseline; gap: 12px; }
        .metric-value .number { font-size: 3rem; font-weight: 800; font-family: var(--font-head); }
        .metric-value .label { font-size: 1rem; font-weight: 700; text-transform: uppercase; }
        .number.high { color: var(--accent-red); }
        .number.medium { color: var(--accent-orange); }
        .number.low { color: var(--accent-green); }
        .metric-footer { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; color: var(--text-secondary); }
        .protocol-section { padding: 30px; margin-top: 24px; }
        .protocol-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
        .protocol-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
        .protocol-item { display: flex; gap: 16px; }
        .p-num { font-size: 1.5rem; font-weight: 800; color: var(--bg-glass-2); font-family: var(--font-head); }
        .p-text strong { display: block; font-size: 1rem; margin-bottom: 4px; }
        .p-text p { font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; }
        .loading-container { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 20px; color: var(--text-muted); }
        @media (max-width: 1100px) {
          .metrics-row, .analysis-row, .protocol-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
