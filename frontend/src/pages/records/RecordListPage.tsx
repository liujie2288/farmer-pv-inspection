import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, FileText, Pencil, ChevronRight } from 'lucide-react';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { listInspections } from '@/api/inspections';
import { useAuthStore } from '@/store/authStore';
import { showToast } from '@/components/ui/Toast';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const statusTabs: { label: string; value: number | undefined }[] = [
  { label: '全部', value: undefined },
  { label: '进行中', value: 1 },
  { label: '已完成', value: 2 },
];

function RecordListPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p: number = 1, append: boolean = false) => {
    setLoading(true);
    try {
      const res = await listInspections({
        page: p,
        size: 20,
        keyword: keyword || undefined,
        status: statusFilter,
      });
      const newRecords = res.data.records;
      setRecords(prev => (append ? [...prev, ...newRecords] : newRecords));
      setTotal(res.data.total);
      setPage(p);
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '加载失败' });
    } finally {
      setLoading(false);
    }
  }, [keyword, statusFilter]);

  useEffect(() => {
    load(1);
  }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
  };

  const handleRecordClick = (id: number) => {
    navigate(isAdmin ? `/admin/records/${id}` : `/records/${id}`);
  };

  const hasMore = records.length < total;

  const sentinelRef = useInfiniteScroll(
    () => load(page + 1, true),
    { hasMore, loading },
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy">巡检记录</h1>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="搜索项目/巡检员/农户"
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
      {loading && records.length === 0 ? (
        <LoadingSpinner />
      ) : records.length === 0 ? (
        <EmptyState icon={FileText} message="暂无巡检记录" />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {records.map((r) => {
              const statusBadge = r.canEdit
                ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal/10 text-teal"><Pencil size={12} />可编辑</span>
                : r.planStatus === 2
                  ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">已完成</span>
                  : null;
              return (
                <div
                  key={r.id}
                  onClick={() => handleRecordClick(r.id)}
                  className="group cursor-pointer bg-white rounded-xl shadow-sm border border-gray-100 p-5 transition-all hover:border-teal/30 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-navy truncate group-hover:text-teal">
                        {r.projectName ? `${r.projectName} - ${r.farmerName}` : (r.farmerName || r.planName)}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 truncate">
                        {r.planName}{r.inspectorName ? ` · 巡检员: ${r.inspectorName}` : ''}
                      </p>
                      {r.createTime && (
                        <p className="mt-1.5 text-xs text-gray-400">
                          {r.createTime.substring(0, 19).replace('T', ' ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {statusBadge}
                      {r.canEdit && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(isAdmin ? `/admin/records/${r.id}/edit` : `/records/${r.id}/edit`);
                          }}
                          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-teal/5 hover:text-teal"
                          title="编辑"
                        >
                          <Pencil size={16} />
                        </button>
                      )}
                      <ChevronRight size={16} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div ref={sentinelRef} className="h-1" />
          {loading && records.length > 0 && (
            <div className="flex justify-center py-4">
              <span className="text-sm text-gray-400">加载中...</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default RecordListPage;
