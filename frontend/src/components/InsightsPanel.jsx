import { motion } from 'framer-motion';
import { Activity, Thermometer, Wind, CloudRain, AlertCircle, TrendingUp, Clock, Info } from 'lucide-react';

export default function InsightsPanel({ insights, riskLevel, fullWidth = false }) {
  if (!insights) return (
    <div className="insights-panel-compact glass-card">
      <div className="loading-state">
        <Activity className="animate-pulse" />
        <p>Analyzing conditions...</p>
      </div>
    </div>
  );

  const { riskScore, currentPeriod, weather, suggestions, avgResponseTime } = insights;

  return (
    <div className={`insights-panel-compact glass-card ${fullWidth ? 'full-width' : ''}`}>
      <div className="panel-header-mini">
        <Activity size={18} className="icon-pulse" />
        <h3>Live Safety Status</h3>
      </div>

      <div className="risk-overview-mini">
        <div className="risk-score-circle">
          <svg viewBox="0 0 36 36" className="circular-chart">
            <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
            <path className={`circle ${riskLevel?.toLowerCase()}`}
              strokeDasharray={`${riskScore}, 100`}
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="score-text">
            <span className="number">{riskScore}%</span>
            <span className="label">RISK</span>
          </div>
        </div>
        <div className="risk-details">
          <h4 className={riskLevel?.toLowerCase()}>{riskLevel} RISK</h4>
          <p>{currentPeriod}</p>
        </div>
      </div>

      {weather && (
        <div className="weather-strip glass-card">
          <div className="weather-item">
            <Thermometer size={14} />
            <span>{weather.temp}°C</span>
          </div>
          <div className="weather-item">
            {weather.desc.includes('Rain') ? <CloudRain size={14} /> : <Wind size={14} />}
            <span>{weather.desc}</span>
          </div>
        </div>
      )}

      <div className="insights-section">
        <h5><AlertCircle size={14} /> Critical Suggestions</h5>
        <div className="mini-suggestions">
          {suggestions?.map((s, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: 5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="mini-suggestion-item"
            >
              {s}
            </motion.div>
          ))}
        </div>
      </div>

      {avgResponseTime && (
        <div className="insights-section">
          <h5><Clock size={14} /> Response Times</h5>
          <div className="mini-stats-grid">
            <div className="mini-stat">
              <span className="val">{avgResponseTime?.ambulance}m</span>
              <span className="lab">EMS</span>
            </div>
            <div className="mini-stat">
              <span className="val">{avgResponseTime?.police}m</span>
              <span className="lab">Police</span>
            </div>
            <div className="mini-stat">
              <span className="val">{avgResponseTime?.hospital}m</span>
              <span className="lab">Fire</span>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .insights-panel-compact {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 20px;
          height: 100%;
          overflow-y: auto;
        }

        .insights-panel-compact.full-width {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          align-items: start;
        }

        .panel-header-mini {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-secondary);
        }

        .panel-header-mini h3 {
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .icon-pulse {
          color: var(--accent-red);
          animation: pulse 2s infinite;
        }

        .risk-overview-mini {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .risk-score-circle {
          position: relative;
          width: 80px;
          height: 80px;
        }

        .circular-chart {
          display: block;
          margin: 0 auto;
          max-width: 100%;
          max-height: 100%;
        }

        .circle-bg {
          fill: none;
          stroke: var(--bg-glass-2);
          stroke-width: 3;
        }

        .circle {
          fill: none;
          stroke-width: 3;
          stroke-linecap: round;
          transition: stroke-dasharray 0.3s ease;
        }

        .circle.high { stroke: var(--accent-red); }
        .circle.medium { stroke: var(--accent-orange); }
        .circle.low { stroke: var(--accent-green); }

        .score-text {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .score-text .number {
          font-size: 1.1rem;
          font-weight: 800;
          font-family: var(--font-head);
          line-height: 1;
        }

        .score-text .label {
          font-size: 0.5rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .risk-details h4 {
          font-size: 1.1rem;
          font-weight: 800;
          font-family: var(--font-head);
        }

        .risk-details p {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .risk-details h4.high { color: var(--accent-red); }
        .risk-details h4.medium { color: var(--accent-orange); }
        .risk-details h4.low { color: var(--accent-green); }

        .weather-strip {
          display: flex;
          justify-content: space-around;
          padding: 10px;
          background: rgba(255, 255, 255, 0.03);
        }

        .weather-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .insights-section h5 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .mini-suggestions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .mini-suggestion-item {
          font-size: 0.8rem;
          padding: 8px 12px;
          background: var(--bg-glass-2);
          border-radius: 8px;
          border-left: 3px solid var(--accent-blue);
        }

        .mini-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .mini-stat {
          background: var(--bg-glass-2);
          padding: 10px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .mini-stat .val {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--accent-blue);
        }

        .mini-stat .lab {
          font-size: 0.6rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--text-muted);
          gap: 12px;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
