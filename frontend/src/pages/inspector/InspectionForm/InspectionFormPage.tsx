import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  submitInspection,
  getInspectionDetail,
  updateInspection,
  toSubmitFormat,
} from '@/api/inspections';
import { getStationDetail } from '@/api/stations';
import { getActivePlan } from '@/api/plans';
import InspectionChecklist from '@/components/InspectionChecklist';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { showToast } from '@/components/ui/Toast';

const WEATHER_PRESETS = ['晴', '多云', '阴', '小雨', '中雨', '大雨', '雷阵雨', '小雪', '大雪', '雾', '大风'];

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
  const [stationInfo, setStationInfo] = useState<any>(null);
  const [planName, setPlanName] = useState('');
  const [resolvedPlanId, setResolvedPlanId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedWeather = customWeather || weather;

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        if (isEdit && recordId) {
          const recordRes = await getInspectionDetail(Number(recordId));
          const record = recordRes.data;
          setChecklistData(convertVoToChecklist(record.checklistResult));
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
        } else {
          const stationRes = await getStationDetail(Number(projectId), Number(stationId));
          setStationInfo(stationRes.data);

          const activePlanRes = await getActivePlan(Number(projectId));
          if (activePlanRes.data) {
            setPlanName(activePlanRes.data.planName);
            setResolvedPlanId(activePlanRes.data.id);
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

    setSubmitting(true);
    try {
      const { checklistResult } = toSubmitFormat(checklistData, {});

      if (isEdit) {
        await updateInspection(Number(recordId), {
          weather: selectedWeather,
          checklistResult,
        });
        showToast({ icon: 'success', content: '保存成功' });
      } else {
        const effectivePlanId = planId ? Number(planId) : resolvedPlanId;
        if (!effectivePlanId || !stationId || !projectId) {
          showToast({ icon: 'fail', content: '当前没有可用的巡检计划，无法提交' });
          setSubmitting(false);
          return;
        }
        await submitInspection({
          planId: effectivePlanId,
          stationId: Number(stationId),
          projectId: Number(projectId),
          weather: selectedWeather,
          checklistResult,
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
        {/* Auto-filled info card */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500 mb-2">巡检信息</h3>
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
                <span className="text-gray-400">电站：</span>
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
          <h3 className="text-sm font-medium text-gray-500 mb-3">天气情况</h3>
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

        {/* Checklist */}
        <InspectionChecklist
          checklistData={checklistData}
          onChange={setChecklistData}
          readOnly={false}
        />
      </div>

      {/* Submit button */}
      <div className="sticky bottom-0 p-4 bg-white border-t border-gray-100">
        {!isEdit && !planId && !resolvedPlanId && (
          <p className="text-center text-sm text-amber-600 mb-2">当前项目没有进行中的巡检计划</p>
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
