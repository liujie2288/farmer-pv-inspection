import { useNavigate } from 'react-router-dom';
import { User, FileText, KeyRound, Info, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { confirm } from '@/components/ui/Dialog';

function InspectorProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    const ok = await confirm({ content: '确定退出登录吗？' });
    if (ok) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Personal info card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-navy/5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-navy">个人信息</h2>
          </div>
          <div className="divide-y divide-gray-50">
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-2.5 text-sm text-gray-500">
                <User size={16} className="text-gray-400" />
                <span>姓名</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{user?.realName}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-2.5 text-sm text-gray-500">
                <User size={16} className="text-gray-400" />
                <span>账号</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{user?.username}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-2.5 text-sm text-gray-500">
                <User size={16} className="text-gray-400" />
                <span>角色</span>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal/10 text-teal">
                巡检员
              </span>
            </div>
          </div>
        </div>

        {/* Links card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-navy/5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-navy">功能</h2>
          </div>
          <div className="divide-y divide-gray-50">
            <button
              onClick={() => navigate('/records')}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2.5 text-sm text-gray-700">
                <FileText size={16} className="text-gray-400" />
                <span>巡检记录</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2.5 text-sm text-gray-700">
                <KeyRound size={16} className="text-gray-400" />
                <span>修改密码</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* About card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-navy/5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-navy">关于</h2>
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-2.5 text-sm text-gray-500">
              <Info size={16} className="text-gray-400" />
              <span>版本</span>
            </div>
            <span className="text-sm font-medium text-gray-900">v1.0.0</span>
          </div>
        </div>

        {/* Logout card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3.5 text-center text-sm font-medium text-red-600 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}

export default InspectorProfilePage;
