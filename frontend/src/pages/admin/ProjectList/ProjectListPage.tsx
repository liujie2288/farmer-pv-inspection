import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, FolderOpen } from 'lucide-react';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import {
  listProjects,
  type Project,
} from '@/api/projects';
import { showToast } from '@/components/ui/Toast';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function ProjectListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  const loadProjects = useCallback(
    async (p: number = 1, append: boolean = false) => {
      setLoading(true);
      try {
        const res = await listProjects({
          page: p,
          size: pageSize,
          projectName: searchText || undefined,
        });
        const records = res.data.records;
        setProjects(prev => (append ? [...prev, ...records] : records));
        setTotal(res.data.total);
        setPage(p);
      } catch (e: any) {
        showToast({ icon: 'fail', content: e.message || '加载项目列表失败' });
      } finally {
        setLoading(false);
      }
    },
    [searchText],
  );

  useEffect(() => {
    loadProjects(1);
  }, [loadProjects]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadProjects(1);
  };

  const hasMore = projects.length < total;

  const sentinelRef = useInfiniteScroll(
    () => loadProjects(page + 1, true),
    { hasMore, loading },
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy">项目管理</h1>
        <button
          onClick={() => navigate('/admin/projects/new')}
          className="flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-dark"
        >
          <Plus size={16} />
          新增项目
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder="搜索项目名称"
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
      {loading && projects.length === 0 ? (
        <LoadingSpinner />
      ) : projects.length === 0 ? (
        <EmptyState icon={FolderOpen} message="暂无项目数据" />
      ) : (
        <>
          {/* Project Cards */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {projects.map(p => (
              <div
                key={p.id}
                onClick={() => navigate(`/admin/projects/${p.id}/inverters`)}
                className="group cursor-pointer rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:border-teal/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-navy group-hover:text-teal">
                      {p.projectName}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {p.propertyCompany} &middot; {p.stationType}
                    </p>
                    <div className="mt-3 flex items-center gap-3">
                      {p.province && (
                        <span className="inline-flex items-center rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-medium text-teal">
                          {[p.province, p.city].filter(Boolean).join(' · ')}
                        </span>
                      )}
                      {p.createTime && (
                        <span className="text-xs text-gray-400">
                          {p.createTime.substring(0, 10)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        navigate(`/admin/projects/${p.id}/edit`);
                      }}
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
          {loading && projects.length > 0 && (
            <div className="flex justify-center py-4">
              <span className="text-sm text-gray-400">加载中...</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProjectListPage;
