import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { X } from 'lucide-react';

interface DialogAction {
  label: string;
  primary?: boolean;
  danger?: boolean;
  onClick: () => void;
}

interface DialogConfig {
  title?: string;
  content: React.ReactNode;
  actions?: DialogAction[];
}

interface DialogInstance extends DialogConfig {
  id: number;
}

let dialogId = 0;
const listeners: Set<(dialogs: DialogInstance[]) => void> = new Set();
let currentDialogs: DialogInstance[] = [];

function notify(dialogs: DialogInstance[]) {
  currentDialogs = dialogs;
  listeners.forEach(fn => fn(dialogs));
}

function wrapWithClose(actions: DialogAction[], close: () => void): DialogAction[] {
  return actions.map(action => ({
    ...action,
    onClick: () => {
      action.onClick();
      close();
    },
  }));
}

export function showDialog(config: DialogConfig): Promise<void> {
  return new Promise(resolve => {
    const id = ++dialogId;
    const close = () => {
      notify(currentDialogs.filter(d => d.id !== id));
      resolve();
    };
    const actions = config.actions
      ? wrapWithClose(config.actions, close)
      : [
          { label: '取消', onClick: close },
          { label: '确定', primary: true, onClick: close },
        ];
    notify([...currentDialogs, { ...config, id, actions }]);
  });
}

export function confirm({
  content,
  title = '确认',
}: {
  content: string;
  title?: string;
}): Promise<boolean> {
  return new Promise(resolve => {
    const id = ++dialogId;
    const close = (result: boolean) => {
      notify(currentDialogs.filter(d => d.id !== id));
      resolve(result);
    };
    notify([
      ...currentDialogs,
      {
        id,
        title,
        content,
        actions: [
          { label: '取消', onClick: () => close(false) },
          {
            label: '确定',
            primary: true,
            onClick: () => close(true),
          },
        ],
      },
    ]);
  });
}

function DialogContainer() {
  const [dialogs, setDialogs] = useState<DialogInstance[]>([]);

  useEffect(() => {
    listeners.add(setDialogs);
    return () => {
      listeners.delete(setDialogs);
    };
  }, []);

  useEffect(() => {
    if (dialogs.length === 0) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        notify(currentDialogs.slice(0, -1));
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [dialogs.length]);

  if (dialogs.length === 0) return null;

  const dialog = dialogs[dialogs.length - 1];
  const closeTop = () => notify(currentDialogs.slice(0, -1));

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={closeTop} />
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl relative animate-[fade-in_0.2s_ease-out]">
        <button
          onClick={closeTop}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-400 hover:text-gray-600"
          aria-label="关闭"
        >
          <X size={18} />
        </button>
        {dialog.title && (
          <h3 className="text-lg font-bold text-navy mb-4 pr-6">{dialog.title}</h3>
        )}
        <div className="text-sm text-gray-600 mb-6">{dialog.content}</div>
        <div className="flex gap-3 justify-end">
          {dialog.actions?.map((action, i) => (
            <button
              key={i}
              onClick={action.onClick}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                action.danger
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : action.primary
                  ? 'bg-teal text-white hover:bg-teal-dark'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

let container: HTMLDivElement | null = null;
let root: ReturnType<typeof createRoot> | null = null;

export function initDialog() {
  if (container) return;
  container = document.createElement('div');
  container.id = 'dialog-container';
  document.body.appendChild(container);
  root = createRoot(container);
  root.render(<DialogContainer />);
}

export default DialogContainer;
