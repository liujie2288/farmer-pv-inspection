import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Info, Users } from 'lucide-react';
import { listFarmers, Farmer } from '@/api/farmers';
import { getProject, getProjectStats, ProjectStats } from '@/api/projects';
import { getActivePlan, InspectPlan } from '@/api/plans';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import StatusTag from '@/components/ui/StatusTag';
import { showToast } from '@/components/ui/Toast';
import EmptyState from '@/components/ui/EmptyState';
import { showDialog } from '@/components/ui/Dialog';

type FilterStatus = 'all' | 'uninspected' | 'inspected';

function InspectorFarmerListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const pid = Number(projectId);

  const [projectName, setProjectName] = useState('');
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [activePlan, setActivePlan] = useState<InspectPlan | null>(null);
  const [loading, setLoading] = useState(true);

  // Load project name and stats
  useEffect(() => {
    if (!pid) return;
    getProject(pid)
      .then(res => setProjectName(res.data.projectName))
      .catch(() => setProjectName(''));
    getProjectStats(pid)
      .then(res => setStats(res.data))
      .catch(() => {});
    getActivePlan(pid)
      .then(res => setActivePlan(res.data))
      .catch(() => {});
  }, [pid]);

  const statusParam = filterStatus === 'all'
    ? undefined
    : filterStatus === 'inspected' ? 1 : 0;

  const loadFarmers = useCallback(async (p: number = 1) => {
    try {
      const res = await listFarmers(pid, {
        page: p,
        size: 50,
        farmerName: searchText || undefined,
        status: statusParam,
      });
      setFarmers(prev => p === 1 ? res.data.records : [...prev, ...res.data.records]);
      setTotal(res.data.total);
      setPage(p);
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '加载农户列表失败' });
    } finally {
      setLoading(false);
    }
  }, [pid, searchText, statusParam]);

  useEffect(() => {
    setLoading(true);
    loadFarmers(1);
  }, [loadFarmers]);

  const sentinelRef = useInfiniteScroll(
    () => loadFarmers(page + 1),
    { hasMore: farmers.length < total, loading },
  );

  const handleSearch = () => {
    setLoading(true);
    loadFarmers(1);
  };

  const handleFilterChange = (status: FilterStatus) => {
    setFilterStatus(status);
  };

  const handleInspect = (farmerId: number) => {
    const params = activePlan ? `?planId=${activePlan.id}` : '';
    navigate(`/projects/${pid}/farmers/${farmerId}/inspect${params}`);
  };

  const handleShowProjectInfo = () => {
    if (!stats) return;
    showDialog({
      title: projectName || '项目信息',
      content: (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">农户总数</span>
            <span className="font-medium">{stats.farmerCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">已巡检</span>
            <span className="font-medium text-green-600">{stats.inspectedCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">未巡检</span>
            <span className="font-medium text-amber-600">{stats.uninspectedCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">完成率</span>
            <span className="font-medium">{stats.completionRate}%</span>
          </div>
          {stats.activePlan && (
            <div className="flex justify-between">
              <span className="text-gray-500">当前计划</span>
              <span className="font-medium text-teal">{stats.activePlan.planName}</span>
            </div>
          )}
        </div>
      ),
      actions: [{ label: '关闭', primary: true, onClick: () => {} }],
    });
  };

  const filterTabs: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'uninspected', label: '未巡检' },
    { key: 'inspected', label: '已巡检' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-100">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="返回"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="ml-2 text-base font-semibold text-gray-900 truncate flex-1">
            {projectName || '农户列表'}
          </h1>
          <button
            onClick={handleShowProjectInfo}
            className="p-2 -mr-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="项目信息"
          >
            <Info size={20} className="text-gray-500" />
          </button>
        </div>
      </div>

      <div className="px-4 pt-3 pb-6">
        {/* Stats Summary */}
        {stats && (
          <div className="flex gap-4 bg-white rounded-xl p-3 mb-3 text-sm">
            <div className="flex-1 text-center">
              <div className="text-lg font-bold text-gray-900">{stats.farmerCount}</div>
              <div className="text-gray-500 text-xs mt-0.5">农户总数</div>
            </div>
            <div className="flex-1 text-center border-l border-gray-100">
              <div className="text-lg font-bold text-green-600">{stats.inspectedCount}</div>
              <div className="text-gray-500 text-xs mt-0.5">已巡检</div>
            </div>
            <div className="flex-1 text-center border-l border-gray-100">
              <div className="text-lg font-bold text-amber-600">{stats.uninspectedCount}</div>
              <div className="text-gray-500 text-xs mt-0.5">未巡检</div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索农户姓名或编号"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full bg-white rounded-lg pl-9 pr-4 py-2.5 text-sm border border-gray-200 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30 transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-3">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleFilterChange(tab.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterStatus === tab.key
                  ? 'bg-teal text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Farmer List */}
        {loading && farmers.length === 0 ? (
          <div className="flex justify-center py-16 text-gray-400 text-sm">加载中...</div>
        ) : farmers.length === 0 ? (
          <EmptyState
            icon={Users}
            message="暂无农户数据"
          />
        ) : (
          <div className="bg-white rounded-xl overflow-hidden">
            {farmers.map(farmer => (
              <div
                key={farmer.id}
                className="bg-white rounded-lg px-4 py-3 flex justify-between items-center border-b border-gray-50 last:border-b-0"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {farmer.farmerName}
                    </span>
                    <StatusTag inspected={farmer.status === 1} />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {farmer.farmerCode}
                  </div>
                </div>
                <button
                  onClick={() => handleInspect(farmer.id)}
                  disabled={!activePlan}
                  className={
                    activePlan
                      ? 'bg-teal text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-teal-dark transition-colors'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed px-4 py-1.5 rounded-lg text-sm font-medium'
                  }
                >
                  巡检
                </button>
              </div>
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-1" />
        {loading && farmers.length > 0 && (
          <div className="text-center mt-4">
            <span className="text-sm text-gray-400">加载中...</span>
          </div>
        )}

        {/* Total count */}
        {farmers.length > 0 && (
          <div className="text-center text-xs text-gray-400 mt-3">
            共 {total} 条记录
          </div>
        )}
      </div>
    </div>
  );
}

export default InspectorFarmerListPage;
