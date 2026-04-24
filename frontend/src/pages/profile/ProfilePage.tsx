import { useNavigate } from 'react-router-dom';
import { KeyRound, LogOut, Info, ChevronRight, CircleUser, Contact, Phone, Shield } from 'lucide-react';
import { changePassword, getCurrentUser } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { showToast } from '@/components/ui/Toast';
import { confirm, showDialog } from '@/components/ui/Dialog';
import { useEffect } from 'react';

function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    getCurrentUser()
      .then(res => setUser(res.data))
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    const ok = await confirm({ content: '确定退出登录吗？' });
    if (ok) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const openChangePasswordDialog = () => {
    let oldPwd = '';
    let newPwd = '';
    let confirmPwd = '';
    const closeRef: { current?: () => void } = {};
    showDialog({
      closeRef,
      title: '修改密码',
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">原密码</label>
            <input
              type="password"
              onChange={(e) => { oldPwd = e.target.value; }}
              placeholder="请输入原密码"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">新密码</label>
            <input
              type="password"
              onChange={(e) => { newPwd = e.target.value; }}
              placeholder="至少6位，需包含字母和数字"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">确认新密码</label>
            <input
              type="password"
              onChange={(e) => { confirmPwd = e.target.value; }}
              placeholder="请再次输入新密码"
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
          onClick: () => {
            if (!oldPwd || !newPwd || !confirmPwd) {
              showToast({ icon: 'fail', content: '请填写完整' });
              return false;
            }
            if (newPwd.length < 6) {
              showToast({ icon: 'fail', content: '新密码至少6位' });
              return false;
            }
            if (!/[a-zA-Z]/.test(newPwd) || !/[0-9]/.test(newPwd)) {
              showToast({ icon: 'fail', content: '密码必须包含字母和数字' });
              return false;
            }
            if (oldPwd === newPwd) {
              showToast({ icon: 'fail', content: '新密码不能与原密码相同' });
              return false;
            }
            if (newPwd !== confirmPwd) {
              showToast({ icon: 'fail', content: '两次输入的新密码不一致' });
              return false;
            }
            changePassword({ oldPassword: oldPwd, newPassword: newPwd })
              .then(() => {
                showToast({ icon: 'success', content: '密码修改成功' });
                closeRef.current?.();
              })
              .catch((e: any) => {
                showToast({ icon: 'fail', content: e.message || '修改失败' });
              });
            return false;
          },
        },
      ],
    });
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
                <CircleUser size={16} className="text-gray-400" />
                <span>账号</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{user?.username}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-2.5 text-sm text-gray-500">
                <Contact size={16} className="text-gray-400" />
                <span>姓名</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{user?.realName}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-2.5 text-sm text-gray-500">
                <Phone size={16} className="text-gray-400" />
                <span>电话</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{user?.phone || '-'}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-2.5 text-sm text-gray-500">
                <Shield size={16} className="text-gray-400" />
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
