import { Menu, LogOut, User, Zap } from 'lucide-react';
import { useSidebar } from './SidebarContext';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  title?: string;
}

export default function TopBar({ title = '光伏巡检系统' }: TopBarProps) {
  const { toggle, isDesktop } = useSidebar();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 bg-navy text-white flex items-center px-4 sticky top-0 z-30">
      {!isDesktop && (
        <button
          onClick={toggle}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors mr-3"
          aria-label="打开菜单"
        >
          <Menu size={22} />
        </button>
      )}

      {isDesktop && (
        <div className="w-8 h-8 bg-gradient-to-br from-teal to-teal-dark rounded-lg flex items-center justify-center mr-3 shrink-0">
          <Zap size={16} className="text-white" />
        </div>
      )}

      <h1 className="font-bold text-lg tracking-wide">{title}</h1>

      <div className="ml-auto flex items-center gap-3">
        {user && (
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <User size={16} />
            </div>
            <div className="text-sm">
              <span className="font-medium">{user.realName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors ml-2"
              aria-label="退出登录"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
