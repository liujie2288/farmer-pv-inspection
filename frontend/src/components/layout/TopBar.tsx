import { Menu, LogOut, User, SolarPanel, ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSidebar } from './SidebarContext';
import { useAuthStore } from '@/store/authStore';

const ROOT_PATHS = new Set([
  '/admin', '/admin/projects', '/admin/plans', '/admin/records', '/admin/users', '/admin/profile', '/admin/icons',
  '/', '/records', '/profile',
]);

export default function TopBar() {
  const { toggle, isDesktop } = useSidebar();
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const isRootPage = ROOT_PATHS.has(location.pathname);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-14 bg-navy text-white flex items-center px-4 fixed top-0 left-0 right-0 z-30">
      {!isDesktop && !isRootPage && (
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors mr-2"
          aria-label="返回"
        >
          <ArrowLeft size={22} />
        </button>
      )}

      {!isDesktop && isRootPage && (
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
          <SolarPanel size={16} className="text-white" />
        </div>
      )}

      <h1 className="font-bold text-lg tracking-wide">光伏巡检系统</h1>

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
