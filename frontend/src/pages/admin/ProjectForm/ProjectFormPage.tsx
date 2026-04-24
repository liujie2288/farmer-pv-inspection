import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import {
  getProject,
  createProject,
  updateProject,
  type Project,
  type DeviceItem,
} from '@/api/projects';
import { showToast } from '@/components/ui/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const PROVINCES = [
  '北京', '天津', '河北', '山西', '内蒙古',
  '辽宁', '吉林', '黑龙江', '上海', '江苏',
  '浙江', '安徽', '福建', '江西', '山东',
  '河南', '湖北', '湖南', '广东', '广西',
  '海南', '重庆', '四川', '贵州', '云南',
  '西藏', '陕西', '甘肃', '青海', '宁夏',
  '新疆', '台湾', '香港', '澳门',
];

interface FormState {
  projectName: string;
  propertyCompany: string;
  stationType: string;
  province: string;
  city: string;
  droneCertificateUrl: string;
  specialOperationCertUrl: string;
  devices: DeviceItem[];
}

const emptyForm: FormState = {
  projectName: '',
  propertyCompany: '',
  stationType: '',
  province: '',
  city: '',
  droneCertificateUrl: '',
  specialOperationCertUrl: '',
  devices: [],
};

function DeviceListEditor({ devices, onChange }: { devices: DeviceItem[]; onChange: (devices: DeviceItem[]) => void }) {
  const update = (list: DeviceItem[]) => onChange(list);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">检测设备</span>
        <button
          type="button"
          className="text-sm text-teal hover:text-teal-dark"
          onClick={() => update([...devices, { deviceName: '', deviceModel: '' }])}
        >
          + 添加设备
        </button>
      </div>
      {devices.length === 0 && (
        <p className="text-xs text-gray-400 py-2">暂无设备，点击上方按钮添加</p>
      )}
      {devices.map((d, i) => (
        <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={d.deviceName}
              placeholder="设备名称"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              onChange={e => {
                const list = [...devices];
                list[i] = { ...list[i], deviceName: e.target.value };
                update(list);
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={d.deviceModel}
              placeholder="设备型号"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
              onChange={e => {
                const list = [...devices];
                list[i] = { ...list[i], deviceModel: e.target.value };
                update(list);
              }}
            />
          </div>
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-red-500 shrink-0"
            onClick={() => update(devices.filter((_, j) => j !== i))}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

function ProjectFormPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const isEdit = !!projectId;

  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    getProject(Number(projectId))
      .then(res => {
        const p = res.data as Project;
        setForm({
          projectName: p.projectName,
          propertyCompany: p.propertyCompany,
          stationType: p.stationType,
          province: p.province || '',
          city: p.city || '',
          droneCertificateUrl: p.droneCertificateUrl || '',
          specialOperationCertUrl: p.specialOperationCertUrl || '',
          devices: (p.devices || []).map(d => ({ ...d })),
        });
      })
      .catch(() => {
        showToast({ icon: 'fail', content: '加载项目信息失败' });
        navigate('/admin/projects', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.projectName || !form.propertyCompany || !form.stationType) {
      showToast({ icon: 'warning', content: '请填写必填信息' });
      return;
    }
    setSaving(true);
    try {
      if (isEdit) {
        await updateProject(Number(projectId), form);
        showToast({ icon: 'success', content: '修改成功' });
      } else {
        await createProject(form);
        showToast({ icon: 'success', content: '创建成功' });
      }
      navigate('/admin/projects');
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '保存失败' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const inputClass = 'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal';

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/projects')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-navy">{isEdit ? '编辑项目' : '新增项目'}</h1>
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-sm font-semibold text-navy">基本信息</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700">
              项目名称 <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              value={form.projectName}
              placeholder="请输入项目名称"
              className={inputClass}
              onChange={e => updateField('projectName', e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700">
              产权公司 <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              value={form.propertyCompany}
              placeholder="请输入产权公司"
              className={inputClass}
              onChange={e => updateField('propertyCompany', e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700">
              电站类型 <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              value={form.stationType}
              placeholder="请输入电站类型"
              className={inputClass}
              onChange={e => updateField('stationType', e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700">省份</span>
            <select
              value={form.province}
              className={inputClass}
              onChange={e => updateField('province', e.target.value)}
            >
              <option value="">请选择省份</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700">城市</span>
            <input
              type="text"
              value={form.city}
              placeholder="请输入城市"
              className={inputClass}
              onChange={e => updateField('city', e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* Certificates */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-sm font-semibold text-navy">资质证书</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700">民用无人机驾驶合格证</span>
            <input
              type="text"
              value={form.droneCertificateUrl}
              placeholder="图片URL地址"
              className={inputClass}
              onChange={e => updateField('droneCertificateUrl', e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-gray-700">特种作业操作证</span>
            <input
              type="text"
              value={form.specialOperationCertUrl}
              placeholder="图片URL地址"
              className={inputClass}
              onChange={e => updateField('specialOperationCertUrl', e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* Devices */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-sm font-semibold text-navy">检测设备</h2>
        </div>
        <DeviceListEditor
          devices={form.devices}
          onChange={list => setForm(prev => ({ ...prev, devices: list }))}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pb-4">
        <button
          onClick={() => navigate('/admin/projects')}
          className="px-6 py-2.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          取消
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 rounded-lg text-sm font-medium bg-teal text-white hover:bg-teal-dark transition-colors disabled:opacity-50"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>
    </div>
  );
}

export default ProjectFormPage;
