import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MapView        from '../components/MapView';
import ServicesSidebar from '../components/ServicesSidebar';
import InsightsPanel  from '../components/InsightsPanel';
import HazardModal   from '../components/HazardModal';
import { api }            from '../services/api';
import { LayoutGrid, Map as MapIcon, BarChart3, Bell, Settings, AlertCircle } from 'lucide-react';

export default function Dashboard({ location, riskLevel, setToast }) {
  const [services, setServices]           = useState([]);
  const [hazards, setHazards]             = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [insights, setInsights]           = useState(null);
  const [activeTab, setActiveTab]         = useState('map'); // 'map' | 'analytics'
  const [isHazardModalOpen, setIsHazardModalOpen] = useState(false);

  useEffect(() => {
    if (!location.lat || !location.lng) return;
    setServicesLoading(true);
    
    // Fetch everything
    Promise.all([
      api.getNearbyServices(location.lat, location.lng),
      api.getInsights(location.lat, location.lng),
      api.getHazards()
    ]).then(([sRes, iRes, hRes]) => {
      if (sRes?.services) {
        setServices(sRes.services);
        if (sRes.source === 'mock_fallback') {
          setToast({ type: 'info', message: 'Using regional data estimates for this area.' });
        }
      }
      if (iRes) setInsights(iRes);
      if (hRes?.reports) setHazards(hRes.reports);
      else setHazards([]);
      setServicesLoading(false);
    }).catch(err => {
      console.error('Fetch error:', err);
      setServicesLoading(false);
      setHazards([]);
      setServices([]);
    });
  }, [location.lat, location.lng]);

  const handleReportHazard = async ({ type, description, severity }) => {
    if (!location.lat || !location.lng) return;
    
    try {
      const res = await api.reportHazard({
        type,
        lat: location.lat,
        lng: location.lng,
        address: location.address,
        description,
        severity
      });
      if (res.success) {
        setHazards(prev => [res.report, ...prev]);
        setToast({ type: 'success', message: 'Hazard reported to community!' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to report hazard.' });
    }
  };

  return (
    <div className="dashboard-root">
      {/* Sidebar Navigation */}
      <nav className="dashboard-nav glass-card">
        <div className="nav-top">
          <button className={`nav-item ${activeTab === 'map' ? 'active' : ''}`} onClick={() => setActiveTab('map')}>
            <MapIcon size={20} />
            <span>Map View</span>
          </button>
          <button className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            <BarChart3 size={20} />
            <span>Analytics</span>
          </button>
        </div>
        <div className="nav-bottom">
          <button className="nav-item">
            <Bell size={20} />
            <span>Alerts</span>
          </button>
          <button className="nav-item">
            <Settings size={20} />
            <span>Settings</span>
          </button>
          <button className="nav-item report-btn" onClick={() => setIsHazardModalOpen(true)}>
            <AlertCircle size={20} color="var(--accent-red)" />
            <span>Report</span>
          </button>
        </div>
      </nav>

      <main className="dashboard-main">
        <AnimatePresence mode="wait">
          {activeTab === 'map' ? (
            <motion.div 
              key="map"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="dashboard-content"
            >
              <div className="content-left">
                <ServicesSidebar 
                  services={services} 
                  loading={servicesLoading} 
                  onSelect={setSelectedService}
                  selectedId={selectedService?.id}
                />
              </div>
              <div className="content-center">
                <div className="map-wrapper glass-card">
                  <MapView 
                    location={location} 
                    services={services} 
                    hazards={hazards}
                    selectedService={selectedService}
                  />
                </div>
              </div>
              <div className="content-right">
                <InsightsPanel insights={insights} riskLevel={riskLevel} />
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="analytics-view"
            >
              <div className="analytics-header">
                <h2>Real-Time Safety & Traffic Analytics</h2>
                <div className="analytics-controls">
                   <div className="status-badge live">LIVE ANALYTICS ENGINE</div>
                </div>
              </div>

              <div className="analytics-grid-layout">
                <div className="analytics-left">
                  <div className="map-viz-card glass-card">
                    <div className="card-header">
                      <div className="title-group">
                        <MapIcon size={18} />
                        <h3>Traffic Congestion Heatmap</h3>
                      </div>
                      <span className="info-text">Visualizing live road density</span>
                    </div>
                    <div className="map-container-mini">
                      <MapView 
                        location={location} 
                        services={services} 
                        hazards={hazards}
                        showTraffic={true}
                        insights={insights}
                      />
                    </div>
                  </div>

                  <div className="charts-container">
                    <div className="chart-card glass-card">
                       <div className="card-header">
                         <BarChart3 size={18} />
                         <h3>Hourly Incident Risk</h3>
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
                    </div>
                  </div>
                </div>

                <div className="analytics-right">
                   <InsightsPanel insights={insights} riskLevel={riskLevel} fullWidth={true} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <HazardModal 
        isOpen={isHazardModalOpen} 
        onClose={() => setIsHazardModalOpen(false)} 
        onReport={handleReportHazard}
      />

      <style>{`
        .dashboard-root {
          display: grid;
          grid-template-columns: 80px 1fr;
          height: calc(100vh - 64px);
          background: var(--bg-primary);
          overflow: hidden;
        }

        .dashboard-nav {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 20px 0;
          margin: 10px;
          border-radius: var(--radius-lg);
          background: var(--bg-glass);
        }

        .nav-top, .nav-bottom {
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: center;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--transition);
          width: 100%;
          padding: 10px 0;
        }

        .nav-item span {
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .nav-item:hover, .nav-item.active {
          color: var(--accent-red);
        }

        .nav-item.active {
          position: relative;
        }

        .nav-item.active::after {
          content: '';
          position: absolute;
          left: 0;
          top: 20%;
          bottom: 20%;
          width: 3px;
          background: var(--accent-red);
          border-radius: 0 4px 4px 0;
        }

        .dashboard-main {
          padding: 10px;
          overflow: hidden;
        }

        .dashboard-content {
          display: grid;
          grid-template-columns: 320px 1fr 320px;
          gap: 10px;
          height: 100%;
        }

        .map-wrapper {
          height: 100%;
          overflow: hidden;
          position: relative;
        }

        .content-left, .content-center, .content-right {
          height: 100%;
          overflow: hidden;
        }

        .analytics-view {
          padding: 30px;
          height: 100%;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .analytics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .analytics-header h2 {
          font-family: var(--font-head);
          font-size: 1.8rem;
        }

        .analytics-grid-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
        }

        .analytics-left {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .map-viz-card {
          padding: 24px;
        }

        .map-container-mini {
          height: 400px;
          border-radius: var(--radius);
          overflow: hidden;
          position: relative;
        }

        .volume-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          height: 200px;
          padding-top: 20px;
        }

        .volume-bar-group {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .volume-bar-group .bar-wrapper {
          width: 20px;
          height: 100%;
          background: var(--bg-glass-2);
          border-radius: 99px;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }

        .volume-bar-group .bar-fill {
          width: 100%;
          border-radius: 99px;
          background: var(--accent-blue);
          transition: height 1s ease;
        }

        .volume-bar-group .bar-fill.high {
          background: linear-gradient(to top, var(--accent-red), var(--accent-orange));
        }

        .bar-label {
          font-size: 0.7rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .status-badge.live {
          font-size: 0.7rem;
          font-weight: 800;
          padding: 6px 12px;
          background: rgba(239, 68, 68, 0.1);
          color: var(--accent-red);
          border-radius: 6px;
          letter-spacing: 0.05em;
        }

        .info-text {
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        @media (max-width: 1200px) {
          .dashboard-content {
            grid-template-columns: 300px 1fr;
          }
          .content-right { display: none; }
        }

        @media (max-width: 900px) {
          .dashboard-root { grid-template-columns: 1fr; }
          .dashboard-nav { display: none; }
        }
      `}</style>
    </div>
  );
}
