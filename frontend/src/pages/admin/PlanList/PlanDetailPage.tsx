import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, CheckCircle, TrendingUp, AlertTriangle, Trophy } from 'lucide-react';
import { getPlanStats, finishPlan, type PlanStats } from '@/api/plans';
import { showToast } from '@/components/ui/Toast';
import { confirm } from '@/components/ui/Dialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const statusConfig: Record<number, { text: string; bg: string; textClass: string }> = {
  0: { text: '未开始', bg: 'bg-gray-100', textClass: 'text-gray-600' },
  1: { text: '进行中', bg: 'bg-teal/10', textClass: 'text-teal' },
  2: { text: '已结束', bg: 'bg-green-50', textClass: 'text-green-600' },
};

function PlanDetailPage() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlanStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!planId) return;
    setLoading(true);
    getPlanStats(Number(planId))
      .then(res => {
        setStats(res.data);
      })
      .catch(e => {
        showToast({ icon: 'fail', content: e.message || '加载计划详情失败' });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [planId]);

  const handleFinish = async () => {
    if (!planId) return;
    const ok = await confirm({
      title: '结束计划',
      content: '确定手动结束此计划吗？此操作不可撤销。',
    });
    if (!ok) return;
    try {
      await finishPlan(Number(planId));
      showToast({ icon: 'success', content: '计划已结束' });
      const res = await getPlanStats(Number(planId));
      setStats(res.data);
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '操作失败' });
    }
  };

  if (loading || !stats) return <LoadingSpinner size="lg" />;

  const sc = statusConfig[stats.status] || statusConfig[0];
  const planFinished = stats.status === 2;

  return (
    <div className="flex flex-col gap-6">
      {/* Back + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-navy"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-navy">{stats.planName}</h1>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${sc.bg} ${sc.textClass}`}>
            {sc.text}
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Users size={18} />
            <span className="text-sm">农户总数</span>
          </div>
          <p className="text-2xl font-bold text-navy">{stats.farmerCount}<span className="text-sm font-normal text-gray-400 ml-1">户</span></p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <CheckCircle size={18} />
            <span className="text-sm">已巡检</span>
          </div>
          <p className="text-2xl font-bold text-teal">{stats.inspectedCount}<span className="text-sm font-normal text-gray-400 ml-1">户</span></p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <TrendingUp size={18} />
            <span className="text-sm">完成率</span>
          </div>
          <p className="text-2xl font-bold text-gold">{stats.completionRate}<span className="text-sm font-normal text-gray-400 ml-1">%</span></p>
        </div>
      </div>

      {/* Project Ranking */}
      {stats.projectRanking.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <Trophy size={18} className="text-gold" />
            <h2 className="text-base font-semibold text-navy">项目完成排名</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.projectRanking.map((r, i) => (
              <div key={r.projectId} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
                  i === 0 ? 'bg-gold/20 text-gold' :
                  i === 1 ? 'bg-gray-200 text-gray-600' :
                  i === 2 ? 'bg-orange-100 text-orange-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-gray-700 truncate">{r.projectName}</span>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="w-24 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-teal transition-all"
                      style={{ width: `${Math.min(r.completionRate, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-navy w-12 text-right">{r.completionRate}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger Zone: Finish Plan */}
      {!planFinished && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-700">结束计划</h3>
              <p className="mt-1 text-xs text-red-500">手动结束后计划将不再接受新的巡检记录，此操作不可撤销。</p>
            </div>
            <button
              onClick={handleFinish}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 shrink-0"
            >
              手动结束计划
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanDetailPage;
