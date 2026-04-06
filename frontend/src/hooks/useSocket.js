import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const [activeSOS, setActiveSOS] = useState([]);
  const [lastAlert, setLastAlert] = useState(null);
  const [newHazard, setNewHazard] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(BACKEND, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect',    () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('sos:alert', (data) => {
      setActiveSOS(prev => {
        const existing = prev.find(s => s.id === data.id);
        if (existing) return prev;
        setLastAlert(data);
        return [data, ...prev];
      });
    });

    socket.on('sos:resolved', ({ id }) => {
      setActiveSOS(prev => prev.filter(s => s.id !== id));
    });

    socket.on('hazard:new', (data) => {
      setNewHazard(data);
    });

    return () => socket.disconnect();
  }, []);

  const emitSOS = (data) => socketRef.current?.emit('sos:trigger', data);
  const emitLocation = (data) => socketRef.current?.emit('location:update', data);

  return { connected, activeSOS, lastAlert, setLastAlert, newHazard, setNewHazard, emitSOS, emitLocation };
}
