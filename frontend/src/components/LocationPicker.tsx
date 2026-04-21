import { useState, useEffect, useCallback } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';

interface LocationPickerProps {
  longitude: number;
  latitude: number;
  onChange: (lng: number, lat: number) => void;
}

export default function LocationPicker({ longitude, latitude, onChange }: LocationPickerProps) {
  const [loading, setLoading] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [editLng, setEditLng] = useState(String(longitude || ''));
  const [editLat, setEditLat] = useState(String(latitude || ''));

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('浏览器不支持定位');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lng = position.coords.longitude;
        const lat = position.coords.latitude;
        onChange(lng, lat);
        setAccuracy(position.coords.accuracy);
        setLoading(false);
      },
      (err) => {
        setError(`定位失败: ${err.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [onChange]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  const handleToggleEdit = () => {
    if (editing) {
      // Apply manual values
      const lng = parseFloat(editLng);
      const lat = parseFloat(editLat);
      if (!isNaN(lng) && !isNaN(lat)) {
        onChange(lng, lat);
        setAccuracy(null);
      }
    } else {
      setEditLng(String(longitude || ''));
      setEditLat(String(latitude || ''));
    }
    setEditing(!editing);
  };

  const hasCoords = longitude !== 0 || latitude !== 0;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600 bg-white rounded-lg p-3">
      <MapPin size={18} className="text-teal-600 shrink-0" />

      {loading ? (
        <span className="text-gray-400 flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-gray-200 border-t-teal-500 rounded-full animate-spin inline-block" />
          定位中...
        </span>
      ) : error ? (
        <span className="text-red-500 flex-1">{error}</span>
      ) : editing ? (
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs w-8 shrink-0">经度</span>
            <input
              type="number"
              step="any"
              value={editLng}
              onChange={(e) => setEditLng(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
              placeholder="经度"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs w-8 shrink-0">纬度</span>
            <input
              type="number"
              step="any"
              value={editLat}
              onChange={(e) => setEditLat(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg font-mono text-sm"
              placeholder="纬度"
            />
          </div>
        </div>
      ) : hasCoords ? (
        <div className="flex-1 flex items-center gap-2">
          <span className="font-mono text-teal-700">
            {longitude.toFixed(6)}, {latitude.toFixed(6)}
          </span>
          {accuracy !== null && (
            <span className="text-xs text-gray-400">
              ±{Math.round(accuracy)}m
            </span>
          )}
        </div>
      ) : (
        <span className="flex-1 text-gray-400">未获取定位</span>
      )}

      <button
        type="button"
        onClick={editing ? handleToggleEdit : fetchLocation}
        disabled={loading}
        className="shrink-0 p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors disabled:opacity-50"
        title={editing ? '确认' : '刷新定位'}
      >
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
      </button>

      {!editing && hasCoords && (
        <button
          type="button"
          onClick={handleToggleEdit}
          className="shrink-0 text-xs text-teal-600 hover:text-teal-700 transition-colors"
        >
          手动
        </button>
      )}
    </div>
  );
}
