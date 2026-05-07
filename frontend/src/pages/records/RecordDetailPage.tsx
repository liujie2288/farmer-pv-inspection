import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  MapPin,
  Calendar,
  User,
  Building2,
  Contact,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Pencil,
  ImageIcon,
  CloudSun,
  Unlock,
  Wrench,
  Droplets,
  FileOutput,
} from 'lucide-react';
import { getInspectionDetail, extendDeadline, rejectRecord } from '@/api/inspections';
import { useAuthStore } from '@/store/authStore';
import { showToast } from '@/components/ui/Toast';
import { confirm, showDialog } from '@/components/ui/Dialog';
import { openImagePreview } from '@/components/ui/ImagePreview';
import { getImageUrl } from '@/api/storage';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ChecklistItemVo {
  itemId: number;
  itemNo: number;
  content: string;
  itemType: number;
  result: boolean | null;
  remark: string | null;
  value: string | null;
}

interface ChecklistSectionVo {
  sectionId: number;
  sectionName: string;
  sectionNo: number;
  items: ChecklistItemVo[];
}

interface PhotoItemVo {
  itemId: number;
  itemName: string;
  urls: string[];
}

interface PhotoSectionVo {
  sectionId: number;
  sectionName: string;
  items: PhotoItemVo[];
}

function RecordPhoto({ url, alt }: { url: string; alt: string }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const largeUrl = await getImageUrl(url, 'large');
      openImagePreview(largeUrl);
    } catch {
      openImagePreview(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer relative"
      onClick={handleClick}
    >
      <img src={url} alt={alt} className="w-full h-full object-cover" />
      {loading && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <span className="text-white text-xs">加载中...</span>
        </div>
      )}
    </div>
  );
}

function RecordDetailPage() {
  const { recordId } = useParams<{ recordId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (recordId) {
      setLoading(true);
      getInspectionDetail(Number(recordId))
        .then((res) => setDetail(res.data))
        .catch((e) => showToast({ icon: 'fail', content: e.message || '加载失败' }))
        .finally(() => setLoading(false));
    }
  }, [recordId]);

  if (loading || !detail) {
    return <LoadingSpinner size="lg" />;
  }

  const editPath = isAdmin ? `/admin/records/${recordId}/edit` : `/records/${recordId}/edit`;

  // Build photo lookup: sectionId → items
  const photoMap = new Map<number, PhotoItemVo[]>();
  (detail.photos as PhotoSectionVo[] || []).forEach(ps => {
    if (ps.items?.length) {
      photoMap.set(ps.sectionId, ps.items);
    }
  });

  const checklistResult = (detail.checklistResult as ChecklistSectionVo[]) || [];

  const basicRows = [
    { label: '巡检任务', value: detail.planName, icon: FileText },
    { label: '项目名称', value: detail.projectName, icon: Building2 },
    { label: '电站编号', value: detail.stationCode, icon: FileText },
    { label: '户主姓名', value: detail.stationName, icon: Contact },
  ];

  const WATERMARK_LABELS: Record<string, string> = {
    projectName: '项目名称',
    ownerName: '户主姓名',
    coordinates: '经纬度',
    timestamp: '拍摄时间',
  };

  const wm = detail.watermarkConfig;

  const inspectRows = [
    { label: '巡检时间', value: detail.createTime, icon: Calendar },
    { label: '巡检人', value: detail.inspectorName, icon: User },
    { label: '天气', value: detail.weather, icon: CloudSun },
    { label: '检测设备', value: detail.deviceName ? `${detail.deviceName}（${detail.deviceModel}）` : '-', icon: Wrench },
    {
      label: 'GPS坐标',
      value: detail.longitude && detail.latitude
        ? `${detail.longitude}, ${detail.latitude}`
        : '-',
      icon: MapPin,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Rejected banner */}
      {detail.status === 2 && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2 text-red-600 font-medium text-sm">
            <XCircle size={16} />
            <span>该记录已被驳回</span>
          </div>
          {detail.rejectReason && (
            <p className="mt-1.5 text-sm text-red-500 pl-6">驳回原因：{detail.rejectReason}</p>
          )}
        </div>
      )}

      {/* Basic info card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 bg-navy/5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-navy">基本信息</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {basicRows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5 text-sm text-gray-500">
                  <Icon size={16} className="text-gray-400" />
                  <span>{row.label}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 text-right max-w-[60%] truncate">
                  {row.value}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inspection info card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 bg-navy/5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-navy">巡检信息</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {inspectRows.map((row) => {
            const Icon = row.icon;
            return (
              <div key={row.label} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5 text-sm text-gray-500">
                  <Icon size={16} className="text-gray-400" />
                  <span>{row.label}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 text-right max-w-[60%] truncate">
                  {row.value}
                </span>
              </div>
            );
          })}
          {wm && (wm.fields?.length > 0 || wm.customTexts?.length > 0) && (
            <div className="px-4 py-3">
              <div className="flex items-start gap-2.5">
                <div className="flex items-center gap-2.5 text-sm text-gray-500 shrink-0 pt-0.5">
                  <Droplets size={16} className="text-gray-400" />
                  <span>照片水印</span>
                </div>
                <div className="flex-1 flex flex-wrap gap-1.5 justify-end">
                  {(wm.fields || []).map((f: string) => (
                    <span key={f} className="inline-block px-2 py-0.5 bg-navy/10 text-navy text-xs font-medium rounded">
                      {WATERMARK_LABELS[f] || f}
                    </span>
                  ))}
                  {(wm.customTexts || []).map((t: string, i: number) => (
                    <span key={`c${i}`} className="inline-block px-2 py-0.5 bg-teal/10 text-teal text-xs font-medium rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
          {(!wm || (wm.fields?.length === 0 && wm.customTexts?.length === 0)) && (
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5 text-sm text-gray-500">
                <Droplets size={16} className="text-gray-400" />
                <span>照片水印</span>
              </div>
              <span className="text-sm font-medium text-gray-900 text-right max-w-[60%] truncate">-</span>
            </div>
          )}
        </div>
      </div>

      {/* Inspection content */}
      {checklistResult.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 bg-navy/5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-navy">巡检内容</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {checklistResult.map((section) => {
              const sectionPhotos = photoMap.get(section.sectionId);
              return (
                <div key={section.sectionId} className="px-4 py-3">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">
                    {section.sectionNo}. {section.sectionName}
                  </h3>

                  {/* Checklist items */}
                  {section.items?.map((item) => (
                    <div key={item.itemId} className="py-1.5">
                      <span className="text-sm text-gray-700">
                        {item.itemNo}.
                        {item.itemType !== 2 && (
                          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full align-middle ${
                            item.result === true ? 'bg-green-50 text-green-600' : item.result === false ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-400'
                          }`}>
                            {item.result === true ? <><CheckCircle2 size={12} /> 正常</> : item.result === false ? <><XCircle size={12} /> 异常</> : <><MinusCircle size={12} /> 未检查</>}
                          </span>
                        )} {item.content}
                      </span>
                      {item.itemType === 2 && item.value && (
                        <div className="mt-1 pl-5">
                          <div className="max-w-[500px] px-3 py-2 border rounded-lg text-sm text-gray-700 bg-gray-50">{item.value}</div>
                        </div>
                      )}
                      {item.remark && (
                        <p className="mt-0.5 text-xs text-red-500 pl-5">异常说明: {item.remark}</p>
                      )}
                    </div>
                  ))}

                  {/* Section photos grouped by item */}
                  {sectionPhotos && sectionPhotos.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-50">
                      <div className="flex items-center gap-1 mb-2">
                        <ImageIcon size={14} className="text-gray-400" />
                        <span className="text-xs text-gray-400">现场照片</span>
                      </div>
                      <div className="space-y-3">
                        {sectionPhotos.map((pi) => (
                          <div key={pi.itemId}>
                            {pi.itemName && (
                              <p className="text-sm text-gray-700 mb-1.5">{pi.itemName}</p>
                            )}
                            <div className="grid grid-cols-3 lg:grid-cols-8 gap-2">
                              {pi.urls?.map((url, idx) => (
                                <RecordPhoto key={idx} url={url} alt={`照片${idx + 1}`} />
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Thermal image */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 bg-navy/5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-navy">红外热成像照片</h2>
        </div>
        <div className="px-4 py-3">
          {detail.thermalImageUrl ? (
            <div className="grid grid-cols-3 lg:grid-cols-8 gap-2">
              <RecordPhoto url={detail.thermalImageUrl} alt="红外热成像照片" />
            </div>
          ) : (
            <span className="text-sm text-gray-400">未上传</span>
          )}
        </div>
      </div>

      <div className="pt-2 pb-2 flex flex-col gap-3">
        {isAdmin && detail.planStatus === 1 && detail.editDeadline && new Date(detail.editDeadline) > new Date() && (
          <div className="flex items-center justify-center gap-1.5 py-2.5 text-sm text-green-600">
            <CheckCircle2 size={14} />
            <span>已开放编辑权限至 {detail.editDeadline.replace('T', ' ')}</span>
          </div>
        )}
        {isAdmin && detail.planStatus === 1 && detail.status === 1 && (
          <button
            onClick={async () => {
              let reasonValue = '';
              const closeRef: { current?: () => void } = {};
              const ok = await new Promise<boolean>((resolve) => {
                const close = (result: boolean) => {
                  closeRef.current?.();
                  resolve(result);
                };
                showDialog({
                  title: '驳回巡检记录',
                  content: (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500">驳回后该电站将恢复为未巡检状态，巡检员可重新提交。</p>
                      <textarea
                        id="reject-reason-input"
                        rows={3}
                        placeholder="请输入驳回原因"
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 resize-none"
                        onChange={(e) => { reasonValue = e.target.value; }}
                      />
                    </div>
                  ),
                  actions: [
                    { label: '取消', onClick: () => close(false) },
                    { label: '确认驳回', danger: true, onClick: () => {
                      if (!reasonValue.trim()) {
                        showToast({ icon: 'warning', content: '请输入驳回原因' });
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
                await rejectRecord(Number(recordId), reasonValue.trim());
                showToast({ icon: 'success', content: '已驳回' });
                const res = await getInspectionDetail(Number(recordId));
                setDetail(res.data);
              } catch (e: any) {
                showToast({ icon: 'fail', content: e.message || '操作失败' });
              }
            }}
            className="w-full flex items-center justify-center gap-2 bg-red-500 text-white rounded-xl py-3.5 text-sm font-medium shadow-sm hover:bg-red-600 active:bg-red-700 transition-colors"
          >
            <XCircle size={18} />
            驳回巡检记录
          </button>
        )}
        {isAdmin && detail.planStatus === 1 && (!detail.editDeadline || new Date(detail.editDeadline) <= new Date()) && (
          <button
            onClick={async () => {
              const ok = await confirm({ title: '开放编辑', content: '确认开放编辑？编辑期限将延长至2天后。' });
              if (!ok) return;
              try {
                await extendDeadline(Number(recordId));
                showToast({ icon: 'success', content: '已开放编辑' });
                const res = await getInspectionDetail(Number(recordId));
                setDetail(res.data);
              } catch (e: any) {
                showToast({ icon: 'fail', content: e.message || '操作失败' });
              }
            }}
            className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white rounded-xl py-3.5 text-sm font-medium shadow-sm hover:bg-amber-600 active:bg-amber-700 transition-colors"
          >
            <Unlock size={18} />
            开放编辑权限
          </button>
        )}
        {detail.canEdit && (
          <button
            onClick={() => navigate(editPath)}
            className="w-full flex items-center justify-center gap-2 bg-teal text-white rounded-xl py-3.5 text-sm font-medium shadow-sm hover:bg-teal-dark active:bg-teal-dark transition-colors"
          >
            <Pencil size={18} />
            编辑巡检记录
          </button>
        )}
        {detail.status === 1 && (
          detail.pdfUrl ? (
            <button
              onClick={() => window.open(detail.pdfUrl, '_blank')}
              className="w-full flex items-center justify-center gap-2 bg-navy text-white rounded-xl py-3.5 text-sm font-medium shadow-sm hover:bg-navy/90 active:bg-navy/80 transition-colors"
            >
              <FileOutput size={18} />
              查看巡检报告
            </button>
          ) : (
            <button
              disabled
              className="w-full flex items-center justify-center gap-2 bg-gray-300 text-gray-500 rounded-xl py-3.5 text-sm font-medium cursor-not-allowed"
            >
              <FileOutput size={18} />
              报告生成中…
            </button>
          )
        )}
      </div>
    </div>
  );
}

export default RecordDetailPage;
