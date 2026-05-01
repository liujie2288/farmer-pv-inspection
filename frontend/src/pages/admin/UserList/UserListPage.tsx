import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Pencil, Users, Phone, Shield } from 'lucide-react';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { listUsers, createUser, updateUser, toggleUserStatus, User } from '@/api/users';
import { resetPassword } from '@/api/auth';
import { showToast } from '@/components/ui/Toast';
import { showDialog, confirm } from '@/components/ui/Dialog';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

/* ---------- form state types ---------- */

interface CreateForm {
  username: string;
  password: string;
  realName: string;
  phone: string;
  role: string;
}

interface EditForm {
  realName: string;
  phone: string;
  role: string;
  status: number;
}

const emptyCreateForm: CreateForm = {
  username: '',
  password: '',
  realName: '',
  phone: '',
  role: '',
};

/* ---------- component ---------- */

function UserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  const loadUsers = useCallback(
    async (p: number = 1, append: boolean = false) => {
      setLoading(true);
      try {
        const res = await listUsers({
          page: p,
          size: 20,
          keyword: searchText || undefined,
        });
        const records = res.data.records;
        setUsers(prev => (append ? [...prev, ...records] : records));
        setTotal(res.data.total);
        setPage(p);
      } catch (e: any) {
        showToast({ icon: 'fail', content: e.message || '加载失败' });
      } finally {
        setLoading(false);
      }
    },
    [searchText],
  );

  useEffect(() => {
    loadUsers(1);
  }, [loadUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(1);
  };

  /* ---- create dialog ---- */

  const openCreateDialog = async () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const form: CreateForm = { ...emptyCreateForm, password: dateStr };

    const updateField = (field: keyof CreateForm, value: string) => {
      form[field] = value;
    };

    await showDialog({
      title: '新增用户',
      content: (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">
              用户名 <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              maxLength={30}
              placeholder="请输入用户名（最多30字符）"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              onChange={e => updateField('username', e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">
              初始密码
            </span>
            <input
              type="text"
              defaultValue={dateStr}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-gray-50 focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              onChange={e => updateField('password', e.target.value)}
            />
            <span className="text-xs text-gray-400">默认为当前日期，用户首次登录需修改密码</span>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">
              真实姓名 <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              maxLength={20}
              placeholder="请输入真实姓名（最多20字符）"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              onChange={e => updateField('realName', e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">联系电话</span>
            <input
              type="text"
              maxLength={20}
              placeholder="请输入联系电话（最多20字符）"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              onChange={e => updateField('phone', e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">
              角色 <span className="text-red-500">*</span>
            </span>
            <select
              defaultValue=""
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              onChange={e => updateField('role', e.target.value)}
            >
              <option value="" disabled>请选择角色</option>
              <option value="admin">管理员</option>
              <option value="inspector">巡检员</option>
            </select>
          </label>
        </div>
      ),
      actions: [
        { label: '取消', onClick: () => {} },
        {
          label: '创建',
          primary: true,
          onClick: () => {
            if (!form.username || !form.password || !form.realName || !form.role) {
              showToast({ icon: 'warning', content: '请填写完整信息' });
              return false;
            }
            if (!/^[a-z0-9_]{2,30}$/.test(form.username)) {
              showToast({ icon: 'fail', content: '用户名只能包含小写字母、数字和下划线，2-30个字符' });
              return false;
            }
            if (form.password.length < 8) {
              showToast({ icon: 'fail', content: '密码至少8位' });
              return false;
            }
            if (/[^a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':",./<>?`~]/.test(form.password)) {
              showToast({ icon: 'fail', content: '密码只能包含字母、数字和常见符号' });
              return false;
            }
            if (form.realName.length > 20) {
              showToast({ icon: 'fail', content: '真实姓名最多20个字符' });
              return false;
            }
            if (form.phone && form.phone.length > 20) {
              showToast({ icon: 'fail', content: '联系电话最多20个字符' });
              return false;
            }
            if (form.phone && !/^[\d\s\-()+]+$/.test(form.phone)) {
              showToast({ icon: 'fail', content: '联系电话只能包含数字、空格、-、()、+' });
              return false;
            }
            createUser(form)
              .then(() => {
                showToast({ icon: 'success', content: '创建成功' });
                loadUsers(1);
              })
              .catch((e: any) => {
                showToast({ icon: 'fail', content: e.message || '创建失败' });
                return false;
              });
          },
        },
      ],
    });
  };

  /* ---- edit dialog ---- */

  const openEditDialog = async (user: User) => {
    const form: EditForm = {
      realName: user.realName,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
    };

    const updateField = (field: keyof EditForm, value: string | number) => {
      (form as any)[field] = value;
    };

    const closeRef: { current?: () => void } = {};

    await showDialog({
      closeRef,
      title: '编辑用户',
      content: (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">
              真实姓名 <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              maxLength={20}
              defaultValue={user.realName}
              placeholder="请输入真实姓名"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              onChange={e => updateField('realName', e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">联系电话</span>
            <input
              type="text"
              maxLength={20}
              defaultValue={user.phone || ''}
              placeholder="请输入联系电话"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              onChange={e => updateField('phone', e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">角色</span>
            <select
              defaultValue={user.role}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              onChange={e => updateField('role', e.target.value)}
            >
              <option value="admin">管理员</option>
              <option value="inspector">巡检员</option>
            </select>
          </label>

          {/* Danger zone */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={async () => {
                const ok = await confirm({ content: `确定重置用户"${user.realName}"的密码？` });
                if (!ok) return;
                try {
                  const res = await resetPassword(user.id);
                  const tempPassword = res.data.tempPassword;
                  closeRef.current?.();
                  await showDialog({
                    title: '密码重置成功',
                    content: (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">临时密码已生成，请通知用户尽快登录修改密码。</p>
                        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3">
                          <code className="text-lg font-mono font-bold tracking-widest text-navy flex-1 text-center select-all">{tempPassword}</code>
                          <button
                            type="button"
                            onClick={() => {
                                  const textarea = document.createElement('textarea');
                                  textarea.value = tempPassword;
                                  textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0';
                                  document.body.appendChild(textarea);
                                  textarea.select();
                                  textarea.setSelectionRange(0, tempPassword.length);
                                  try { document.execCommand('copy'); } catch { navigator.clipboard?.writeText(tempPassword); }
                                  document.body.removeChild(textarea);
                                  showToast({ icon: 'success', content: '已复制到剪贴板' });
                                }}
                            className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium bg-teal text-white hover:bg-teal-dark transition-colors"
                          >
                            复制
                          </button>
                        </div>
                      </div>
                    ),
                    actions: [{ label: '确定', primary: true, onClick: () => {} }],
                  });
                } catch (e: any) {
                  showToast({ icon: 'fail', content: e.message || '重置失败' });
                }
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
            >
              重置密码
            </button>
            <button
              type="button"
              onClick={async () => {
                const newStatus = user.status === 1 ? 0 : 1;
                try {
                  await toggleUserStatus(user.id, newStatus);
                  showToast({ icon: 'success', content: newStatus === 1 ? '已启用' : '已禁用' });
                  loadUsers(1);
                  closeRef.current?.();
                } catch (e: any) {
                  showToast({ icon: 'fail', content: e.message || '操作失败' });
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                user.status === 1
                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  : 'bg-green-50 text-green-600 hover:bg-green-100'
              }`}
            >
              {user.status === 1 ? '禁用账号' : '启用账号'}
            </button>
          </div>
        </div>
      ),
      actions: [
        { label: '取消', onClick: () => {} },
        {
          label: '保存',
          primary: true,
          onClick: () => {
            if (!form.realName || !form.role) {
              showToast({ icon: 'warning', content: '请填写完整信息' });
              return false;
            }
            if (form.phone && !/^[\d\s\-()+]+$/.test(form.phone)) {
              showToast({ icon: 'fail', content: '联系电话只能包含数字、空格、-、()、+' });
              return false;
            }
            updateUser(user.id, form)
              .then(() => {
                showToast({ icon: 'success', content: '修改成功' });
                loadUsers(1);
              })
              .catch((e: any) => {
                showToast({ icon: 'fail', content: e.message || '修改失败' });
                return false;
              });
          },
        },
      ],
    });
  };

  const hasMore = users.length < total;

  const sentinelRef = useInfiniteScroll(
    () => loadUsers(page + 1, true),
    { hasMore, loading },
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy">用户管理</h1>
        <button
          onClick={openCreateDialog}
          className="flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-dark"
        >
          <Plus size={16} />
          新增用户
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="搜索用户名/姓名/手机号"
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-1 rounded-lg border border-teal px-4 py-2 text-sm font-medium text-teal transition-colors hover:bg-teal/5"
        >
          <Search size={16} />
          搜索
        </button>
      </form>

      {/* Content */}
      {loading && users.length === 0 ? (
        <LoadingSpinner />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} message="暂无用户数据" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {users.map((u) => (
              <div
                key={u.id}
                className="group rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-teal/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="truncate text-base font-semibold text-navy group-hover:text-teal">
                        {u.realName}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          u.role === 'admin'
                            ? 'bg-teal/10 text-teal'
                            : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Shield size={12} />
                        {u.role === 'admin' ? '管理员' : '巡检员'}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          u.status === 1
                            ? 'bg-green-50 text-green-600'
                            : 'bg-red-50 text-red-500'
                        }`}
                      >
                        {u.status === 1 ? '启用' : '禁用'}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-gray-500">
                      {u.username}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      {u.phone && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <Phone size={12} />
                          {u.phone}
                        </span>
                      )}
                      {u.createTime && (
                        <span className="text-xs text-gray-400">
                          {u.createTime.substring(0, 10)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => openEditDialog(u)}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-teal"
                      title="编辑"
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div ref={sentinelRef} className="h-1" />
          {loading && users.length > 0 && (
            <div className="flex justify-center py-4">
              <span className="text-sm text-gray-400">加载中...</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default UserListPage;
