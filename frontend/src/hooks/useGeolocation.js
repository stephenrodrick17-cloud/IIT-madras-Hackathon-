import { useState, useEffect, useCallback, useRef } from 'react';

export function useGeolocation() {
  const [state, setState] = useState({
    lat: null, lng: null,
    accuracy: null, address: '',
    loading: true, error: null,
  });
  const watchRef = useRef(null);

  const updatePosition = useCallback((pos) => {
    const { latitude: lat, longitude: lng, accuracy } = pos.coords;
    setState(s => ({ ...s, lat, lng, accuracy, loading: false, error: null }));
  }, []);

  const onError = useCallback((err) => {
    // Fallback to a default location (Delhi, India) so map still works
    setState({
      lat: 28.6139, lng: 77.2090,
      accuracy: null, address: 'New Delhi, India (fallback)',
      loading: false,
      error: `Location unavailable: ${err.message}`,
    });
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      onError({ message: 'Geolocation not supported' });
      return;
    }
    // Get initial position
    navigator.geolocation.getCurrentPosition(updatePosition, onError, {
      enableHighAccuracy: true, timeout: 10000, maximumAge: 30000,
    });
    // Watch for changes
    watchRef.current = navigator.geolocation.watchPosition(updatePosition, onError, {
      enableHighAccuracy: true, timeout: 15000, maximumAge: 10000,
    });
    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, [updatePosition, onError]);

  const setAddress = useCallback((address) => {
    setState(s => ({ ...s, address }));
  }, []);

  return { ...state, setAddress };
}
