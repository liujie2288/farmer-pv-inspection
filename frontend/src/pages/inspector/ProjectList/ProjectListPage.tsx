import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Users, Search, MapPin } from 'lucide-react';
import { listProjects, getProjectStats, Project, ProjectStats } from '@/api/projects';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ProjectWithStats extends Project {
  stats?: ProjectStats;
}

function InspectorProjectListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectWithStats[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);

  const loadProjects = async (keyword?: string) => {
    setLoading(true);
    try {
      const res = await listProjects({ size: 100, projectName: keyword || undefined });
      const records = res.data.records;

      const withStats = await Promise.all(
        records.map(async (p) => {
          try {
            const statsRes = await getProjectStats(p.id);
            return { ...p, stats: statsRes.data };
          } catch {
            return { ...p, stats: undefined };
          }
        })
      );

      setProjects(withStats);
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

  const completionPercent = (stats?: ProjectStats) => {
    if (!stats || stats.completionRate == null) return 0;
    return Math.round(stats.completionRate);
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="px-4 py-3">
      {/* Page title */}
      <h1 className="text-xl font-bold text-navy mb-4">巡检首页</h1>

      {/* Search input */}
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

      {/* Project cards */}
      {projects.length > 0 ? (
        <div className="space-y-3">
          {projects.map((project) => {
            const percent = completionPercent(project.stats);
            return (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}/farmers`)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                {/* Project name */}
                <div className="text-base font-bold text-navy">{project.projectName}</div>

                {/* Company + type */}
                <div className="flex items-center gap-1 mt-1.5 text-sm text-gray-500">
                  <MapPin size={14} className="shrink-0" />
                  <span>{project.propertyCompany} · {project.stationType}</span>
                </div>

                {/* Farmer count */}
                <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-600">
                  <Users size={14} className="text-gray-400" />
                  <span>{project.farmerCount} 户</span>
                </div>

                {/* Completion rate progress bar */}
                {project.stats && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">巡检进度</span>
                      <span className="text-xs font-medium text-teal">{percent}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={FolderOpen} message="暂无巡检项目" />
      )}
    </div>
  );
}

export default InspectorProjectListPage;
