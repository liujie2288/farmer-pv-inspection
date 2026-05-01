import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, Edit3, Building2,
  ShieldCheck, Wrench, ClipboardList, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  getProject, type Project,
} from '@/api/projects';
import { getProjectSections, type Section } from '@/api/sections';
import { getPresignedUrl } from '@/api/storage';
import { showToast } from '@/components/ui/Toast';
import { openImagePreview } from '@/components/ui/ImagePreview';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// --- Shared sub-components (same pattern as StationDetailPage) ---

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

// --- Certificate image display ---

function CertificateImage({ objectKey, label }: { objectKey: string; label: string }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!objectKey) return;
    let cancelled = false;
    getPresignedUrl(objectKey).then(u => { if (!cancelled) setUrl(u); }).catch(() => {});
    return () => { cancelled = true; };
  }, [objectKey]);

  if (!url) return <span className="text-sm text-gray-400">-</span>;

  return (
    <img
      src={url}
      alt={label}
      className="h-[100px] rounded-lg border border-gray-200 object-contain cursor-pointer hover:opacity-80 transition-opacity"
      onClick={() => openImagePreview(url, label)}
    />
  );
}

// --- Main component ---

function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const pid = Number(projectId);

  const [project, setProject] = useState<Project | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pid) return;
    setLoading(true);
    Promise.all([
      getProject(pid).then(r => r.data),
      getProjectSections(pid).then(r => r.data).catch(() => []),
    ]).then(([p, sec]) => {
      setProject(p);
      setSections(sec);
    }).catch((e: any) => {
      showToast({ icon: 'fail', content: e.message || '加载项目详情失败' });
    }).finally(() => setLoading(false));
  }, [pid]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!project) return null;

  const stationTypeMap: Record<string, string> = {
    ROOF: '屋顶', GROUND: '地面', OTHER: '其他',
  };

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
            <h1 className="text-lg font-bold text-gray-900">{project.projectName}</h1>
            <p className="text-xs text-gray-400 mt-0.5">项目详情</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/admin/projects/${pid}/edit`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal border border-teal/30 rounded-lg hover:bg-teal/10 transition-colors"
          >
            <Edit3 size={14} />
            编辑
          </button>
        </div>
      </div>

      {/* Basic info */}
      <SectionCard title="基本信息" icon={<Building2 size={16} />}>
        <InfoRow label="项目名称" value={project.projectName} />
        <InfoRow label="产权单位" value={project.propertyCompany} />
        <InfoRow label="电站类型" value={stationTypeMap[project.stationType] || project.stationType} />
        <InfoRow
          label="所在地区"
          value={[project.province, project.city].filter(Boolean).join(' · ') || '-'}
        />
        <InfoRow label="创建时间" value={project.createTime?.substring(0, 10) || '-'} />
      </SectionCard>

      {/* Certificates */}
      <SectionCard title="作业资质" icon={<ShieldCheck size={16} />}>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-700 mb-2">民用无人机驾驶合格证</p>
            {project.droneCertificateUrl ? (
              <CertificateImage objectKey={project.droneCertificateUrl} label="民用无人机驾驶合格证" />
            ) : (
              <span className="text-sm text-gray-400">未上传</span>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-700 mb-2">特种作业操作证</p>
            {project.specialOperationCertUrl ? (
              <CertificateImage objectKey={project.specialOperationCertUrl} label="特种作业操作证" />
            ) : (
              <span className="text-sm text-gray-400">未上传</span>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Devices */}
      <SectionCard title="检测设备" icon={<Wrench size={16} />}>
        {project.devices && project.devices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500">
                  <th className="text-left font-medium px-4 py-2.5">设备名称</th>
                  <th className="text-left font-medium px-4 py-2.5">设备型号</th>
                </tr>
              </thead>
              <tbody>
                {project.devices.map((d, i) => (
                  <tr key={d.id ?? i} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-900">{d.deviceName}</td>
                    <td className="px-4 py-3 text-gray-700">{d.deviceModel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Wrench size={40} className="mb-3 text-gray-300" />
            <p className="text-sm">暂无设备信息</p>
          </div>
        )}
      </SectionCard>

      {/* Inspection sections */}
      {sections.length > 0 && (
        <SectionCard title="巡检内容" icon={<ClipboardList size={16} />}>
          <div className="divide-y divide-gray-100">
            {sections.map(sec => (
              <div key={sec.id} className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900">
                  {sec.sectionNo}. {sec.sectionName}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{sec.items.length} 个检查项</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

export default ProjectDetailPage;
