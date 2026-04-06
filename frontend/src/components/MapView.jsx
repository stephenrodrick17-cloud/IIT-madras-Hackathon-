import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored marker icons
function createIcon(emoji, color) {
  return L.divIcon({
    html: `<div style="
      width:38px;height:38px;
      background:${color};
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:2px solid rgba(255,255,255,0.3);
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 12px rgba(0,0,0,0.5);
    ">
      <span style="transform:rotate(45deg);font-size:16px;line-height:1;">${emoji}</span>
    </div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
    className: '',
  });
}

const userIcon = L.divIcon({
  html: `<div style="
    width:18px;height:18px;
    background:#3b82f6;
    border-radius:50%;
    border:3px solid #fff;
    box-shadow:0 0 0 4px rgba(59,130,246,0.4);
    animation:none;
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  className: '',
});

const icons = {
  hospital:  createIcon('🏥', 'rgba(239,68,68,0.9)'),
  police:    createIcon('🚔', 'rgba(59,130,246,0.9)'),
  ambulance: createIcon('🚑', 'rgba(34,197,94,0.9)'),
  sos:       createIcon('🚨', 'rgba(239,68,68,1)'),
  hazard:    createIcon('⚠️', 'rgba(245,158,11,0.9)'),
};

// Component that flies to the user location when it changes
function FlyToUser({ lat, lng }) {
  const map = useMap();
  const prevRef = useRef(null);
  useEffect(() => {
    if (!lat || !lng) return;
    const key = `${lat},${lng}`;
    if (prevRef.current !== key) {
      map.flyTo([lat, lng], map.getZoom() < 14 ? 14 : map.getZoom(), { duration: 1.5 });
      prevRef.current = key;
    }
  }, [lat, lng, map]);
  return null;
}

export default function MapView({ location, services, selectedService, hazards = [], showTraffic = false, insights = null, incidents = [] }) {
  const userLat = location.lat;
  const userLng = location.lng;
  if (!userLat || !userLng) return null;

  // Mock traffic data points around user location if showTraffic is on
  const trafficPoints = showTraffic && insights?.trafficFlow ? [
    { lat: userLat + 0.005, lng: userLng + 0.005, level: 'HIGH', density: 0.8 },
    { lat: userLat - 0.003, lng: userLng + 0.008, level: 'MEDIUM', density: 0.5 },
    { lat: userLat + 0.008, lng: userLng - 0.002, level: 'LOW', density: 0.2 },
    { lat: userLat - 0.006, lng: userLng - 0.005, level: 'HIGH', density: 0.9 },
  ] : [];

  return (
    <MapContainer
      center={[userLat, userLng]}
      zoom={14}
      className="map-container"
      zoomControl={false}
    >
      {/* Reliable Dark tile layer (Esri Canvas) */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        attribution='Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
        maxNativeZoom={16}
        maxZoom={20}
      />

      <FlyToUser lat={userLat} lng={userLng} />

      {/* Traffic Congestion Visuals */}
      {trafficPoints.map((p, i) => (
        <Circle 
          key={`traffic-${i}`}
          center={[p.lat, p.lng]}
          radius={300}
          pathOptions={{
            fillColor: p.level === 'HIGH' ? '#ef4444' : p.level === 'MEDIUM' ? '#f59e0b' : '#3b82f6',
            color: 'transparent',
            fillOpacity: p.density * 0.5
          }}
        >
          <Popup>
            <div style={{ fontSize: '0.8rem' }}>
              <strong>{p.level} Traffic Congestion</strong>
              <br />
              Density: {(p.density * 100).toFixed(0)}%
            </div>
          </Popup>
        </Circle>
      ))}

      {/* Hazards from Community */}
      {hazards.map(h => (
        <Marker key={h.id} position={[h.lat, h.lng]} icon={icons.hazard}>
          <Popup>
            <div className="popup-hazard">
              <strong>⚠️ {h.type} Report</strong>
              <p>{h.description}</p>
              <div className="meta">
                <span>{h.severity} SEVERITY</span>
                <span>{h.votes} votes</span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* User location marker + accuracy circle */}
      <Marker position={[userLat, userLng]} icon={userIcon}>
        <Popup>
          <div style={{ fontFamily: 'Inter, sans-serif', padding: '4px 0' }}>
            <strong style={{ color: '#3b82f6' }}>📍 Your Location</strong>
            <br />
            <span style={{ fontSize: '0.8em', color: '#94a3b8' }}>
              {userLat.toFixed(5)}, {userLng.toFixed(5)}
            </span>
          </div>
        </Popup>
      </Marker>

      <Circle
        center={[userLat, userLng]}
        radius={200}
        pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.08, weight: 2, dashArray: '6 4' }}
      />

      {/* Incident markers (Real-time) */}
      {incidents?.map((inc, i) => (
        <Marker 
          key={inc.id || i} 
          position={[inc.lat, inc.lng]} 
          icon={icons.sos}
        >
          <Popup className="custom-popup">
            <div className="popup-card incident">
              <div className="popup-header">
                <span className="icon">🚨</span>
                <span className="category">ACTIVE EMERGENCY</span>
              </div>
              <h3>Urgency: {inc.urgencyLevel || 'HIGH'}</h3>
              <p className="address">{inc.address}</p>
              <div className="popup-footer">
                <span className="time">Reported: {new Date(inc.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Service markers */}
      {services?.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lng]}
          icon={icons[s.category] || icons.hospital}
          eventHandlers={{
            click: () => {
              // Can add specific logic here if needed
            },
          }}
        >
          <Popup closeButton={false} minWidth={220} className="custom-popup">
            <div className="popup-card">
              <div className="popup-header">
                <span className="icon">{s.icon}</span>
                <span className="category">{s.category.toUpperCase()}</span>
              </div>
              <h3>{s.name}</h3>
              <p className="address">{s.address}</p>
              <div className="popup-footer">
                <span className="distance">📍 {s.distance} km away</span>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="dir-btn"
                >
                  Directions
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Selected service highlight */}
      {selectedService && (
        <FlyToUser lat={selectedService.lat} lng={selectedService.lng} />
      )}

      <style>{`
        .custom-popup .leaflet-popup-content-wrapper {
          background: var(--bg-card);
          color: var(--text-primary);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 0;
          overflow: hidden;
        }
        .popup-card { padding: 16px; font-family: var(--font-main); }
        .popup-header { display: flex; align-items: center; gap: 8px; font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); margin-bottom: 8px; }
        .popup-card h3 { font-size: 1rem; margin-bottom: 8px; font-family: var(--font-head); }
        .address { font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 16px; }
        .popup-footer { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border); padding-top: 12px; }
        .distance { font-size: 0.75rem; font-weight: 600; color: var(--accent-blue); }
        .dir-btn { font-size: 0.75rem; font-weight: 700; color: white; background: var(--accent-red); padding: 4px 12px; border-radius: 99px; text-decoration: none; }
      `}</style>
    </MapContainer>
  );
}
