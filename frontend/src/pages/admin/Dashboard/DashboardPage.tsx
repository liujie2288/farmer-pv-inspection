import { useState, useEffect, useCallback } from 'react';
import {
  FolderOpen,
  Users,
  CheckCircle,
  BarChart3,
  Clock,
  Trophy,
  RefreshCw,
} from 'lucide-react';
import { getGlobalStats, type GlobalStats } from '@/api/stats';
import { showToast } from '@/components/ui/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const statCards = [
  {
    key: 'projects',
    label: '项目总数',
    icon: FolderOpen,
    bg: 'bg-[#0B3D91]',
  },
  {
    key: 'farmers',
    label: '农户总数',
    icon: Users,
    bg: 'bg-[#00A8CC]',
  },
  {
    key: 'inspected',
    label: '已巡检',
    icon: CheckCircle,
    bg: 'bg-emerald-600',
  },
  {
    key: 'rate',
    label: '完成率',
    icon: BarChart3,
    bg: 'bg-[#D4A843]',
  },
] as const;

function getRankBadge(idx: number) {
  if (idx === 0) return 'bg-amber-400 text-amber-900';
  if (idx === 1) return 'bg-gray-300 text-gray-700';
  if (idx === 2) return 'bg-amber-700 text-amber-100';
  return 'bg-gray-100 text-gray-500';
}

function getProgressColor(rate: number) {
  if (rate >= 80) return 'bg-emerald-500';
  if (rate >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

function DashboardPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await getGlobalStats();
      setStats(res.data);
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '加载失败' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  const statValues: Record<string, string | number> = stats
    ? {
        projects: stats.totalProjects,
        farmers: stats.totalFarmers,
        inspected: stats.totalInspected,
        rate: `${stats.completionRate}%`,
      }
    : {};

  return (
    <div className="min-h-full bg-gray-50 -m-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0B3D91] to-[#0a2e6e] px-5 pt-6 pb-14 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-wide">数据概览</h1>
            <p className="mt-1 text-sm text-blue-200">
              分布式光伏巡检管理平台
            </p>
          </div>
          <button
            onClick={() => load(false)}
            disabled={refreshing}
            className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25 active:bg-white/10 disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={refreshing ? 'animate-spin' : ''}
            />
            刷新
          </button>
        </div>
      </div>

      {/* Stat Cards — overlap header */}
      <div className="-mt-10 px-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.key}
                className={`${card.bg} relative overflow-hidden rounded-xl p-4 shadow-lg`}
              >
                <Icon
                  size={48}
                  className="absolute -right-2 -top-2 text-white/10"
                  strokeWidth={1.5}
                />
                <div className="relative">
                  <p className="text-3xl font-bold text-white">
                    {statValues[card.key] ?? '-'}
                  </p>
                  <p className="mt-1 text-xs font-medium text-white/75">
                    {card.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Plans */}
      {stats && stats.activePlans.length > 0 && (
        <div className="mt-4 px-4">
          <div className="rounded-xl bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
              <Clock size={16} className="text-[#00A8CC]" />
              <h2 className="text-sm font-semibold text-gray-800">
                进行中的计划
              </h2>
              <span className="ml-auto rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-600">
                {stats.activePlans.length}
              </span>
            </div>
            <div className="divide-y divide-gray-50">
              {stats.activePlans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="text-sm text-gray-700">{plan.planName}</span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={12} />
                    截止: {plan.endTime}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Project Ranking */}
      <div className="mt-4 px-4 pb-6">
        <div className="rounded-xl bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-3">
            <Trophy size={16} className="text-[#D4A843]" />
            <h2 className="text-sm font-semibold text-gray-800">
              项目完成排名
            </h2>
          </div>

          {!stats || stats.projectRanking.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-300">
              <BarChart3 size={32} />
              <p className="mt-2 text-sm text-gray-400">暂无数据</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {stats.projectRanking.map((project, idx) => (
                <div
                  key={project.projectId}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  {/* Rank badge */}
                  <span
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${getRankBadge(idx)}`}
                  >
                    {idx + 1}
                  </span>

                  {/* Name + progress bar */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-700">
                      {project.projectName}
                    </p>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getProgressColor(project.completionRate)}`}
                        style={{ width: `${project.completionRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Ratio */}
                  <span
                    className={`flex-shrink-0 text-xs font-semibold ${
                      project.completionRate >= 80
                        ? 'text-emerald-600'
                        : project.completionRate >= 50
                          ? 'text-amber-600'
                          : 'text-red-500'
                    }`}
                  >
                    {project.inspectedCount}/{project.farmerCount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
