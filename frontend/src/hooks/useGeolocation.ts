import { useState, useEffect } from 'react';

interface GeoLocation {
  longitude: number;
  latitude: number;
  accuracy: number;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [location, setLocation] = useState<GeoLocation>({
    longitude: 0,
    latitude: 0,
    accuracy: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, loading: false, error: '浏览器不支持定位' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          longitude: position.coords.longitude,
          latitude: position.coords.latitude,
          accuracy: position.coords.accuracy,
          loading: false,
          error: null,
        });
      },
      (err) => {
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: `定位失败: ${err.message}`,
        }));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  return location;
}
