import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  MapPin,
  Calendar,
  User,
  FolderOpen,
  CheckCircle2,
  XCircle,
  FileOutput,
  Pencil,
} from 'lucide-react';
import { getInspectionDetail, normalizePhotos } from '@/api/inspections';
import { fetchPdf } from '@/api/export';
import { useAuthStore } from '@/store/authStore';
import { showToast } from '@/components/ui/Toast';
import { openImagePreview } from '@/components/ui/ImagePreview';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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
  const normalizedPhotos = normalizePhotos(detail.photos || {});

  const infoRows = [
    { label: '巡检计划', value: detail.planName, icon: FileText },
    { label: '户主姓名', value: detail.stationName, icon: User },
    { label: '项目名称', value: detail.projectName, icon: FolderOpen },
    { label: '巡检员', value: detail.inspectorName, icon: User },
    { label: '巡检时间', value: detail.createTime, icon: Calendar },
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
      {/* Basic info card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 bg-navy/5 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-navy">基本信息</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {infoRows.map((row) => {
            const Icon = row.icon;
            return (
              <div
                key={row.label}
                className="flex items-center justify-between px-4 py-3"
              >
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

      {/* Checklist sections */}
      {detail.checklistResult?.sections?.map((section: any) => (
        <div
          key={section.sectionId}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="px-4 py-3 bg-navy/5 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-navy">{section.sectionName}</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {section.items?.map((item: any, idx: number) => {
              const isNormal = item.result === '正常';
              return (
                <div key={item.itemId} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-gray-800 flex-1">
                      <span className="text-gray-400 mr-1">{idx + 1}.</span>
                      {item.content}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${
                        isNormal
                          ? 'bg-green-50 text-green-600'
                          : 'bg-red-50 text-red-600'
                      }`}
                    >
                      {isNormal ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <XCircle size={12} />
                      )}
                      {item.result || '未填写'}
                    </span>
                  </div>

                  {item.exceptionNote && (
                    <p className="mt-1.5 text-xs text-red-500 pl-5">
                      异常说明: {item.exceptionNote}
                    </p>
                  )}

                  {item.measuredValue &&
                    Object.keys(item.measuredValue).length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 pl-5">
                        {Object.entries(item.measuredValue).map(([k, v]) => (
                          <span key={k} className="text-xs text-gray-500">
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                </div>
              );
            })}
          </div>

          {/* Section photos */}
          {normalizedPhotos[String(section.sectionId)]?.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-50">
              <p className="text-xs text-gray-400 mb-2">现场照片</p>
              <div className="grid grid-cols-3 gap-2">
                {normalizedPhotos[String(section.sectionId)].map((photo, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div
                      className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer"
                      onClick={() => openImagePreview(photo.url, photo.name)}
                    >
                      <img src={photo.url} alt={photo.name || `照片${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                    {photo.name && (
                      <p className="text-xs text-gray-500 text-center truncate">{photo.name}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
      <div className="pt-2 pb-2 flex flex-col gap-3">
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
