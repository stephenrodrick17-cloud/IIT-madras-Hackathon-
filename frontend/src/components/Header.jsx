import { useState, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Shield, LayoutDashboard, Activity, AlertTriangle, PhoneCall, MapPin } from 'lucide-react';

export default function Header({ connected, location, riskLevel }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const riskClass = riskLevel === 'HIGH' ? 'danger' : riskLevel === 'MEDIUM' ? 'warning' : '';

  return (
    <header className="header">
      {/* Brand */}
      <Link to="/" className="header-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="logo-dot" />
        <span style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ResQRoute
        </span>
      </Link>

      {/* Navigation */}
      <nav className="header-nav">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/insights" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <Activity size={18} />
          <span>Safety Insights</span>
        </NavLink>
        <NavLink to="/sos" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <AlertTriangle size={18} />
          <span>Emergency SOS</span>
        </NavLink>
      </nav>

      {/* Status & Actions */}
      <div className="header-status">
        <div className={`status-pill ${riskClass}`}>
          <span className="dot" />
          {riskLevel ? `Risk: ${riskLevel}` : 'Analyzing...'}
        </div>

        <div className="location-pill" title={location.address}>
          <MapPin size={14} color="var(--accent-red)" />
          <span className="address-text">{location.address || 'Locating...'}</span>
        </div>

        <div className="header-time">
          {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </div>

        <Link to="/sos" className="sos-trigger-btn">
          <PhoneCall size={16} />
          <span>SOS</span>
        </Link>
      </div>

      <style>{`
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          height: 64px;
          background: rgba(10, 15, 30, 0.8);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .header-nav {
          display: flex;
          gap: 8px;
          background: var(--bg-glass-2);
          padding: 4px;
          border-radius: var(--radius);
          border: 1px solid var(--border);
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 16px;
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 500;
          transition: all var(--transition);
        }

        .nav-link:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.05);
        }

        .nav-link.active {
          color: var(--text-primary);
          background: var(--accent-red);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        }

        .location-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: var(--bg-glass-2);
          border-radius: 99px;
          border: 1px solid var(--border);
          max-width: 200px;
        }

        .address-text {
          font-size: 0.75rem;
          color: var(--text-secondary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sos-trigger-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--accent-red);
          color: white;
          border-radius: 99px;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.85rem;
          transition: all var(--spring);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }

        .sos-trigger-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
          background: var(--accent-red-2);
        }

        @media (max-width: 900px) {
          .header-nav span, .sos-trigger-btn span { display: none; }
          .location-pill { display: none; }
        }
      `}</style>
    </header>
  );
}
