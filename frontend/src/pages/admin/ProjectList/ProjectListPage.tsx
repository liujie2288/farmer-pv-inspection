import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Pencil, Trash2, FolderOpen } from 'lucide-react';
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  type Project,
} from '@/api/projects';
import { showToast } from '@/components/ui/Toast';
import { showDialog, confirm } from '@/components/ui/Dialog';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface FormState {
  projectName: string;
  propertyCompany: string;
  stationType: string;
}

const emptyForm: FormState = {
  projectName: '',
  propertyCompany: '',
  stationType: '',
};

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

  const openCreateDialog = async () => {
    const form: FormState = { ...emptyForm };

    const updateField = (field: keyof FormState, value: string) => {
      form[field] = value;
    };

    await showDialog({
      title: '新增项目',
      content: (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">
              项目名称 <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              placeholder="请输入项目名称"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              onChange={e => updateField('projectName', e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">
              产权公司 <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              placeholder="请输入产权公司"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              onChange={e => updateField('propertyCompany', e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">
              电站类型 <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              placeholder="请输入电站类型"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              onChange={e => updateField('stationType', e.target.value)}
            />
          </label>
        </div>
      ),
      actions: [
        { label: '取消', onClick: () => {} },
        {
          label: '创建',
          primary: true,
          onClick: async () => {
            if (!form.projectName || !form.propertyCompany || !form.stationType) {
              showToast({ icon: 'warning', content: '请填写完整信息' });
              return;
            }
            try {
              await createProject(form);
              showToast({ icon: 'success', content: '创建成功' });
              loadProjects(1);
            } catch (e: any) {
              showToast({ icon: 'fail', content: e.message || '创建失败' });
            }
          },
        },
      ],
    });
  };

  const openEditDialog = async (project: Project) => {
    const form: FormState = {
      projectName: project.projectName,
      propertyCompany: project.propertyCompany,
      stationType: project.stationType,
    };

    const updateField = (field: keyof FormState, value: string) => {
      form[field] = value;
    };

    await showDialog({
      title: '编辑项目',
      content: (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">
              项目名称 <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              defaultValue={project.projectName}
              placeholder="请输入项目名称"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              onChange={e => updateField('projectName', e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">
              产权公司 <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              defaultValue={project.propertyCompany}
              placeholder="请输入产权公司"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              onChange={e => updateField('propertyCompany', e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">
              电站类型 <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              defaultValue={project.stationType}
              placeholder="请输入电站类型"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              onChange={e => updateField('stationType', e.target.value)}
            />
          </label>
        </div>
      ),
      actions: [
        { label: '取消', onClick: () => {} },
        {
          label: '删除',
          danger: true,
          onClick: async () => {
            const ok = await confirm({
              title: '删除确认',
              content: `确定删除项目"${project.projectName}"吗？此操作不可恢复。`,
            });
            if (ok) {
              try {
                await deleteProject(project.id);
                showToast({ icon: 'success', content: '删除成功' });
                loadProjects(1);
              } catch (e: any) {
                showToast({ icon: 'fail', content: e.message || '删除失败' });
              }
            }
          },
        },
        {
          label: '保存',
          primary: true,
          onClick: async () => {
            if (!form.projectName || !form.propertyCompany || !form.stationType) {
              showToast({ icon: 'warning', content: '请填写完整信息' });
              return;
            }
            try {
              await updateProject(project.id, form);
              showToast({ icon: 'success', content: '修改成功' });
              loadProjects(1);
            } catch (e: any) {
              showToast({ icon: 'fail', content: e.message || '修改失败' });
            }
          },
        },
      ],
    });
  };

  const hasMore = projects.length < total;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-navy">项目管理</h1>
        <button
          onClick={openCreateDialog}
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
                onClick={() => navigate(`/admin/projects/${p.id}/farmers`)}
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
                      <span className="inline-flex items-center rounded-full bg-teal/10 px-2.5 py-0.5 text-xs font-medium text-teal">
                        农户: {p.farmerCount ?? 0}
                      </span>
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
                        openEditDialog(p);
                      }}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-teal"
                      title="编辑"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        confirm({
                          title: '删除确认',
                          content: `确定删除项目"${p.projectName}"吗？此操作不可恢复。`,
                        }).then(async ok => {
                          if (ok) {
                            try {
                              await deleteProject(p.id);
                              showToast({ icon: 'success', content: '删除成功' });
                              loadProjects(1);
                            } catch (e: any) {
                              showToast({
                                icon: 'fail',
                                content: e.message || '删除失败',
                              });
                            }
                          }
                        });
                      }}
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center py-4">
              <button
                onClick={() => loadProjects(page + 1, true)}
                disabled={loading}
                className="rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-600 transition-colors hover:border-teal hover:text-teal disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ProjectListPage;
