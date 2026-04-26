import * as LucideIcons from 'lucide-react';

const groups: Record<string, string[]> = {
  '建筑 & 地点': [
    'Building', 'Building2', 'Home', 'Factory', 'Warehouse', 'Landmark',
    'MapPin', 'Map', 'Globe', 'Navigation', 'Compass', 'Route',
  ],
  '能源 & 设备': [
    'SolarPanel', 'Zap', 'Battery', 'BatteryCharging', 'Plug', 'PlugZap',
    'Wrench', 'Cog', 'Settings', 'Cpu', 'CircuitBoard', 'Gauge',
    'Thermometer', 'Sun', 'CloudSun', 'Wind', 'Droplets',
  ],
  '用户 & 人员': [
    'User', 'Users', 'UserCircle', 'UserCheck', 'UserPlus', 'UserMinus',
    'Contact', 'Shield', 'ShieldCheck', 'HardHat', 'ScanFace',
  ],
  '文件 & 数据': [
    'File', 'FileText', 'FileCheck', 'FileOutput', 'FilePlus', 'FileSearch',
    'Files', 'FolderOpen', 'Folder', 'Archive', 'Download', 'Upload',
    'Sheet', 'BarChart3', 'TrendingUp', 'Activity', 'PieChart', 'Target', 'Percent',
  ],
  '状态 & 反馈': [
    'CheckCircle', 'CheckCircle2', 'Check', 'XCircle', 'X', 'AlertTriangle',
    'AlertCircle', 'Info', 'HelpCircle', 'Clock', 'Timer', 'Loader2',
    'Ban', 'Octagon',
  ],
  '操作': [
    'Plus', 'Minus', 'Edit3', 'Pencil', 'Trash2', 'Copy', 'ClipboardList',
    'Search', 'Filter', 'RefreshCw', 'ArrowLeft', 'ArrowRight', 'ChevronDown',
    'MoreHorizontal', 'ExternalLink', 'Link', 'Unlock', 'Lock',
  ],
  '媒体': [
    'Camera', 'Image', 'ImageIcon', 'Video', 'Eye', 'EyeOff',
    'Palette', 'Brush', 'Printer',
  ],
  '通讯': [
    'Mail', 'Phone', 'MessageSquare', 'MessageCircle', 'Bell', 'BellRing',
    'Send', 'Share2',
  ],
  '交通 & 物流': [
    'Truck', 'Car', 'Bike', 'MapPinned', 'Package', 'Ship',
    'Plane', 'Footprints',
  ],
};

function IconPreviewPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-navy">Lucide React Icon 预览</h1>
      {Object.entries(groups).map(([group, names]) => (
        <div key={group} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-gray-600">{group}</h2>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
            {names.map((name) => {
              const Icon = (LucideIcons as any)[name];
              return (
                <div
                  key={name}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-gray-50 p-3 transition-colors hover:bg-gray-50"
                >
                  {Icon ? (
                    <Icon size={24} className="text-navy" />
                  ) : (
                    <span className="text-xs text-red-400">?</span>
                  )}
                  <span className="text-[10px] leading-tight text-gray-500 text-center break-all">
                    {name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default IconPreviewPage;
