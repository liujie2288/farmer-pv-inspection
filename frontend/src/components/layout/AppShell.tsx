import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import { SidebarProvider } from './SidebarContext';
import { useAuthStore } from '@/store/authStore';
import { forceChangePassword, getCurrentUser } from '@/api/auth';
import { showToast } from '@/components/ui/Toast';
import type { MenuItem } from './Sidebar';

interface AppShellProps {
  menuItems: MenuItem[];
  children: React.ReactNode;
}

function ForceChangePasswordOverlay() {
  const setUser = useAuthStore((s) => s.setUser);
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPwd || !confirmPwd) {
      showToast({ icon: 'fail', content: '请填写完整' });
      return;
    }
    if (newPwd.length < 8) {
      showToast({ icon: 'fail', content: '新密码至少8位' });
      return;
    }
    if (/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':",./<>?`~]/.test(newPwd)) {
      showToast({ icon: 'fail', content: '密码只能包含字母、数字和常见符号' });
      return;
    }
    if (!/[a-zA-Z]/.test(newPwd) || !/[0-9]/.test(newPwd)) {
      showToast({ icon: 'fail', content: '密码必须包含字母和数字' });
      return;
    }
    if (newPwd !== confirmPwd) {
      showToast({ icon: 'fail', content: '两次输入的新密码不一致' });
      return;
    }
    setSubmitting(true);
    try {
      await forceChangePassword(newPwd);
      const res = await getCurrentUser();
      setUser(res.data);
      showToast({ icon: 'success', content: '密码修改成功' });
    } catch (e: any) {
      const res = await getCurrentUser();
      setUser(res.data);
      showToast({ icon: 'fail', content: e.message || '修改失败' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <ShieldCheck size={26} className="text-white" />
          </div>
          <h2 className="text-lg font-bold text-navy">首次登录，请修改密码</h2>
          <p className="text-sm text-gray-500 mt-1">为确保账号安全，请设置新密码后继续使用</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
            <input
              type="password"
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              placeholder="至少8位，需包含字母和数字"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none text-base transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
            <input
              type="password"
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              placeholder="请再次输入新密码"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none text-base transition"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-teal to-teal-dark text-white py-3.5 rounded-lg font-bold text-base hover:shadow-lg transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? '提交中...' : '确认修改'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AppShell({ menuItems, children }: AppShellProps) {
  const user = useAuthStore((s) => s.user);

  return (
    <SidebarProvider>
      <TopBar />
      <Sidebar menuItems={menuItems} />
      <main className="lg:ml-64 p-4 bg-gray-50" style={{ paddingTop: '4.5rem' }}>
        {children}
      </main>
      {user?.needResetPwd && <ForceChangePasswordOverlay />}
    </SidebarProvider>
  );
}
