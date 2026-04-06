import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

export default function HazardModal({ isOpen, onClose, onReport }) {
  const [type, setType] = useState('POTHOLE');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('MEDIUM');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onReport({ type, description, severity });
    onClose();
  };

  return (
    <div className="modal-overlay">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="hazard-modal glass-card"
      >
        <div className="modal-header">
          <div className="title">
            <AlertTriangle size={20} color="var(--accent-orange)" />
            <h3>Report Road Hazard</h3>
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Hazard Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="POTHOLE">Pothole</option>
              <option value="TRAFFIC">Heavy Traffic</option>
              <option value="ACCIDENT">Accident</option>
              <option value="CONSTRUCTION">Road Construction</option>
              <option value="OTHER">Other Issue</option>
            </select>
          </div>

          <div className="form-group">
            <label>Severity</label>
            <div className="severity-selector">
              {['LOW', 'MEDIUM', 'HIGH'].map(s => (
                <button 
                  key={s}
                  type="button"
                  className={`sev-btn ${severity === s ? 'active' : ''} ${s.toLowerCase()}`}
                  onClick={() => setSeverity(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea 
              placeholder="Describe the issue..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary submit-btn">
            Broadcast Report
          </button>
        </form>
      </motion.div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(4px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .hazard-modal {
          width: 100%;
          max-width: 450px;
          padding: 30px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header .title {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .modal-header h3 {
          font-family: var(--font-head);
          font-size: 1.25rem;
        }
        .close-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
        }
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-group label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
        }
        .form-group select, .form-group textarea {
          background: var(--bg-glass-2);
          border: 1px solid var(--border);
          padding: 12px;
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-family: var(--font-main);
          outline: none;
        }
        .form-group textarea {
          height: 100px;
          resize: none;
        }
        .severity-selector {
          display: flex;
          gap: 8px;
        }
        .sev-btn {
          flex: 1;
          padding: 8px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: var(--bg-glass-2);
          color: var(--text-secondary);
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition);
        }
        .sev-btn.active.low { background: rgba(34,197,94,0.15); border-color: var(--accent-green); color: var(--accent-green); }
        .sev-btn.active.medium { background: rgba(249,115,22,0.15); border-color: var(--accent-orange); color: var(--accent-orange); }
        .sev-btn.active.high { background: rgba(239,68,68,0.15); border-color: var(--accent-red); color: var(--accent-red); }
        
        .submit-btn {
          margin-top: 10px;
          padding: 14px;
        }
      `}</style>
    </div>
  );
}
