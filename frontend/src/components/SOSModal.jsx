import { useState } from 'react';
import { api } from '../services/api';

export default function SOSModal({ location, services, onClose, onSuccess }) {
  const [name, setName]       = useState('');
  const [contact, setContact] = useState('');
  const [urgency, setUrgency] = useState('HIGH');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    try {
      const nearest = services
        .slice(0, 3)
        .map(s => ({ name: s.name, distance: s.distance, phone: s.phone }));

      const result = await api.triggerSOS({
        lat: location.lat, lng: location.lng,
        address: location.address,
        userName: name || 'Anonymous',
        contact: contact || null,
        urgencyLevel: urgency,
        nearbyServices: nearest,
      });

      onSuccess({
        type: 'success',
        message: result?.message || '🚨 SOS triggered successfully! Help is on the way.',
      });
      onClose();
    } catch {
      onSuccess({ type: 'error', message: '⚠️ Failed to send SOS. Please call 112 directly.' });
      onClose();
    }
    setLoading(false);
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose}>✕</button>

        <div className="modal-sos-icon">🚨</div>
        <h2 className="modal-title">SEND SOS ALERT</h2>
        <p className="modal-subtitle">
          Your location will be shared with emergency services<br />
          <strong style={{ color: 'var(--accent-orange)' }}>
            📍 {location.address || `${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)}`}
          </strong>
        </p>

        <div className="modal-form">
          <div className="form-group">
            <label className="form-label">Your Name (optional)</label>
            <input
              className="form-input"
              placeholder="Enter your name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Emergency Contact Number</label>
            <input
              className="form-input"
              placeholder="+91XXXXXXXXXX"
              value={contact}
              onChange={e => setContact(e.target.value)}
              type="tel"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Urgency Level</label>
            <div className="urgency-row">
              {['LOW', 'MEDIUM', 'HIGH'].map(u => (
                <button
                  key={u}
                  className={`urgency-btn ${urgency === u ? `active ${u}` : ''}`}
                  onClick={() => setUrgency(u)}
                >
                  {u === 'LOW' ? '🟢 LOW' : u === 'MEDIUM' ? '🟡 MEDIUM' : '🔴 HIGH'}
                </button>
              ))}
            </div>
          </div>

          {services.length > 0 && (
            <div style={{ padding: '10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                NEAREST SERVICES DETECTED
              </div>
              {services.slice(0, 3).map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4 }}>
                  <span>{s.icon} {s.name}</span>
                  <span style={{ color: 'var(--accent-orange)' }}>{s.distance} km</span>
                </div>
              ))}
            </div>
          )}

          <div className="modal-actions">
            <button className="btn-cancel" onClick={onClose}>Cancel</button>
            <button
              className="btn-confirm-sos"
              onClick={handleSend}
              disabled={loading}
            >
              {loading ? '⏳ Sending...' : '🚨 SEND SOS NOW'}
            </button>
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Or call directly: &nbsp;
            <a href="tel:112" style={{ color: 'var(--accent-red)', fontWeight: 700 }}>112</a> &nbsp;|&nbsp;
            <a href="tel:108" style={{ color: 'var(--accent-green)', fontWeight: 700 }}>108 Ambulance</a> &nbsp;|&nbsp;
            <a href="tel:100" style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>100 Police</a>
          </p>
        </div>
      </div>
    </div>
  );
}
