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
  FileOutput,
  Pencil,
  ImageIcon,
  CloudSun,
  Unlock,
  Wrench,
  Eye,
} from 'lucide-react';
import { getInspectionDetail, extendDeadline } from '@/api/inspections';
import { fetchPdf } from '@/api/export';
import { useAuthStore } from '@/store/authStore';
import { showToast } from '@/components/ui/Toast';
import { confirm } from '@/components/ui/Dialog';
import { openImagePreview } from '@/components/ui/ImagePreview';
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

  const infoRows = [
    { label: '巡检任务', value: detail.planName, icon: FileText },
    { label: '项目名称', value: detail.projectName, icon: Building2 },
    { label: '电站编号', value: detail.stationCode, icon: FileText },
    { label: '户主姓名', value: detail.stationName, icon: Contact },
    { label: '巡检时间', value: detail.createTime, icon: Calendar },
    { label: '巡检人', value: detail.inspectorName, icon: User },
    { label: '天气', value: detail.weather, icon: CloudSun },
    { label: '检测设备', value: detail.deviceName ? `${detail.deviceName}（${detail.deviceModel}）` : '-', icon: Wrench },
    {
      label: 'GPS坐标',
      value: detail.longitude && detail.latitude
        ? `${detail.longitude}, ${detail.latitude}`
        : '未记录',
      icon: MapPin,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Preview report button */}
      <button
        onClick={() => window.open(`/api/reports/records/${recordId}`, '_blank')}
        className="w-full flex items-center justify-center gap-2 bg-white text-navy border border-navy/20 rounded-xl py-3 text-sm font-medium shadow-sm hover:bg-navy/5 active:bg-navy/10 transition-colors"
      >
        <Eye size={18} />
        预览PDF报告
      </button>
      {/* Basic info card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 bg-navy/5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-navy">基本信息</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {infoRows.map((row) => {
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
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-sm text-gray-700">
                          {item.itemNo}. {item.content}
                        </span>
                        {item.itemType !== 2 && (
                          <span className={`inline-flex items-center gap-1 shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                            item.result ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {item.result ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                            {item.result ? '正常' : '异常'}
                          </span>
                        )}
                      </div>
                      {item.value && (
                        <p className="mt-0.5 text-xs text-gray-500 pl-5">实测值: {item.value}</p>
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
                                <div
                                  key={idx}
                                  className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                                  onClick={() => openImagePreview(url)}
                                >
                                  <img src={url} alt={`照片${idx + 1}`} className="w-full h-full object-cover" />
                                </div>
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

      <div className="pt-2 pb-2 flex flex-col gap-3">
        {isAdmin && detail.planStatus === 1 && detail.editDeadline && new Date(detail.editDeadline) > new Date() && (
          <div className="flex items-center justify-center gap-1.5 py-2.5 text-sm text-green-600">
            <CheckCircle2 size={14} />
            <span>已开放编辑权限至 {detail.editDeadline.replace('T', ' ')}</span>
          </div>
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
        <button
          onClick={async () => {
            try {
              const blob = await fetchPdf(Number(recordId));
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
            } catch (e: any) {
              showToast({ icon: 'fail', content: e.message || 'PDF加载失败' });
            }
          }}
          className="w-full flex items-center justify-center gap-2 bg-navy text-white rounded-xl py-3.5 text-sm font-medium shadow-sm hover:bg-navy/90 active:bg-navy/80 transition-colors"
        >
          <FileOutput size={18} />
          查看PDF报告
        </button>
      </div>
    </div>
  );
}

export default RecordDetailPage;
