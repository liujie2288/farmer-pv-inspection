import { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface PreviewState {
  visible: boolean;
  url: string;
  name: string;
}

let previewState: PreviewState = { visible: false, url: '', name: '' };
const listeners = new Set<(s: PreviewState) => void>();

function notify() {
  listeners.forEach((fn) => fn({ ...previewState }));
}

export function openImagePreview(url: string, name = '') {
  previewState = { visible: true, url, name };
  notify();
}

function ImagePreviewOverlay() {
  const [state, setState] = useState<PreviewState>(previewState);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    listeners.add(setState);
    return () => { listeners.delete(setState); };
  }, []);

  useEffect(() => {
    if (!state.visible) return;
    setScale(1);
    setRotation(0);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [state.visible]);

  const close = useCallback(() => {
    previewState = { visible: false, url: '', name: '' };
    notify();
  }, []);

  if (!state.visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center select-none">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80" onClick={close} />

      {/* Toolbar */}
      <div className="fixed top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={() => setScale((s) => Math.min(s + 0.5, 4))}
          className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <ZoomIn size={20} />
        </button>
        <button
          onClick={() => setScale((s) => Math.max(s - 0.5, 0.5))}
          className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <ZoomOut size={20} />
        </button>
        <button
          onClick={() => setRotation((r) => (r + 90) % 360)}
          className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <RotateCw size={20} />
        </button>
        <button
          onClick={close}
          className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Photo name */}
      {state.name && (
        <div className="fixed top-4 left-4 z-10 bg-black/50 text-white text-sm px-3 py-1.5 rounded-lg">
          {state.name}
        </div>
      )}

      {/* Image */}
      <img
        src={state.url}
        alt={state.name || '预览'}
        className="max-w-[90vw] max-h-[85vh] object-contain transition-transform duration-200"
        style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={() => setScale((s) => (s === 1 ? 2 : 1))}
      />
    </div>
  );
}

let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

export function initImagePreview() {
  if (container) return;
  container = document.createElement('div');
  container.id = 'image-preview-container';
  document.body.appendChild(container);
  root = createRoot(container);
  root.render(<ImagePreviewOverlay />);
}

export default ImagePreviewOverlay;
