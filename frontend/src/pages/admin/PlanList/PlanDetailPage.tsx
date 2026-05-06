import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, AlertTriangle, Trophy, Download, Loader2, FileArchive, XCircle, ChevronDown, ChevronRight, Image, FileText,
} from 'lucide-react';
import { getPlanStats, finishPlan, type PlanStats } from '@/api/plans';
import { createExportTasks, getExportTasks, getExportDownloadUrl, type ExportTask } from '@/api/export';
import { showToast } from '@/components/ui/Toast';
import { confirm, showDialog } from '@/components/ui/Dialog';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const statusConfig: Record<number, { text: string; bg: string; textClass: string }> = {
  0: { text: '未开始', bg: 'bg-gray-100', textClass: 'text-gray-600' },
  1: { text: '进行中', bg: 'bg-teal/10', textClass: 'text-teal' },
  2: { text: '已结束', bg: 'bg-green-50', textClass: 'text-green-600' },
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

const STATUS_LABELS: Record<number, { text: string; className: string }> = {
  0: { text: '排队中', className: 'text-gray-400' },
  1: { text: '解冻中', className: 'text-amber-500' },
  2: { text: '打包中', className: 'text-blue-500' },
  3: { text: '已完成', className: 'text-green-600' },
  4: { text: '失败', className: 'text-red-500' },
};

const TYPE_LABELS: Record<string, { text: string; icon: typeof Image; className: string }> = {
  photo: { text: '照片', icon: Image, className: 'text-teal bg-teal/10' },
  pdf: { text: '报告', icon: FileText, className: 'text-blue-600 bg-blue-50' },
};

function PlanDetailPage() {
  const { planId: routePlanId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportTasks, setExportTasks] = useState<ExportTask[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const gid = Number(routePlanId);

  const fetchTasks = useCallback(() => {
    if (!gid) return;
    getExportTasks(gid)
      .then(res => setExportTasks(res.data || []))
      .catch(() => {});
  }, [gid]);

  useEffect(() => {
    if (!gid) return;
    setLoading(true);
    getPlanStats(gid)
      .then(res => setStats(res.data))
      .catch(e => showToast({ icon: 'fail', content: e.message || '加载任务详情失败' }))
      .finally(() => setLoading(false));
    fetchTasks();
  }, [gid, fetchTasks]);

  // Poll when there are active tasks
  useEffect(() => {
    const hasActive = exportTasks.some(t => t.status != null && t.status <= 2);
    if (hasActive && !pollingRef.current) {
      pollingRef.current = setInterval(fetchTasks, 6000);
    } else if (!hasActive && pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [exportTasks, fetchTasks]);

  const handleFinish = async () => {
    if (!gid) return;
    const ok = await confirm({
      title: '结束任务',
      content: '确定手动结束此任务吗？此操作不可撤销。',
    });
    if (!ok) return;
    try {
      await finishPlan(gid);
      showToast({ icon: 'success', content: '任务已结束' });
      const res = await getPlanStats(gid);
      setStats(res.data);
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '操作失败' });
    }
  };

  const handleExport = async () => {
    if (!stats || !gid) return;
    const selected = new Set<number>(stats.items.filter(i => i.inspectedCount > 0).map(i => i.projectId));
    const closeRef: { current?: () => void } = {};

    const ok = await new Promise<boolean>((resolve) => {
      const close = (result: boolean) => {
        closeRef.current?.();
        resolve(result);
      };
      showDialog({
        title: '导出照片',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">选择要导出照片的项目：</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.items.map(item => {
                const disabled = item.inspectedCount === 0;
                return (
                <label key={item.projectId} className={`flex items-center gap-3 py-2 px-3 rounded-lg ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    defaultChecked={!disabled}
                    disabled={disabled}
                    onChange={(e) => {
                      if (e.target.checked) selected.add(item.projectId);
                      else selected.delete(item.projectId);
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-teal focus:ring-teal disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-700">{item.projectName}</span>
                  <span className="text-xs text-gray-400 ml-auto">{item.inspectedCount}/{item.totalCount} 已巡检</span>
                </label>
                );
              })}
            </div>
          </div>
        ),
        actions: [
          { label: '取消', onClick: () => close(false) },
          { label: '开始导出', onClick: () => {
            if (selected.size === 0) {
              showToast({ icon: 'warning', content: '请至少选择一个项目' });
              return false;
            }
            close(true);
          }},
        ],
        closeRef,
      });
    });

    if (!ok) return;

    try {
      await createExportTasks(gid, Array.from(selected));
      showToast({ icon: 'success', content: '导出任务已创建' });
      fetchTasks();
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '创建导出任务失败' });
    }
  };

  const handleBatchExport = async () => {
    if (!stats || !gid) return;
    const closeRef: { current?: () => void } = {};

    const ok = await new Promise<{ type: string; projectId: number } | null>((resolve) => {
      const close = (result: { type: string; projectId: number } | null) => {
        closeRef.current?.();
        resolve(result);
      };

      let selectedType = 'pdf';
      let selectedProjectId: number | null = null;

      showDialog({
        title: '批量导出',
        content: (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">导出类型</label>
              <select
                defaultValue="pdf"
                onChange={(e) => { selectedType = e.target.value; }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="pdf">PDF报告</option>
                <option value="photo">照片</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">项目</label>
              <select
                defaultValue=""
                onChange={(e) => { selectedProjectId = Number(e.target.value) || null; }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                <option value="" disabled>请选择项目</option>
                {stats.items.map(item => (
                  <option key={item.projectId} value={item.projectId} disabled={item.inspectedCount === 0}>
                    {item.projectName}（{item.inspectedCount}/{item.totalCount} 已巡检）
                  </option>
                ))}
              </select>
            </div>
          </div>
        ),
        actions: [
          { label: '取消', onClick: () => close(null) },
          { label: '开始导出', onClick: () => {
            if (!selectedProjectId) {
              showToast({ icon: 'warning', content: '请选择一个项目' });
              return false;
            }
            close({ type: selectedType, projectId: selectedProjectId });
          }},
        ],
        closeRef,
      });
    });

    if (!ok) return;

    try {
      const res = await createExportTasks(gid, [ok.projectId], ok.type);
      if (res.data && res.data.length > 0) {
        showToast({ icon: 'success', content: '导出任务已创建' });
      } else {
        showToast({ icon: 'warning', content: ok.type === 'pdf' ? '没有可导出的报告' : '没有可导出的内容' });
      }
      fetchTasks();
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '创建导出任务失败' });
    }
  };

  const handlePdfExport = async () => {
    if (!stats || !gid) return;
    const selected = new Set<number>(stats.items.filter(i => i.inspectedCount > 0).map(i => i.projectId));
    const closeRef: { current?: () => void } = {};

    const ok = await new Promise<boolean>((resolve) => {
      const close = (result: boolean) => {
        closeRef.current?.();
        resolve(result);
      };
      showDialog({
        title: '导出报告',
        content: (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">选择要导出PDF报告的项目：</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {stats.items.map(item => {
                const disabled = item.inspectedCount === 0;
                return (
                <label key={item.projectId} className={`flex items-center gap-3 py-2 px-3 rounded-lg ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    defaultChecked={!disabled}
                    disabled={disabled}
                    onChange={(e) => {
                      if (e.target.checked) selected.add(item.projectId);
                      else selected.delete(item.projectId);
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <span className="text-sm text-gray-700">{item.projectName}</span>
                  <span className="text-xs text-gray-400 ml-auto">{item.inspectedCount}/{item.totalCount} 已巡检</span>
                </label>
                );
              })}
            </div>
          </div>
        ),
        actions: [
          { label: '取消', onClick: () => close(false) },
          { label: '开始导出', onClick: () => {
            if (selected.size === 0) {
              showToast({ icon: 'warning', content: '请至少选择一个项目' });
              return false;
            }
            close(true);
          }},
        ],
        closeRef,
      });
    });

    if (!ok) return;

    try {
      await createExportTasks(gid, Array.from(selected), 'pdf');
      showToast({ icon: 'success', content: '报告导出任务已创建' });
      fetchTasks();
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '创建导出任务失败' });
    }
  };

  const handleDownload = async (taskId: number, batchNo: number) => {
    try {
      const res = await getExportDownloadUrl(taskId, batchNo);
      if (res.data) {
        window.open(res.data, '_blank');
      }
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '获取下载链接失败' });
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
          <span className="text-sm text-gray-400">电站总数</span>
          <p className="text-2xl font-bold text-navy mt-2">{stats.totalCount}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <span className="text-sm text-gray-400">已巡检</span>
          <p className="text-2xl font-bold text-teal mt-2">{stats.inspectedCount}</p>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <span className="text-sm text-gray-400">完成率</span>
          <p className="text-2xl font-bold text-gold mt-2">{stats.completionRate}<span className="text-sm font-normal text-gray-400 ml-1">%</span></p>
        </div>
      </div>

      {/* Project Ranking */}
      {stats.items.length > 0 && (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <Trophy size={18} className="text-gold" />
            <h2 className="text-base font-semibold text-navy">项目完成排名</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.items.map((r, i) => (
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

      {/* Export Tasks */}
      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <FileArchive size={18} className="text-navy" />
            <h2 className="text-base font-semibold text-navy">导出任务</h2>
            <div className="ml-auto flex items-center gap-2">
              {/* hidden: reserved for future use */}
              {false && (
                <>
                  <button onClick={handlePdfExport}>导出报告</button>
                  <button onClick={handleExport}>导出照片</button>
                </>
              )}
              <button
                onClick={handleBatchExport}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-blue-700 transition-colors"
              >
                <Download size={16} />
                批量导出
              </button>
            </div>
          </div>
          {exportTasks.length > 0 && (
          <div className="divide-y divide-gray-50">
            {exportTasks.map(task => {
              const st = STATUS_LABELS[task.status] || STATUS_LABELS[0];
              const typeInfo = TYPE_LABELS[task.type] || TYPE_LABELS['photo'];
              const TypeIcon = typeInfo.icon;
              const hasFiles = task.status === 3 && task.files && task.files.length > 0;
              const expanded = expandedTasks.has(task.id);
              return (
                <div key={task.id} className="px-5 py-4">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between md:gap-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {(task.status === 0 || task.status === 1 || task.status === 2) && (
                        <span className={`inline-flex items-center gap-1 text-xs ${st.className}`}>
                          <Loader2 size={12} className="animate-spin" /> {st.text}
                        </span>
                      )}
                      {task.status === 3 && <span className="text-xs text-green-600">{st.text}</span>}
                      {task.status === 4 && (
                        <span className="inline-flex items-center gap-1 text-xs text-red-500">
                          <XCircle size={12} /> {st.text}
                        </span>
                      )}
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${typeInfo.className}`}>
                        <TypeIcon size={12} /> {typeInfo.text}
                      </span>
                      <span className="text-sm font-medium text-gray-700">{task.projectName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        {task.operatorName && <span className="hidden md:inline">{task.operatorName}</span>}
                        {task.totalCount != null && <span>{task.totalCount} 个电站</span>}
                        <span>{new Date(task.createTime).toLocaleString()}</span>
                      </div>
                      {hasFiles && (
                        <button
                          onClick={() => setExpandedTasks(prev => {
                            const next = new Set(prev);
                            if (next.has(task.id)) next.delete(task.id);
                            else next.add(task.id);
                            return next;
                          })}
                          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-navy transition-colors"
                        >
                          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          下载文件（{task.files!.length}）
                        </button>
                      )}
                    </div>
                  </div>

                  {task.status === 4 && task.failReason && (
                    <p className="mt-1 text-xs text-red-500">{task.failReason}</p>
                  )}

                  {hasFiles && expanded && (
                    <div className="mt-2 space-y-1.5">
                      {task.files!.map(f => (
                        <div key={f.batchNo} className="flex items-center justify-between py-1.5 px-3 bg-gray-50 rounded-lg">
                          <span className="text-xs text-gray-600">
                            {f.fileName} · {formatBytes(f.fileSize)}
                          </span>
                          <button
                            onClick={() => handleDownload(task.id, f.batchNo)}
                            className="inline-flex items-center gap-1 text-xs text-teal font-medium hover:underline"
                          >
                            <Download size={12} /> 下载
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>

      {/* Danger Zone: Finish Plan */}
      {!planFinished && (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-red-500 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-red-500">手动结束后任务将不再接受新的巡检记录，此操作不可撤销。</p>
            </div>
            <button
              onClick={handleFinish}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 shrink-0"
            >
              结束任务
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlanDetailPage;
