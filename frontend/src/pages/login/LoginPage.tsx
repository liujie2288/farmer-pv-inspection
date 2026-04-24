import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Zap, ShieldCheck } from 'lucide-react';
import { login, getCurrentUser, changePassword } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { showToast } from '@/components/ui/Toast';

function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loginData, setLoginData] = useState<{ username: string; password: string } | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      showToast({ icon: 'fail', content: '请输入用户名和密码' });
      return;
    }
    setLoading(true);
    try {
      await login({ username, password });
      const userRes = await getCurrentUser();
      const user = userRes.data;
      setUser(user);

      if (user.needResetPwd) {
        setLoginData({ username, password });
        setShowChangePassword(true);
        showToast({ icon: 'warning', content: '首次登录，请修改密码' });
      } else {
        navigate(user.role === 'admin' ? '/admin' : '/', { replace: true });
      }
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '登录失败' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showToast({ icon: 'fail', content: '密码至少6位' });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast({ icon: 'fail', content: '两次密码不一致' });
      return;
    }
    if (!loginData) return;
    try {
      await changePassword({
        oldPassword: loginData.password,
        newPassword,
      });
      showToast({ icon: 'success', content: '密码修改成功' });
      setShowChangePassword(false);
      const user = useAuthStore.getState().user!;
      navigate(user.role === 'admin' ? '/admin' : '/', { replace: true });
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '修改密码失败' });
    }
  };

  if (showChangePassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-navy via-navy-light to-navy-dark flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-teal to-teal-dark rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <ShieldCheck size={28} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-navy">修改密码</h1>
            <p className="text-sm text-gray-500 mt-1">首次登录请设置新密码</p>
          </div>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="请输入新密码（至少6位）"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none text-base transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none text-base transition"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-teal to-teal-dark text-white py-3.5 rounded-lg font-bold text-base hover:shadow-lg transition-shadow"
            >
              确认修改
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy via-navy-light to-navy-dark flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal to-teal-dark rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-navy">光伏巡检系统</h1>
          <p className="text-sm text-gray-500 mt-1">分布式光伏发电项目管理平台</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
            <div className="relative">
              <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none text-base transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none text-base transition"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-teal to-teal-dark text-white py-3.5 rounded-lg font-bold text-base hover:shadow-lg transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
