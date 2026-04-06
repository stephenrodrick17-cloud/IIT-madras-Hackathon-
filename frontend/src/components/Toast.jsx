import { useEffect } from 'react';

export default function Toast({ type, message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

  return (
    <div className={`toast ${type || 'info'}`} onClick={onClose} style={{ cursor: 'pointer' }}>
      <span style={{ fontSize: '1.1rem' }}>{icons[type] || icons.info}</span>
      <span>{message}</span>
    </div>
  );
}
