import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, KeyRound, LogOut, Info, ChevronRight } from 'lucide-react';
import { changePassword } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { showToast } from '@/components/ui/Toast';
import { confirm, showDialog } from '@/components/ui/Dialog';

function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleLogout = async () => {
    const ok = await confirm({ content: '确定退出登录吗？' });
    if (ok) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const openChangePasswordDialog = () => {
    setOldPassword('');
    setNewPassword('');
    showDialog({
      title: '修改密码',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">原密码</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="请输入原密码"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">新密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="请输入新密码（至少6位）"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition-colors"
            />
          </div>
        </div>
      ),
      actions: [
        { label: '取消', onClick: () => {} },
        {
          label: '确定',
          primary: true,
          onClick: handleChangePassword,
        },
      ],
    });
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      showToast({ icon: 'fail', content: '请填写完整' });
      return;
    }
    if (newPassword.length < 6) {
      showToast({ icon: 'fail', content: '新密码至少6位' });
      return;
    }
    try {
      await changePassword({ oldPassword, newPassword });
      showToast({ icon: 'success', content: '密码修改成功' });
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '修改失败' });
    }
  };

  const roleLabel = user?.role === 'admin' ? '管理员' : '巡检员';

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
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Account settings card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-navy/5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-navy">账号设置</h2>
          </div>
          <div className="divide-y divide-gray-50">
            <button
              onClick={openChangePasswordDialog}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2.5 text-sm text-gray-700">
                <KeyRound size={16} className="text-gray-400" />
                <span>修改密码</span>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2.5 text-sm text-red-600">
                <LogOut size={16} />
                <span>退出登录</span>
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
      </div>
    </div>
  );
}

export default ProfilePage;
