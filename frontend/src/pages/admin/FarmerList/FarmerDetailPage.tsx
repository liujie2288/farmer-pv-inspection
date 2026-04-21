import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User, Settings, ClipboardList, ChevronLeft, FileText } from 'lucide-react';
import { getFarmerDetail, FarmerDetail } from '@/api/farmers';
import { showToast } from '@/components/ui/Toast';
import StatusTag from '@/components/ui/StatusTag';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface InfoRowProps {
  label: string;
  value: React.ReactNode;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-gray-100 last:border-b-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm text-gray-900 font-medium text-right max-w-[60%] truncate">{value}</span>
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

function FarmerDetailPage() {
  const { projectId, farmerId } = useParams<{ projectId: string; farmerId: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<FarmerDetail | null>(null);

  useEffect(() => {
    if (projectId && farmerId) {
      getFarmerDetail(Number(projectId), Number(farmerId))
        .then(res => setDetail(res.data))
        .catch((e: any) => showToast({ icon: 'fail', content: e.message }));
    }
  }, [projectId, farmerId]);

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
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-gray-900">{detail.farmerName}</h1>
          <p className="text-xs text-gray-400 mt-0.5">农户详情</p>
        </div>
      </div>

      {/* Section 1: Basic info */}
      <SectionCard title="基本信息" icon={<User size={16} />}>
        <InfoRow label="农户编号" value={detail.farmerCode} />
        <InfoRow label="农户姓名" value={detail.farmerName} />
        <InfoRow label="所属项目" value={detail.projectName} />
        <InfoRow label="发电户号" value={detail.powerAccount || '-'} />
        <InfoRow label="巡检状态" value={<StatusTag inspected={detail.status === 1} />} />
      </SectionCard>

      {/* Section 2: Equipment info */}
      <SectionCard title="设备信息" icon={<Settings size={16} />}>
        <InfoRow label="逆变器序列号" value={detail.inverterSn || '-'} />
        <InfoRow label="逆变器品牌" value={detail.inverterBrand || '-'} />
        <InfoRow label="组件规格" value={detail.moduleSpec || '-'} />
        <InfoRow label="组件块数" value={detail.moduleCount != null ? `${detail.moduleCount} 块` : '-'} />
        <InfoRow label="装机容量" value={detail.capacityKw != null ? `${detail.capacityKw} kW` : '-'} />
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
                  <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-900">{r.planName}</td>
                    <td className="px-4 py-3 text-gray-700">{r.inspectorName}</td>
                    <td className="px-4 py-3 text-gray-500">{r.createTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}

export default FarmerDetailPage;
