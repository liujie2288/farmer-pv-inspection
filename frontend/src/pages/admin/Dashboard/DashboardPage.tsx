import { useState, useEffect, useCallback } from 'react';
import {
  FolderOpen,
  Users,
  CheckCircle,
  Clock,
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
    key: 'stations',
    label: '电站总数',
    icon: Users,
    bg: 'bg-[#00A8CC]',
  },
  {
    key: 'weekInspected',
    label: '本周已巡检',
    icon: CheckCircle,
    bg: 'bg-emerald-600',
  },
] as const;

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
        stations: stats.totalStations,
        weekInspected: stats.weekInspected,
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
        <div className="grid grid-cols-3 gap-3">
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
                进行中的任务
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
    </div>
  );
}

export default DashboardPage;
