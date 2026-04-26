import { NavLink } from 'react-router-dom';
import { X, LogOut, User } from 'lucide-react';
import { useSidebar } from './SidebarContext';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser } from '@/api/auth';
import type { LucideIcon } from 'lucide-react';

export interface MenuItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

interface SidebarProps {
  menuItems: MenuItem[];
}

export default function Sidebar({ menuItems }: SidebarProps) {
  const { isOpen, close, isDesktop } = useSidebar();
  const { user, logout, setUser } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMenuClick = () => {
    close();
    getCurrentUser().then(res => setUser(res.data)).catch(() => {});
  };

  const navContent = (
    <nav className="flex flex-col h-full">
      <div className="p-4 border-b border-white/10 lg:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User size={20} />
            </div>
            <div>
              <p className="text-white font-medium text-sm">{user?.realName}</p>
              <p className="text-white/50 text-xs">
                {user?.role === 'admin' ? '管理员' : '巡检员'}
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="关闭菜单"
          >
            <X size={20} className="text-white/70" />
          </button>
        </div>
      </div>

      <div className="flex-1 py-4 overflow-y-auto">
        {menuItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            onClick={handleMenuClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-white/15 text-white border-r-3 border-teal font-medium'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors w-full text-sm"
        >
          <LogOut size={18} />
          <span>退出登录</span>
        </button>
      </div>
    </nav>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed left-0 top-14 w-64 bg-navy h-[calc(100vh-3.5rem)] z-20 overflow-y-auto">
        {navContent}
      </aside>

      {/* Mobile drawer overlay */}
      {isOpen && !isDesktop && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={close}
          />
          <aside className="fixed left-0 top-0 h-full w-72 bg-navy transform transition-transform duration-300 shadow-2xl">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
