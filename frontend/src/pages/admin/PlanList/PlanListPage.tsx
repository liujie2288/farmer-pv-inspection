import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Globe, Clock, Users, ClipboardList, X } from 'lucide-react';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { listPlans, createPlan, createGlobalPlan, type InspectPlan } from '@/api/plans';
import { listProjects, type Project } from '@/api/projects';
import { showToast } from '@/components/ui/Toast';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const statusTabs: { label: string; value: number | undefined }[] = [
  { label: '全部', value: undefined },
  { label: '未开始', value: 0 },
  { label: '进行中', value: 1 },
  { label: '已结束', value: 2 },
];

const statusConfig: Record<number, { text: string; bg: string; textClass: string }> = {
  0: { text: '未开始', bg: 'bg-gray-100', textClass: 'text-gray-600' },
  1: { text: '进行中', bg: 'bg-teal/10', textClass: 'text-teal' },
  2: { text: '已结束', bg: 'bg-green-50', textClass: 'text-green-600' },
};

function CreatePlanDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [form, setForm] = useState({
    planName: '',
    startTime: '',
    endTime: '',
    isGlobal: false,
    projectId: 0,
    selectedProjectIds: [] as number[],
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    listProjects({ size: 100 })
      .then(res => setProjects(res.data.records))
      .catch(() => {});
  }, []);

  const toggleProject = (pid: number) => {
    setForm(prev => ({
      ...prev,
      selectedProjectIds: prev.selectedProjectIds.includes(pid)
        ? prev.selectedProjectIds.filter(id => id !== pid)
        : [...prev.selectedProjectIds, pid],
    }));
  };

  const handleSubmit = async () => {
    if (!form.planName || !form.startTime || !form.endTime) {
      showToast({ icon: 'warning', content: '请填写完整信息' });
      return;
    }
    try {
      setSubmitting(true);
      if (form.isGlobal) {
        if (form.selectedProjectIds.length === 0) {
          showToast({ icon: 'warning', content: '请选择至少一个项目' });
          return;
        }
        await createGlobalPlan({
          planName: form.planName,
          projectIds: form.selectedProjectIds,
          startTime: form.startTime,
          endTime: form.endTime,
        });
      } else {
        if (!form.projectId) {
          showToast({ icon: 'warning', content: '请选择项目' });
          return;
        }
        await createPlan({
          planName: form.planName,
          projectId: form.projectId,
          startTime: form.startTime,
          endTime: form.endTime,
        });
      }
      showToast({ icon: 'success', content: '创建成功' });
      onSuccess();
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '创建失败' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl relative animate-[fade-in_0.2s_ease-out]">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors text-gray-400 hover:text-gray-600"
          aria-label="关闭"
        >
          <X size={18} />
        </button>
        <h3 className="text-lg font-bold text-navy mb-4 pr-6">创建巡检计划</h3>

        <div className="text-sm text-gray-600 mb-6">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">
                计划名称 <span className="text-red-500">*</span>
              </span>
              <input
                type="text"
                placeholder="请输入计划名称"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                value={form.planName}
                onChange={e => setForm(prev => ({ ...prev, planName: e.target.value }))}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">
                开始时间 <span className="text-red-500">*</span>
              </span>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                value={form.startTime}
                onChange={e => setForm(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">
                结束时间 <span className="text-red-500">*</span>
              </span>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                value={form.endTime}
                onChange={e => setForm(prev => ({ ...prev, endTime: e.target.value }))}
              />
            </label>

            <div className="border-t border-gray-200 pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isGlobal}
                  onChange={e => setForm(prev => ({ ...prev, isGlobal: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300 text-teal focus:ring-teal"
                />
                <span className="text-sm font-medium text-gray-700">全局计划（多项目）</span>
              </label>

              {!form.isGlobal ? (
                <label className="mt-3 flex flex-col gap-1">
                  <span className="text-sm font-medium text-gray-700">
                    关联项目 <span className="text-red-500">*</span>
                  </span>
                  <select
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                    value={form.projectId || ''}
                    onChange={e => setForm(prev => ({ ...prev, projectId: Number(e.target.value) }))}
                  >
                    <option value="" disabled>请选择项目</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.projectName}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-2">
                    已选 {form.selectedProjectIds.length} 个项目
                  </p>
                  {projects.length === 0 ? (
                    <p className="text-center text-sm text-gray-400 py-3">暂无项目</p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto flex flex-col gap-1">
                      {projects.map(p => (
                        <label
                          key={p.id}
                          className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={form.selectedProjectIds.includes(p.id)}
                            onChange={() => toggleProject(p.id)}
                            className="h-4 w-4 rounded border-gray-300 text-teal focus:ring-teal"
                          />
                          <span className="text-sm text-gray-700">{p.projectName}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-teal text-white hover:bg-teal-dark transition-colors disabled:opacity-50"
          >
            创建
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanListPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<InspectPlan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  const loadPlans = useCallback(
    async (p: number = 1, append: boolean = false) => {
      setLoading(true);
      try {
        const res = await listPlans({
          page: p,
          size: pageSize,
          planName: searchText || undefined,
          status: statusFilter,
        });
        const records = res.data.records;
        setPlans(prev => (append ? [...prev, ...records] : records));
        setTotal(res.data.total);
        setPage(p);
      } catch (e: any) {
        showToast({ icon: 'fail', content: e.message || '加载计划列表失败' });
      } finally {
        setLoading(false);
      }
    },
    [searchText, statusFilter],
  );

  useEffect(() => {
    loadPlans(1);
  }, [loadPlans]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPlans(1);
  };

  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const openCreateDialog = () => {
    setCreateDialogOpen(true);
  };

  const handleCreateSuccess = () => {
    setCreateDialogOpen(false);
    loadPlans(1);
  };

  const hasMore = plans.length < total;

  const sentinelRef = useInfiniteScroll(
    () => loadPlans(page + 1, true),
    { hasMore, loading },
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy">巡检计划</h1>
        <button
          onClick={openCreateDialog}
          className="flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-dark"
        >
          <Plus size={16} />
          新增计划
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
            placeholder="搜索计划名称"
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

      {/* Status Filter Tabs */}
      <div className="flex gap-2">
        {statusTabs.map(tab => (
          <button
            key={tab.label}
            onClick={() => setStatusFilter(tab.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-navy text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && plans.length === 0 ? (
        <LoadingSpinner />
      ) : plans.length === 0 ? (
        <EmptyState icon={ClipboardList} message="暂无巡检计划" />
      ) : (
        <>
          {/* Plan Cards */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {plans.map(plan => {
              const sc = statusConfig[plan.status] || statusConfig[0];
              return (
                <div
                  key={plan.id}
                  onClick={() => navigate(`/admin/plans/${plan.id}`)}
                  className="group cursor-pointer rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-teal/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="truncate text-base font-semibold text-navy group-hover:text-teal">
                          {plan.planName}
                        </h3>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${sc.bg} ${sc.textClass}`}>
                          {sc.text}
                        </span>
                        {plan.isGlobal && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2.5 py-0.5 text-xs font-medium text-gold">
                            <Globe size={12} />
                            全局
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 text-sm text-gray-500">
                        {plan.projectName || '全局'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 border-t border-gray-50 pt-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Users size={14} className="text-gray-400" />
                      <span>{plan.inspectedCount}/{plan.farmerCount}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500">
                      <Clock size={14} className="text-gray-400" />
                      <span>{plan.completionRate}%</span>
                    </div>
                    {/* Completion progress bar */}
                    <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-teal transition-all"
                        style={{ width: `${Math.min(plan.completionRate, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div ref={sentinelRef} className="h-1" />
          {loading && plans.length > 0 && (
            <div className="flex justify-center py-4">
              <span className="text-sm text-gray-400">加载中...</span>
            </div>
          )}
        </>
      )}

      {/* Create Plan Dialog */}
      {createDialogOpen && (
        <CreatePlanDialog
          onClose={() => setCreateDialogOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}

export default PlanListPage;
