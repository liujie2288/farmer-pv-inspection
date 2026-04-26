import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Users, Calendar, CheckCircle } from 'lucide-react';
import { listStations, Station } from '@/api/stations';
import { getProject, getProjectPlan, type ProjectPlan } from '@/api/projects';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useDebounce } from '@/hooks/useDebounce';
import { showToast } from '@/components/ui/Toast';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusTag from '@/components/ui/StatusTag';

type FilterStatus = 'all' | 'uninspected' | 'inspected';

function InspectorStationListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const pid = Number(projectId);

  const [projectName, setProjectName] = useState('');
  const [plan, setPlan] = useState<ProjectPlan | null>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pid) return;
    getProject(pid)
      .then(res => setProjectName(res.data.projectName))
      .catch(() => setProjectName(''));
    getProjectPlan(pid)
      .then(res => setPlan(res.data))
      .catch(() => setPlan(null));
  }, [pid]);

  const statusParam = filterStatus === 'all'
    ? undefined
    : filterStatus === 'inspected' ? 1 : 0;

  const debouncedSearch = useDebounce(searchText, 500);

  const loadStations = useCallback(async (p: number = 1, keyword?: string) => {
    try {
      const res = await listStations(pid, {
        page: p,
        size: 50,
        keyword: keyword || undefined,
        inspectStatus: statusParam,
      });
      setStations(prev => p === 1 ? res.data.records : [...prev, ...res.data.records]);
      setTotal(res.data.total);
      setPage(p);
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '加载电站列表失败' });
    } finally {
      setLoading(false);
    }
  }, [pid, statusParam]);

  useEffect(() => {
    setLoading(true);
    loadStations(1, debouncedSearch);
  }, [loadStations, debouncedSearch]);

  const sentinelRef = useInfiniteScroll(
    () => loadStations(page + 1, debouncedSearch),
    { hasMore: stations.length < total, loading },
  );

  const handleInspect = (stationId: number) => {
    const params = plan ? `?planId=${plan.planId}` : '';
    navigate(`/projects/${pid}/stations/${stationId}/inspect${params}`);
  };

  const filterTabs: { key: FilterStatus; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'uninspected', label: '未巡检' },
    { key: 'inspected', label: '已巡检' },
  ];

  const inspectedCount = plan?.inspectedCount ?? 0;
  const totalCount = plan?.totalCount ?? 0;
  const uninspectedCount = totalCount - inspectedCount;
  const completionRate = totalCount > 0 ? Math.round(inspectedCount * 100 / totalCount) : 0;

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
            {projectName || '电站列表'}
          </h1>
        </div>
      </div>

      <div className="px-4 pt-3 pb-6">
        {/* Plan Info */}
        {plan ? (
          <div className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-navy">{plan.planName}</span>
              <span className="text-xs font-medium text-teal">{completionRate}%</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
              <Calendar size={12} />
              <span>{plan.startTime} ~ {plan.endTime}</span>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="flex-1 text-center">
                <div className="text-lg font-bold text-gray-900">{totalCount}</div>
                <div className="text-gray-500 text-xs mt-0.5">电站总数</div>
              </div>
              <div className="flex-1 text-center border-l border-gray-100">
                <div className="text-lg font-bold text-green-600">{inspectedCount}</div>
                <div className="text-gray-500 text-xs mt-0.5">已巡检</div>
              </div>
              <div className="flex-1 text-center border-l border-gray-100">
                <div className="text-lg font-bold text-amber-600">{uninspectedCount}</div>
                <div className="text-gray-500 text-xs mt-0.5">未巡检</div>
              </div>
            </div>
            <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-teal rounded-full transition-all duration-500"
                style={{ width: `${Math.min(completionRate, 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1.5 bg-white rounded-xl p-4 mb-3 text-sm text-gray-400 shadow-sm border border-gray-100">
            <CheckCircle size={16} />
            <span>当前无巡检计划，无需巡检</span>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索户主姓名或编号"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full bg-white rounded-lg pl-9 pr-4 py-2.5 text-sm border border-gray-200 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal/30 transition-colors"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-3">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
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

        {/* Station List */}
        {loading && stations.length === 0 ? (
          <LoadingSpinner />
        ) : stations.length === 0 ? (
          <EmptyState icon={Users} message="暂无电站数据" />
        ) : (
          <div className="bg-white rounded-xl overflow-hidden">
            {stations.map(station => (
              <div
                key={station.id}
                className="bg-white rounded-lg px-4 py-3 flex justify-between items-center border-b border-gray-50 last:border-b-0"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">{station.ownerName}</span>
                    <StatusTag inspected={station.status === 1} />
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {station.stationCode}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => navigate(`/projects/${pid}/stations/${station.id}`)}
                    className="border border-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    详情
                  </button>
                  <button
                    onClick={() => handleInspect(station.id)}
                    disabled={!plan}
                    className={
                      plan
                        ? 'bg-teal text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-teal-dark transition-colors'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed px-4 py-1.5 rounded-lg text-sm font-medium'
                    }
                  >
                    巡检
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-1" />
        {loading && stations.length > 0 && (
          <div className="text-center mt-4">
            <span className="text-sm text-gray-400">加载中...</span>
          </div>
        )}

        {stations.length > 0 && (
          <div className="text-center text-xs text-gray-400 mt-3">
            共 {total} 条记录
          </div>
        )}
      </div>
    </div>
  );
}

export default InspectorStationListPage;
