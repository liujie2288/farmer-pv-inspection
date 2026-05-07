import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, X, XCircle } from 'lucide-react';
import {
  submitInspection,
  getInspectionDetail,
  updateInspection,
  type PhotoSectionSubmit,
} from '@/api/inspections';
import { getStationDetail } from '@/api/stations';
import { getActivePlan } from '@/api/plans';
import { getProject, type DeviceItem } from '@/api/projects';
import InspectionChecklist from '@/components/InspectionChecklist';
import ImageUpload from '@/components/ui/ImageUpload';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { showToast } from '@/components/ui/Toast';

const WEATHER_PRESETS = ['晴', '多云', '阴', '小雨', '中雨', '大雨', '雷阵雨', '小雪', '大雪', '雾', '大风'];

const WATERMARK_FIELD_OPTIONS = [
  { value: 'projectName', label: '项目名称' },
  { value: 'ownerName', label: '户主姓名' },
  { value: 'coordinates', label: '经纬度' },
  { value: 'timestamp', label: '拍摄时间' },
];

/** Convert backend VO (boolean result, remark, value) → internal format ('正常'/'异常', exceptionNote, measuredValue) */
function convertVoToChecklist(vo: any[]): { sections: any[] } {
  return {
    sections: (vo || []).map((section: any) => ({
      sectionId: section.sectionId,
      sectionNo: section.sectionNo,
      sectionName: section.sectionName,
      items: (section.items || []).map((item: any) => ({
        itemId: item.itemId,
        itemNo: item.itemNo,
        content: item.content,
        itemType: item.itemType,
        result: item.result === true ? '正常' : item.result === false ? '异常' : '',
        exceptionNote: item.remark || '',
        measuredValue: item.itemType === 2 ? { value: item.value || null } : null,
      })),
    })),
  };
}

function InspectionFormPage() {
  const { projectId, stationId, recordId } = useParams<{ projectId: string; stationId: string; recordId: string }>();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('planId');
  const navigate = useNavigate();
  const isEdit = !!recordId;

  const [checklistData, setChecklistData] = useState<any>({ sections: [] });
  const [weather, setWeather] = useState('');
  const [customWeather, setCustomWeather] = useState('');
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [selectedDeviceIdx, setSelectedDeviceIdx] = useState(0);
  const [stationInfo, setStationInfo] = useState<any>(null);
  const [planName, setPlanName] = useState('');
  const [resolvedPlanId, setResolvedPlanId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photos, setPhotos] = useState<PhotoSectionSubmit[]>([]);
  const [initialPhotos, setInitialPhotos] = useState<PhotoSectionSubmit[] | undefined>(undefined);
  const [thermalImageUrl, setThermalImageUrl] = useState('');
  const [rejectReason, setRejectReason] = useState<string | null>(null);

  const selectedWeather = customWeather || weather;

  const [watermarkFields, setWatermarkFields] = useState<string[]>([]);
  const [watermarkCustomTexts, setWatermarkCustomTexts] = useState<string[]>([]);

  const toggleWatermarkField = (field: string) => {
    setWatermarkFields(prev =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const addCustomText = () => setWatermarkCustomTexts(prev => [...prev, '']);
  const removeCustomText = (idx: number) => setWatermarkCustomTexts(prev => prev.filter((_, i) => i !== idx));
  const updateCustomText = (idx: number, val: string) =>
    setWatermarkCustomTexts(prev => prev.map((t, i) => i === idx ? val : t));

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        if (isEdit && recordId) {
          const recordRes = await getInspectionDetail(Number(recordId));
          const record = recordRes.data;
          setChecklistData(convertVoToChecklist(record.checklistResult));
          if (record.status === 2 && record.rejectReason) {
            setRejectReason(record.rejectReason);
          }
          const savedWeather = record.weather || '';
          if (WEATHER_PRESETS.includes(savedWeather)) {
            setWeather(savedWeather);
            setCustomWeather('');
          } else if (savedWeather) {
            setWeather('');
            setCustomWeather(savedWeather);
          }
          setPlanName(record.planName || '');
          setStationInfo({
            ownerName: record.stationName,
            stationCode: record.stationCode,
            projectName: record.projectName,
          });
          setResolvedPlanId(null);

          if (record.projectId) {
            const projectRes = await getProject(record.projectId);
            const projectDevices = projectRes.data?.devices || [];
            setDevices(projectDevices);
            if (projectDevices.length > 0) {
              const idx = projectDevices.findIndex(d => d.deviceName === record.deviceName && d.deviceModel === record.deviceModel);
              setSelectedDeviceIdx(idx >= 0 ? idx : 0);
            }
          }

          if (record.photos?.length) {
            setInitialPhotos(record.photos);
          }

          if (record.thermalImageUrl) {
            setThermalImageUrl(record.thermalImageUrl);
          }

          if (record.watermarkConfig) {
            setWatermarkFields(record.watermarkConfig.fields || []);
            setWatermarkCustomTexts(record.watermarkConfig.customTexts || []);
          }
        } else {
          const stationRes = await getStationDetail(Number(projectId), Number(stationId));
          setStationInfo(stationRes.data);

          const projectRes = await getProject(Number(projectId));
          const projectDevices = projectRes.data?.devices || [];
          setDevices(projectDevices);
          if (projectDevices.length > 0) setSelectedDeviceIdx(0);

          const activePlanRes = await getActivePlan(Number(projectId));
          if (activePlanRes.data) {
            setPlanName(activePlanRes.data.planName);
            setResolvedPlanId(activePlanRes.data.planId);
          }
        }
      } catch (e: any) {
        showToast({ icon: 'fail', content: e.message || '加载数据失败' });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [projectId, stationId, recordId]);

  const handlePresetClick = (preset: string) => {
    if (weather === preset) {
      setWeather('');
    } else {
      setWeather(preset);
      setCustomWeather('');
    }
  };

  const handleSubmit = async () => {
    let firstEmptyEl: HTMLElement | null = null;
    let allFilled = true;
    for (const section of checklistData.sections || []) {
      for (const item of section.items || []) {
        if (item.itemType === 3) continue;
        const filled = item.itemType === 2
          ? (item.measuredValue?.value ?? '').toString().trim() !== ''
          : item.result === '正常' || item.result === '异常';
        if (!filled) {
          allFilled = false;
          if (!firstEmptyEl) {
            firstEmptyEl = document.getElementById(`checklist-item-${item.itemId}`);
          }
        }
      }
    }
    if (!allFilled) {
      showToast({ icon: 'warning', content: '请完成所有检查项' });
      firstEmptyEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (!selectedWeather) {
      showToast({ icon: 'warning', content: '请选择天气' });
      return;
    }
    if (devices.length > 0 && selectedDeviceIdx < 0) {
      showToast({ icon: 'warning', content: '请选择检测设备' });
      return;
    }
    // Check type=3 photo items have at least one photo
    for (const section of checklistData.sections || []) {
      for (const item of section.items || []) {
        if (item.itemType === 3) {
          const sectionPhotos = photos.find(p => p.sectionId === section.sectionId);
          const itemPhoto = sectionPhotos?.items?.find(i => i.itemId === item.itemId);
          if (!itemPhoto?.urls?.length) {
            showToast({ icon: 'warning', content: `请上传"${item.content}"照片` });
            document.getElementById(`checklist-item-${item.itemId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
          }
        }
      }
    }

    // Check abnormal items have exception note
    for (const section of checklistData.sections || []) {
      for (const item of section.items || []) {
        if (item.itemType !== 3 && item.result === '异常' && !(item.exceptionNote || '').trim()) {
          showToast({ icon: 'warning', content: '请填写异常说明' });
          document.getElementById(`checklist-item-${item.itemId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
    }

    // Check photos uploading
    if (photoUploading) {
      showToast({ icon: 'warning', content: '照片正在上传中，请稍候' });
      return;
    }

    if (!thermalImageUrl) {
      showToast({ icon: 'warning', content: '请上传红外热成像照片' });
      document.getElementById('thermal-image-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    try {
      const checklistResult = (checklistData.sections || []).map(
        (section: any) => ({
          sectionId: section.sectionId,
          items: (section.items || [])
            .filter((item: any) => item.itemType !== 3)
            .map((item: any) => {
              const dto: any = { itemId: item.itemId, result: null };
              if (item.itemType === 2) {
                const val = item.measuredValue?.value;
                const hasValue = val != null && String(val).trim() !== '';
                dto.result = hasValue ? true : null;
                dto.value = hasValue ? String(val).trim() : null;
              } else {
                dto.result = item.result === '正常' ? true : item.result === '异常' ? false : null;
                dto.remark = item.exceptionNote || undefined;
              }
              return dto;
            }),
        }),
      );

      if (isEdit) {
        const selectedDevice = devices[selectedDeviceIdx];
        await updateInspection(Number(recordId), {
          weather: selectedWeather,
          deviceName: selectedDevice?.deviceName,
          deviceModel: selectedDevice?.deviceModel,
          checklistResult,
          photos: photos.length > 0 ? photos : undefined,
          thermalImageUrl,
          watermarkConfig: (watermarkFields.length > 0 || watermarkCustomTexts.some(t => t.trim()))
            ? { fields: watermarkFields.length > 0 ? watermarkFields : undefined, customTexts: watermarkCustomTexts.filter(t => t.trim()).length > 0 ? watermarkCustomTexts.filter(t => t.trim()) : undefined }
            : undefined,
        });
        showToast({ icon: 'success', content: '保存成功' });
      } else {
        const effectivePlanId = planId ? Number(planId) : resolvedPlanId;
        if (!effectivePlanId || !stationId || !projectId) {
          showToast({ icon: 'fail', content: '当前没有可用的巡检任务，无法提交' });
          setSubmitting(false);
          return;
        }
        const selectedDevice = devices[selectedDeviceIdx];
        await submitInspection({
          planId: effectivePlanId,
          stationId: Number(stationId),
          projectId: Number(projectId),
          weather: selectedWeather,
          deviceName: selectedDevice?.deviceName,
          deviceModel: selectedDevice?.deviceModel,
          checklistResult,
          photos: photos.length > 0 ? photos : undefined,
          thermalImageUrl,
          watermarkConfig: (watermarkFields.length > 0 || watermarkCustomTexts.some(t => t.trim()))
            ? { fields: watermarkFields.length > 0 ? watermarkFields : undefined, customTexts: watermarkCustomTexts.filter(t => t.trim()).length > 0 ? watermarkCustomTexts.filter(t => t.trim()) : undefined }
            : undefined,
        });
        showToast({ icon: 'success', content: '提交成功' });
      }
      navigate(-1);
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || (isEdit ? '保存失败' : '提交失败') });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-3.5rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-lg font-bold text-navy">
          {isEdit ? '编辑巡检' : '巡检'} - {stationInfo?.ownerName || ''}
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 py-3 space-y-4">
        {/* Rejected banner */}
        {rejectReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-red-600 font-medium text-sm">
              <XCircle size={16} />
              <span>该记录已被驳回</span>
            </div>
            <p className="mt-1.5 text-sm text-red-500 pl-6">驳回原因：{rejectReason}</p>
          </div>
        )}
        {/* Auto-filled info card */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">基本信息</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-400">项目：</span>
              <span className="text-gray-700">{stationInfo?.projectName || '-'}</span>
            </div>
            <div>
              <span className="text-gray-400">电站：</span>
              <span className="text-gray-700">{stationInfo?.ownerName} ({stationInfo?.stationCode})</span>
            </div>
            <div>
              <span className="text-gray-400">计划：</span>
              <span className="text-gray-700">{planName || '-'}</span>
            </div>
            <div>
              <span className="text-gray-400">编号：</span>
              <span className="text-gray-700">{stationInfo?.stationCode}</span>
            </div>
          </div>
          {stationInfo?.inverterSn && (
            <div className="grid grid-cols-2 gap-2 text-sm mt-2 pt-2 border-t border-gray-50">
              <div>
                <span className="text-gray-400">逆变器序列号：</span>
                <span className="text-gray-700">{stationInfo.inverterSn}</span>
              </div>
              <div>
                <span className="text-gray-400">装机容量：</span>
                <span className="text-gray-700">{stationInfo.capacityKw ? `${stationInfo.capacityKw}kW` : '-'}</span>
              </div>
              <div>
                <span className="text-gray-400">组件数：</span>
                <span className="text-gray-700">{stationInfo.moduleCount || '-'}</span>
              </div>
              <div>
                <span className="text-gray-400">规格：</span>
                <span className="text-gray-700">{stationInfo.moduleSpec || '-'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Weather */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-3">天气 <span className="text-red-500">*</span></h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {WEATHER_PRESETS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => handlePresetClick(w)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  weather === w
                    ? 'bg-teal text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={customWeather}
            onChange={(e) => {
              setCustomWeather(e.target.value);
              setWeather('');
            }}
            placeholder="自定义天气描述..."
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
          />
        </div>

        {/* Device selection */}
        {devices.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-3">检测设备 <span className="text-red-500">*</span></h3>
            <select
              value={selectedDeviceIdx}
              onChange={(e) => setSelectedDeviceIdx(Number(e.target.value))}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal bg-white"
            >
              {devices.map((d, i) => (
                <option key={d.id ?? i} value={i}>
                  {d.deviceName}（{d.deviceModel}）
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Watermark config */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-3">照片水印</h3>
          <div className="flex flex-wrap gap-2">
            {WATERMARK_FIELD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleWatermarkField(opt.value)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  watermarkFields.includes(opt.value)
                    ? 'bg-navy text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {watermarkCustomTexts.map((text, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={text}
                  onChange={(e) => updateCustomText(idx, e.target.value)}
                  placeholder="自定义水印内容"
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal/30 focus:border-teal"
                />
                <button
                  type="button"
                  onClick={() => removeCustomText(idx)}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addCustomText}
              className="flex items-center gap-1.5 text-sm text-teal hover:text-teal-dark transition-colors"
            >
              <Plus size={14} />
              添加自定义内容
            </button>
          </div>
        </div>

        {/* Checklist */}
        <InspectionChecklist
          checklistData={checklistData}
          onChange={setChecklistData}
          readOnly={false}
          projectId={!isEdit && projectId ? Number(projectId) : undefined}
          onPhotosChange={setPhotos}
          onUploadingChange={setPhotoUploading}
          initialPhotos={initialPhotos}
        />

        {/* Thermal image */}
        <div id="thermal-image-card" className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-3">
            红外热成像照片 <span className="text-red-500">*</span>
          </h3>
          <ImageUpload
            value={thermalImageUrl}
            onChange={setThermalImageUrl}
            placeholder="上传红外热成像照片"
            uploadType="photo"
            compact
          />
        </div>
      </div>

      {/* Submit button */}
      <div className="sticky bottom-0 p-4 bg-white border-t border-gray-100">
        {!isEdit && !planId && !resolvedPlanId && (
          <p className="text-center text-sm text-amber-600 mb-2">当前项目没有进行中的巡检任务</p>
        )}
        <button
          onClick={handleSubmit}
          disabled={submitting || (!isEdit && !planId && !resolvedPlanId)}
          className="w-full bg-gradient-to-r from-teal to-teal-dark text-white py-3.5 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? (isEdit ? '保存中...' : '提交中...') : (isEdit ? '保存修改' : '提交巡检')}
        </button>
      </div>
    </div>
  );
}

export default InspectionFormPage;
