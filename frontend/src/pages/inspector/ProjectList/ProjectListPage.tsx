import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Search, MapPin, Calendar, CheckCircle } from 'lucide-react';
import { listProjects, batchGetProjectPlans, type Project, type ProjectPlan } from '@/api/projects';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ProjectWithPlan extends Project {
  plan?: ProjectPlan | null;
}

function InspectorProjectListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectWithPlan[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  const loadProjects = async (keyword?: string) => {
    setLoading(true);
    try {
      const res = await listProjects({ size: 100, projectName: keyword || undefined });
      const records = res.data.records;

      let planMap: Record<number, ProjectPlan> = {};
      if (records.length > 0) {
        try {
          const planRes = await batchGetProjectPlans(records.map(p => p.id));
          planMap = planRes.data || {};
        } catch { /* ignore */ }
      }

      setProjects(records.map(p => ({ ...p, plan: planMap[p.id] || null })));
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleSearch = () => {
    loadProjects(searchText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="px-4 py-3">
      <h1 className="text-xl font-bold text-navy mb-4">巡检首页</h1>

      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="搜索项目名称"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal transition-colors"
        />
      </div>

      {projects.length > 0 ? (
        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}/stations`)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="text-base font-bold text-navy">{project.projectName}</div>

              <div className="flex items-center gap-1 mt-1.5 text-sm text-gray-500">
                <MapPin size={14} className="shrink-0" />
                <span>{project.propertyCompany} · {project.stationType}</span>
              </div>

              {project.plan ? (
                <>
                  <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} className="text-gray-400" />
                      <span>{project.plan.startTime} ~ {project.plan.endTime}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">
                        {project.plan.planName}
                      </span>
                      <span className="text-xs font-medium text-teal">
                        {project.plan.inspectedCount}/{project.plan.totalCount} · {project.plan.totalCount > 0 ? Math.round(project.plan.inspectedCount * 100 / project.plan.totalCount) : 0}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal rounded-full transition-all duration-500"
                        style={{ width: `${project.plan.totalCount > 0 ? Math.min(project.plan.inspectedCount * 100 / project.plan.totalCount, 100) : 0}%` }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-400">
                  <CheckCircle size={14} />
                  <span>当前无巡检计划，无需巡检</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={FolderOpen} message="暂无巡检项目" />
      )}
    </div>
  );
}

export default InspectorProjectListPage;
