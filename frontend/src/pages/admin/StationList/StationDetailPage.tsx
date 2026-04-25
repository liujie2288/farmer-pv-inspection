import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Settings, ClipboardList, ChevronLeft, FileText, Edit3, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import {
  getStationDetail, updateStation, deleteStation, StationDetail
} from '@/api/stations';
import { showToast } from '@/components/ui/Toast';
import { confirm } from '@/components/ui/Dialog';
import StatusTag from '@/components/ui/StatusTag';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
  expandable?: boolean;
}

function InfoRow({ label, value, expandable }: InfoRowProps) {
  const [expanded, setExpanded] = useState(false);

  if (!expandable) {
    return (
      <div className="flex items-center justify-between py-3 px-4 border-b border-gray-100 last:border-b-0">
        <span className="text-sm text-gray-500">{label}</span>
        <span className="text-sm text-gray-900 font-medium text-right max-w-[60%] truncate">{value}</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between py-3 px-4 border-b border-gray-100 last:border-b-0 cursor-pointer hover:bg-gray-50/50 transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 max-w-[70%]">
        <span className={`text-sm text-gray-900 font-medium text-right ${expanded ? '' : 'line-clamp-2'}`}>
          {value}
        </span>
        {expanded ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
      </div>
    </div>
  );
}

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function SectionCard({ title, icon, children }: SectionCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-[#0B3D91]/5 to-transparent">
        <span className="text-[#0B3D91]">{icon}</span>
        <h3 className="text-sm font-semibold text-[#0B3D91]">{title}</h3>
      </div>
      <div>{children}</div>
    </div>
  );
}

interface StationFormState {
  stationCode: string;
  ownerName: string;
  address: string;
  powerAccount: string;
  inverterSn: string;
  inverterBrand: string;
  moduleSpec: string;
  moduleCount: string;
  capacityKw: string;
  longitude: string;
  latitude: string;
}

const formFields: { key: keyof StationFormState; label: string; placeholder: string; required?: boolean; type?: string; integer?: boolean }[] = [
  { key: 'stationCode', label: '电站编号', placeholder: '必填', required: true },
  { key: 'ownerName', label: '户主姓名', placeholder: '必填', required: true },
  { key: 'address', label: '装机地址', placeholder: '选填' },
  { key: 'powerAccount', label: '发电户号', placeholder: '选填' },
  { key: 'inverterSn', label: '逆变器序列号', placeholder: '选填' },
  { key: 'inverterBrand', label: '逆变器品牌型号', placeholder: '选填' },
  { key: 'capacityKw', label: '装机容量(kW)', placeholder: '选填', type: 'number' },
  { key: 'moduleCount', label: '组件块数', placeholder: '选填', type: 'number', integer: true },
  { key: 'moduleSpec', label: '组件规格型号', placeholder: '选填' },
  { key: 'longitude', label: '经度坐标', placeholder: '选填', type: 'number' },
  { key: 'latitude', label: '纬度坐标', placeholder: '选填', type: 'number' },
];

function StationDetailPage({ readOnly }: { readOnly?: boolean } = {}) {
  const { projectId, stationId } = useParams<{ projectId: string; stationId: string }>();
  const navigate = useNavigate();
  const pid = Number(projectId);
  const [detail, setDetail] = useState<StationDetail | null>(null);

  // Edit dialog state
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<StationFormState>({
    stationCode: '', ownerName: '', address: '', powerAccount: '',
    inverterSn: '', inverterBrand: '', moduleSpec: '', moduleCount: '',
    capacityKw: '', longitude: '', latitude: '',
  });

  useEffect(() => {
    if (projectId && stationId) {
      getStationDetail(pid, Number(stationId))
        .then(res => setDetail(res.data))
        .catch((e: any) => showToast({ icon: 'fail', content: e.message }));
    }
  }, [projectId, stationId]);

  const handleOpenEdit = () => {
    if (!detail) return;
    setEditForm({
      stationCode: detail.stationCode || '',
      ownerName: detail.ownerName || '',
      address: detail.address || '',
      powerAccount: detail.powerAccount || '',
      inverterSn: detail.inverterSn || '',
      inverterBrand: detail.inverterBrand || '',
      moduleSpec: detail.moduleSpec || '',
      moduleCount: detail.moduleCount != null ? String(detail.moduleCount) : '',
      capacityKw: detail.capacityKw != null ? String(detail.capacityKw) : '',
      longitude: detail.longitude != null ? String(detail.longitude) : '',
      latitude: detail.latitude != null ? String(detail.latitude) : '',
    });
    setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!editForm.stationCode.trim() || !editForm.ownerName.trim()) {
      showToast({ icon: 'fail', content: '请填写电站编号和户主姓名' });
      return;
    }
    try {
      await updateStation(pid, Number(stationId), {
        stationCode: editForm.stationCode,
        ownerName: editForm.ownerName,
        address: editForm.address || null,
        powerAccount: editForm.powerAccount || null,
        inverterSn: editForm.inverterSn || null,
        inverterBrand: editForm.inverterBrand || null,
        moduleSpec: editForm.moduleSpec || null,
        moduleCount: editForm.moduleCount ? Number(editForm.moduleCount) : null,
        capacityKw: editForm.capacityKw ? Number(editForm.capacityKw) : null,
        longitude: editForm.longitude ? Number(editForm.longitude) : null,
        latitude: editForm.latitude ? Number(editForm.latitude) : null,
      });
      showToast({ icon: 'success', content: '修改成功' });
      setShowEdit(false);
      // Refresh detail
      const res = await getStationDetail(pid, Number(stationId));
      setDetail(res.data);
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '修改失败' });
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({ content: `确定删除电站"${detail?.ownerName}"吗？`, title: '删除确认' });
    if (!ok) return;
    try {
      await deleteStation(pid, Number(stationId));
      showToast({ icon: 'success', content: '删除成功' });
      navigate(-1);
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '删除失败' });
    }
  };

  if (!detail) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{detail.ownerName}</h1>
            <p className="text-xs text-gray-400 mt-0.5">电站详情</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!readOnly && (
            <>
              <button
                onClick={handleOpenEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal border border-teal/30 rounded-lg hover:bg-teal/10 transition-colors"
              >
                <Edit3 size={14} />
                编辑
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
                删除
              </button>
            </>
          )}
        </div>
      </div>

      {/* Section 1: Basic info */}
      <SectionCard title="基本信息" icon={<User size={16} />}>
        <InfoRow label="电站编号" value={detail.stationCode} />
        <InfoRow label="户主姓名" value={detail.ownerName} />
        <InfoRow label="装机地址" value={detail.address || '-'} expandable />
        <InfoRow label="所属项目" value={detail.projectName} />
        <InfoRow label="发电户号" value={detail.powerAccount || '-'} />
        <InfoRow label="巡检状态" value={<StatusTag inspected={detail.status === 1} />} />
      </SectionCard>

      {/* Section 2: Equipment info */}
      <SectionCard title="设备信息" icon={<Settings size={16} />}>
        <InfoRow label="逆变器序列号" value={detail.inverterSn || '-'} />
        <InfoRow label="逆变器品牌型号" value={detail.inverterBrand || '-'} />
        <InfoRow label="装机容量" value={detail.capacityKw != null ? `${detail.capacityKw} kW` : '-'} />
        <InfoRow label="组件块数" value={detail.moduleCount != null ? `${detail.moduleCount} 块` : '-'} />
        <InfoRow label="组件规格型号" value={detail.moduleSpec || '-'} />
        <InfoRow label="经度坐标" value={detail.longitude != null ? `${detail.longitude}° E` : '-'} />
        <InfoRow label="纬度坐标" value={detail.latitude != null ? `${detail.latitude}° N` : '-'} />
      </SectionCard>

      {/* Section 3: Inspection records */}
      <SectionCard title="巡检记录" icon={<ClipboardList size={16} />}>
        {detail.records.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <FileText size={40} className="mb-3 text-gray-300" />
            <p className="text-sm">暂无巡检记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500">
                  <th className="text-left font-medium px-4 py-2.5">巡检计划</th>
                  <th className="text-left font-medium px-4 py-2.5">巡检人员</th>
                  <th className="text-left font-medium px-4 py-2.5">巡检时间</th>
                </tr>
              </thead>
              <tbody>
                {detail.records.map(r => (
                  <tr
                    key={r.recordId}
                    onClick={() => navigate(`/records/${r.recordId}`)}
                    className="border-t border-gray-100 hover:bg-teal/5 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-900">{r.planName}</td>
                    <td className="px-4 py-3 text-gray-700">{r.inspectorName}</td>
                    <td className="px-4 py-3 text-gray-500">{r.inspectorTime?.replace('T', ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Edit Dialog */}
      {showEdit && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowEdit(false)} />
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl relative animate-fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-navy">编辑电站</h3>
              <button onClick={() => setShowEdit(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              <div className="space-y-3">
                {formFields.map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    <input
                      type={field.type || 'text'}
                      value={editForm[field.key]}
                      onChange={e => setEditForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none text-sm transition"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowEdit(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-teal text-white text-sm font-medium rounded-lg hover:bg-teal-dark transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StationDetailPage;
