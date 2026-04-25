import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, CheckCircle, TrendingUp, AlertTriangle, Trophy,
  FileOutput, ImageIcon, Download, RefreshCw, Loader2, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import { getPlanStats, finishPlan, type PlanStats } from '@/api/plans';
import { exportPlan, listExportTasks, getExportTaskStatus, downloadExport, type ExportTaskInfo } from '@/api/export';
import { showToast } from '@/components/ui/Toast';
import { confirm } from '@/components/ui/Dialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const statusConfig: Record<number, { text: string; bg: string; textClass: string }> = {
  0: { text: '未开始', bg: 'bg-gray-100', textClass: 'text-gray-600' },
  1: { text: '进行中', bg: 'bg-teal/10', textClass: 'text-teal' },
  2: { text: '已结束', bg: 'bg-green-50', textClass: 'text-green-600' },
};

const exportStatusMap: Record<number, { text: string; icon: React.ReactNode; color: string }> = {
  0: { text: '导出中', icon: <Loader2 size={14} className="animate-spin" />, color: 'text-teal' },
  1: { text: '已完成', icon: <CheckCircle2 size={14} />, color: 'text-green-600' },
  2: { text: '失败', icon: <XCircle size={14} />, color: 'text-red-500' },
};

function formatTime(iso: string | null | undefined) {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function PlanDetailPage() {
  const { planGroupId } = useParams<{ planGroupId: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportTasks, setExportTasks] = useState<ExportTaskInfo[]>([]);
  const [exporting, setExporting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const gid = Number(planGroupId);

  const loadExportTasks = useCallback(async () => {
    if (!gid) return;
    try {
      const res = await listExportTasks(gid);
      setExportTasks(res.data || []);
    } catch { /* ignore */ }
  }, [gid]);

  const startPolling = useCallback(() => {
    if (pollRef.current) return;
    pollRef.current = setInterval(async () => {
      setExportTasks(prev => {
        const inProgress = prev.filter(t => t.status === 0);
        if (inProgress.length === 0) {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          return prev;
        }
        Promise.all(inProgress.map(t => getExportTaskStatus(t.id).then(r => r.data).catch(() => t)))
          .then(updated => {
            const updatedMap = new Map(updated.map(t => [t.id, t]));
            setExportTasks(prev => prev.map(t => updatedMap.get(t.id) || t));
          });
        return prev;
      });
    }, 2000);
  }, []);

  useEffect(() => {
    if (!gid) return;
    setLoading(true);
    getPlanStats(gid)
      .then(res => setStats(res.data))
      .catch(e => showToast({ icon: 'fail', content: e.message || '加载计划详情失败' }))
      .finally(() => setLoading(false));
    loadExportTasks().then(() => {
      if (exportTasks.some(t => t.status === 0)) startPolling();
    });
  }, [gid]);

  useEffect(() => {
    if (exportTasks.some(t => t.status === 0)) {
      startPolling();
    }
    return () => { if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; } };
  }, [exportTasks, startPolling]);

  const handleExport = async (exportType: number) => {
    if (!gid) return;
    const hasActive = exportTasks.some(t => t.status === 0);
    if (hasActive) {
      showToast({ icon: 'warning', content: '有导出任务正在进行中，请稍后' });
      return;
    }
    setExporting(true);
    try {
      await exportPlan(gid, exportType);
      showToast({ icon: 'success', content: '导出任务已创建' });
      await loadExportTasks();
      startPolling();
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '创建导出失败' });
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = async (taskId: number) => {
    try {
      const res = await downloadExport(taskId);
      window.open(res.data.url, '_blank');
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '获取下载链接失败' });
    }
  };

  const handleFinish = async () => {
    if (!gid) return;
    const ok = await confirm({
      title: '结束计划',
      content: '确定手动结束此计划吗？此操作不可撤销。',
    });
    if (!ok) return;
    try {
      await finishPlan(gid);
      showToast({ icon: 'success', content: '计划已结束' });
      const res = await getPlanStats(gid);
      setStats(res.data);
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '操作失败' });
    }
  };

  if (loading || !stats) return <LoadingSpinner size="lg" />;

  const sc = statusConfig[stats.status] || statusConfig[0];
  const planFinished = stats.status === 2;
  const hasActiveExport = exportTasks.some(t => t.status === 0);

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
            <span className="text-sm">逆变器总数</span>
          </div>
          <p className="text-2xl font-bold text-navy">{stats.inverterCount}<span className="text-sm font-normal text-gray-400 ml-1">户</span></p>
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

      {/* Export Section */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <FileOutput size={18} className="text-teal" />
          <h2 className="text-base font-semibold text-navy">数据导出</h2>
        </div>
        <div className="p-5 space-y-4">
          {/* Export buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => handleExport(0)}
              disabled={exporting || hasActiveExport}
              className="flex-1 flex items-center justify-center gap-2 bg-teal text-white rounded-lg py-2.5 text-sm font-medium hover:bg-teal-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {hasActiveExport ? <Loader2 size={16} className="animate-spin" /> : <FileOutput size={16} />}
              导出PDF报告（含照片）
            </button>
            <button
              onClick={() => handleExport(1)}
              disabled={exporting || hasActiveExport}
              className="flex-1 flex items-center justify-center gap-2 bg-gold text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {hasActiveExport ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
              导出巡检照片
            </button>
          </div>
          <p className="text-xs text-gray-400">
            PDF报告: 所有巡检记录生成含照片的PDF，打包为ZIP下载 &nbsp;|&nbsp; 巡检照片: 按逆变器分组导出所有巡检照片
          </p>

          {/* Export history table */}
          {exportTasks.length > 0 && (
            <div className="mt-4 border border-gray-100 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-xs">
                    <th className="text-left px-4 py-2.5 font-medium">类型</th>
                    <th className="text-left px-4 py-2.5 font-medium">状态</th>
                    <th className="text-left px-4 py-2.5 font-medium">进度</th>
                    <th className="text-left px-4 py-2.5 font-medium">大小</th>
                    <th className="text-left px-4 py-2.5 font-medium">时间</th>
                    <th className="text-right px-4 py-2.5 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {exportTasks.map(task => {
                    const st = exportStatusMap[task.status] || exportStatusMap[2];
                    const progress = task.totalCount > 0
                      ? Math.round((task.processedCount / task.totalCount) * 100) : 0;
                    return (
                      <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                            task.exportType === 0 ? 'bg-teal/10 text-teal' : 'bg-gold/10 text-gold'
                          }`}>
                            {task.exportType === 0 ? <FileOutput size={12} /> : <ImageIcon size={12} />}
                            {task.exportType === 0 ? 'PDF' : '照片'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${st.color}`}>
                            {st.icon} {st.text}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {task.status === 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden min-w-[60px]">
                                <div className="h-full bg-teal rounded-full transition-all" style={{ width: `${progress}%` }} />
                              </div>
                              <span className="text-xs text-gray-500 shrink-0">{task.processedCount}/{task.totalCount}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">
                              {task.status === 1 ? `${task.totalCount}条` : '-'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {task.status === 1 ? formatFileSize(task.fileSize) : '-'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {formatTime(task.createTime)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {task.status === 1 && (
                            <button
                              onClick={() => handleDownload(task.id)}
                              className="inline-flex items-center gap-1 text-teal hover:text-teal-dark text-xs font-medium transition-colors"
                            >
                              <Download size={13} /> 下载
                            </button>
                          )}
                          {task.status === 2 && (
                            <button
                              onClick={() => handleExport(task.exportType)}
                              className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 text-xs font-medium transition-colors"
                            >
                              <RefreshCw size={13} /> 重试
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {exportTasks.length === 0 && (
            <div className="flex flex-col items-center py-6 text-gray-400">
              <Clock size={24} className="mb-1.5" />
              <p className="text-xs">暂无导出记录</p>
            </div>
          )}
        </div>
      </div>

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
