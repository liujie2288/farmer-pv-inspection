import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'fail' | 'info' | 'warning';

interface ToastItem {
  id: number;
  type: ToastType;
  content: string;
}

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={20} className="text-green-500" />,
  fail: <XCircle size={20} className="text-red-500" />,
  info: <Info size={20} className="text-blue-500" />,
  warning: <AlertTriangle size={20} className="text-amber-500" />,
};

let toastId = 0;
const listeners: Set<(toasts: ToastItem[]) => void> = new Set();
let currentToasts: ToastItem[] = [];

function notify(toasts: ToastItem[]) {
  currentToasts = toasts;
  listeners.forEach(fn => fn(toasts));
}

export function showToast({ icon, content }: { icon: ToastType; content: string }) {
  const id = ++toastId;
  const newToasts = [...currentToasts, { id, type: icon, content }].slice(-3);
  notify(newToasts);

  setTimeout(() => {
    notify(currentToasts.filter(t => t.id !== id));
  }, 3000);
}

function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="bg-white rounded-xl shadow-lg px-5 py-3 flex items-center gap-3 animate-[slide-down_0.3s_ease-out]"
        >
          {iconMap[toast.type]}
          <span className="text-sm text-gray-700">{toast.content}</span>
        </div>
      ))}
    </div>
  );
}

let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

export function initToast() {
  if (container) return;
  container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);
  root = createRoot(container);
  root.render(<ToastContainer />);
}

export default ToastContainer;
