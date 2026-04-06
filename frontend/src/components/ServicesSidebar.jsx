import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Phone, MapPin, Clock, Star, ExternalLink } from 'lucide-react';

const CATEGORIES = ['all', 'trauma', 'ambulance', 'police', 'rescue'];
const CATEGORY_LABELS = { all: 'All', trauma: 'Trauma Center', ambulance: 'Ambulance', police: 'Police', rescue: 'Vehicle Rescue' };
const CATEGORY_ICONS = { trauma: '🏥', ambulance: '🚑', police: '🚔', rescue: '🛟' };

function SkeletonCard() {
  return (
    <div className="skeleton-card glass-card">
      <div className="skeleton-icon" />
      <div className="skeleton-content">
        <div className="skeleton-line" style={{ width: '80%' }} />
        <div className="skeleton-line" style={{ width: '60%' }} />
      </div>
    </div>
  );
}

export default function ServicesSidebar({ services = [], loading, selectedId, onSelect }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filtered = Array.isArray(services) ? services.filter(s => {
    const matchesFilter = filter === 'all' || s.category === filter;
    const matchesSearch = (s.name || '').toLowerCase().includes(search.toLowerCase()) || 
                          (s.address || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  }) : [];

  return (
    <div className="services-sidebar-container">
      <div className="sidebar-header-compact">
        <div className="search-box glass-card">
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Search services..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="filter-chips">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`filter-chip ${filter === cat ? 'active' : ''}`}
              onClick={() => setFilter(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="services-list-container">
        <AnimatePresence mode="popLayout">
          {loading ? (
            Array(5).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : filtered.length === 0 ? (
            <div className="empty-state-compact">
              <Search size={40} />
              <p>No services found matching your criteria.</p>
            </div>
          ) : (
            filtered.map((svc, i) => (
              <motion.div
                key={svc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`service-card-compact glass-card ${selectedId === svc.id ? 'active' : ''}`}
                onClick={() => onSelect(svc)}
              >
                <div className="card-accent" style={{ background: `var(--accent-${svc.category === 'trauma' ? 'red' : svc.category === 'police' ? 'blue' : svc.category === 'ambulance' ? 'green' : 'orange'})` }} />
                <div className="card-main">
                  <div className="card-top">
                    <span className="card-icon">{svc.icon}</span>
                    <div className="card-titles">
                      <h4>{svc.name}</h4>
                      <p className="address-text"><MapPin size={12} /> {svc.address}</p>
                    </div>
                  </div>
                  <div className="card-meta">
                    <span className="distance-badge"><MapPin size={12} /> {svc.distance} km</span>
                    {svc.rating && <span className="rating-badge"><Star size={12} /> {svc.rating}</span>}
                    {svc.openNow !== null && (
                      <span className={`status-badge ${svc.openNow ? 'open' : 'closed'}`}>
                        {svc.openNow ? 'OPEN' : 'CLOSED'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="card-actions">
                  <a href={`tel:112`} className="action-btn call" onClick={e => e.stopPropagation()}>
                    <Phone size={14} />
                  </a>
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&destination=${svc.lat},${svc.lng}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="action-btn directions" 
                    onClick={e => e.stopPropagation()}
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .services-sidebar-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          gap: 16px;
        }

        .sidebar-header-compact {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          border-radius: var(--radius);
        }

        .search-box input {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.85rem;
          width: 100%;
          outline: none;
        }

        .filter-chips {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
          scrollbar-width: none;
        }

        .filter-chips::-webkit-scrollbar { display: none; }

        .filter-chip {
          white-space: nowrap;
          padding: 6px 14px;
          border-radius: 99px;
          border: 1px solid var(--border);
          background: var(--bg-glass-2);
          color: var(--text-secondary);
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition);
        }

        .filter-chip.active {
          background: var(--accent-red);
          color: white;
          border-color: var(--accent-red);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        }

        .services-list-container {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-right: 4px;
        }

        .services-list-container::-webkit-scrollbar { width: 4px; }
        .services-list-container::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }

        .service-card-compact {
          display: flex;
          padding: 12px;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transition: all var(--transition);
          gap: 12px;
        }

        .service-card-compact:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateX(4px);
        }

        .service-card-compact.active {
          border-color: var(--accent-red);
          background: rgba(239, 68, 68, 0.05);
        }

        .card-accent {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 4px;
        }

        .card-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .card-top {
          display: flex;
          gap: 12px;
        }

        .card-icon {
          font-size: 1.25rem;
        }

        .card-titles h4 {
          font-size: 0.9rem;
          font-weight: 700;
          margin-bottom: 2px;
          color: var(--text-primary);
        }

        .address-text {
          font-size: 0.7rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 4px;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .card-meta {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .distance-badge, .rating-badge, .status-badge {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
          background: var(--bg-glass-2);
        }

        .distance-badge { color: var(--accent-blue); }
        .rating-badge { color: var(--accent-yellow); }
        .status-badge.open { color: var(--accent-green); background: rgba(34, 197, 94, 0.1); }
        .status-badge.closed { color: var(--accent-red); background: rgba(239, 68, 68, 0.1); }

        .card-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .action-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-glass-2);
          color: var(--text-secondary);
          transition: all var(--transition);
          text-decoration: none;
        }

        .action-btn:hover {
          background: var(--border-hover);
          color: var(--text-primary);
        }

        .action-btn.call:hover { color: var(--accent-green); background: rgba(34, 197, 94, 0.1); }
        .action-btn.directions:hover { color: var(--accent-blue); background: rgba(59, 130, 246, 0.1); }

        .skeleton-card {
          height: 80px;
          display: flex;
          padding: 12px;
          gap: 12px;
        }

        .skeleton-icon { width: 32px; height: 32px; border-radius: 8px; background: var(--bg-glass-2); }
        .skeleton-content { flex: 1; display: flex; flex-direction: column; gap: 8px; }
        .skeleton-line { height: 10px; background: var(--bg-glass-2); border-radius: 4px; }

        .empty-state-compact {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          color: var(--text-muted);
          text-align: center;
          gap: 16px;
        }
      `}</style>
    </div>
  );
}
