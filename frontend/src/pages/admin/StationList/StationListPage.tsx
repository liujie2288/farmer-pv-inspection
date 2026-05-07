import { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search, Plus, Upload, Trash2, ChevronRight,
  Users, FileSpreadsheet, X
} from 'lucide-react';
import {
  listStations, createStation,
  batchDeleteStations, importStations, Station
} from '@/api/stations';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useDebounce } from '@/hooks/useDebounce';
import { showToast } from '@/components/ui/Toast';
import { confirm } from '@/components/ui/Dialog';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusTag from '@/components/ui/StatusTag';
import Pagination from '@/components/ui/Pagination';

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

const emptyForm: StationFormState = {
  stationCode: '',
  ownerName: '',
  address: '',
  powerAccount: '',
  inverterSn: '',
  inverterBrand: '',
  moduleSpec: '',
  moduleCount: '',
  capacityKw: '',
  longitude: '',
  latitude: '',
};

const statusTabs: { label: string; value: number | undefined }[] = [
  { label: '全部', value: undefined },
  { label: '未巡检', value: 0 },
  { label: '已巡检', value: 1 },
];

function StationListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const pid = Number(projectId);

  const PAGE_SIZE = 20;
  const [stations, setStations] = useState<Station[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Create dialog state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<StationFormState>({ ...emptyForm });



  // Import dialog state
  const [showImport, setShowImport] = useState(false);

  // Load stations
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const debouncedSearch = useDebounce(searchText, 500);

  const loadStations = useCallback(async (p: number = 1, append: boolean = false, keyword?: string) => {
    setLoading(true);
    try {
      const res = await listStations(pid, {
        page: p,
        size: PAGE_SIZE,
        keyword: keyword || undefined,
        inspectStatus: statusFilter,
      });
      if (append) {
        setStations(prev => [...prev, ...res.data.records]);
      } else {
        setStations(res.data.records);
      }
      setTotal(res.data.total);
      setPage(p);
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '加载失败' });
    } finally {
      setLoading(false);
    }
  }, [pid, statusFilter]);

  useEffect(() => { loadStations(1, false, debouncedSearch); }, [loadStations, debouncedSearch]);

  // Handle search
  const handleSearch = () => {
    setSelectedIds(new Set());
    loadStations(1, false, searchText);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter') handleSearch();
  };

  // Status filter
  const handleStatusFilter = (value: number | undefined) => {
    setStatusFilter(value);
    setSelectedIds(new Set());
  };

  // Toggle batch select
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === stations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(stations.map(f => f.id)));
    }
  };

  // Create station
  const handleOpenCreate = () => {
    setCreateForm({ ...emptyForm });
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!createForm.stationCode.trim() || !createForm.ownerName.trim()) {
      showToast({ icon: 'fail', content: '请填写电站编号和户主姓名' });
      return;
    }
    try {
      await createStation(pid, {
        stationCode: createForm.stationCode,
        ownerName: createForm.ownerName,
        address: createForm.address || null,
        powerAccount: createForm.powerAccount || null,
        inverterSn: createForm.inverterSn || null,
        inverterBrand: createForm.inverterBrand || null,
        moduleSpec: createForm.moduleSpec || null,
        moduleCount: createForm.moduleCount ? Number(createForm.moduleCount) : null,
        capacityKw: createForm.capacityKw ? Number(createForm.capacityKw) : null,
        longitude: createForm.longitude ? Number(createForm.longitude) : null,
        latitude: createForm.latitude ? Number(createForm.latitude) : null,
      });
      showToast({ icon: 'success', content: '创建成功' });
      setShowCreate(false);
      loadStations(1, false, debouncedSearch);
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '创建失败' });
    }
  };



  // Batch delete
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) {
      showToast({ icon: 'info', content: '请选择要删除的电站' });
      return;
    }
    const ok = await confirm({
      content: `确定删除选中的 ${selectedIds.size} 户吗？此操作不可撤销。`,
      title: '批量删除确认',
    });
    if (!ok) return;
    try {
      await batchDeleteStations(pid, Array.from(selectedIds));
      showToast({ icon: 'success', content: '批量删除成功' });
      setSelectedIds(new Set());
      loadStations(1, false, debouncedSearch);
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '删除失败' });
    }
  };

  // Import
  const handleOpenImport = () => setShowImport(true);

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await importStations(pid, file);
      showToast({ icon: 'success', content: `成功导入 ${res.data.successCount} 户` });
      setShowImport(false);
      loadStations(1, false, debouncedSearch);
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '导入失败' });
    }
  };

  // Navigate to station detail
  const goToDetail = (stationId: number) => {
    navigate(`/admin/projects/${pid}/stations/${stationId}`);
  };

  const allSelected = stations.length > 0 && selectedIds.size === stations.length;

  // Desktop pagination
  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setSelectedIds(new Set());
    loadStations(p, false, searchText);
  };

  // Mobile infinite scroll
  const pageRef = useRef(1);
  pageRef.current = page;
  const mobileSentinelRef = useInfiniteScroll(
    () => loadStations(pageRef.current + 1, true, debouncedSearch),
    { hasMore: stations.length < total, loading },
  );

  // Reusable form fields renderer
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

  const renderFormFields = (
    form: StationFormState,
    onChange: (field: keyof StationFormState, value: string) => void
  ) => (
    <div className="space-y-3">
      {formFields.map(field => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <input
            type={field.type || 'text'}
            value={form[field.key]}
            onChange={e => onChange(field.key, field.integer ? e.target.value.replace(/[^0-9]/g, '').replace(/^0+/, '') : e.target.value)}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none text-sm transition"
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Top toolbar */}
      <div className="px-6 pt-4 pb-2">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search input */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="搜索编号/户主姓名"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal focus:border-teal outline-none text-sm transition"
            />
          </div>

          {/* Action buttons */}
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal text-white text-sm font-medium rounded-lg hover:bg-teal-dark transition-colors"
          >
            <Plus size={16} />
            新增
          </button>

          <button
            onClick={handleOpenImport}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload size={16} />
            导入
          </button>

          {selectedIds.size > 0 && (
            <button
              onClick={handleBatchDelete}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 size={16} />
              批量删除({selectedIds.size})
            </button>
          )}
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-2 mt-3">
          {statusTabs.map(tab => (
            <button
              key={tab.label}
              onClick={() => handleStatusFilter(tab.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-navy text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <span className="ml-auto text-sm text-gray-400">
            共 {total} 条
          </span>
        </div>
      </div>

      {/* Table header (desktop) */}
      <div className="hidden lg:block px-6">
        <div className="flex items-center gap-4 py-2.5 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <div className="w-8 flex-shrink-0">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded border-gray-300 text-teal focus:ring-teal cursor-pointer"
            />
          </div>
          <div className="w-28">电站编号</div>
          <div className="w-24">户主姓名</div>
          <div className="w-32">发电户号</div>
          <div className="w-28">逆变器品牌型号</div>
          <div className="w-20">状态</div>
          <div className="w-28">最后巡检时间</div>
          <div className="flex-1 text-right">操作</div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto px-6">
        {loading && stations.length === 0 ? (
          <LoadingSpinner size="lg" />
        ) : stations.length === 0 ? (
          <EmptyState icon={Users} message="暂无电站数据" />
        ) : (
          <>
            {/* Desktop table rows */}
            <div className="hidden lg:block">
              {stations.map(f => (
                <div
                  key={f.id}
                  onClick={() => goToDetail(f.id)}
                  className={`flex items-center gap-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedIds.has(f.id) ? 'bg-teal/5' : ''
                  }`}
                >
                  <div className="w-8 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(f.id)}
                      onChange={() => toggleSelect(f.id)}
                      className="w-4 h-4 rounded border-gray-300 text-teal focus:ring-teal cursor-pointer"
                    />
                  </div>
                  <div className="w-28 text-sm font-mono text-gray-700 truncate">{f.stationCode}</div>
                  <div className="w-24 text-sm font-medium text-gray-900 truncate">{f.ownerName}</div>
                  <div className="w-32 text-sm text-gray-500 truncate">{f.powerAccount || '-'}</div>
                  <div className="w-28 text-sm text-gray-500 truncate">{f.inverterBrand || '-'}</div>
                  <div className="w-20">
                    <StatusTag inspected={f.status === 1} />
                  </div>
                  <div className="w-28 text-sm text-gray-500 whitespace-nowrap">{f.lastInspectTime || '-'}</div>
                  <div className="flex-1 flex items-center justify-end" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => goToDetail(f.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded transition-colors"
                    >
                      详情
                      <ChevronRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden space-y-3 py-3">
              {stations.map(f => (
                <div
                  key={f.id}
                  onClick={() => goToDetail(f.id)}
                  className={`bg-white rounded-xl border border-gray-100 p-4 shadow-sm cursor-pointer active:bg-gray-50 transition-colors ${
                    selectedIds.has(f.id) ? 'ring-2 ring-teal border-teal' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(f.id)}
                          onChange={() => toggleSelect(f.id)}
                          className="w-4 h-4 mt-0.5 rounded border-gray-300 text-teal focus:ring-teal"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 truncate">{f.ownerName}</span>
                          <StatusTag inspected={f.status === 1} />
                        </div>
                        <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                          <div>编号: {f.stationCode}</div>
                          {f.powerAccount && <div>户号: {f.powerAccount}</div>}
                          <div>巡检: {f.lastInspectTime || '-'}</div>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                  </div>
                </div>
              ))}
              <div ref={mobileSentinelRef} className="h-1" />
              {loading && stations.length > 0 && (
                <div className="flex justify-center py-4">
                  <span className="text-sm text-gray-400">加载中...</span>
                </div>
              )}
              {stations.length > 0 && !loading && (
                <div className="text-center text-xs text-gray-400 py-2">
                  共 {total} 条记录
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Pagination — desktop only */}
      <Pagination page={page} totalPages={totalPages} total={total} onChange={goToPage} />

      {/* Create Dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl relative animate-fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-navy">新增电站</h3>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              {renderFormFields(createForm, (field, value) =>
                setCreateForm(prev => ({ ...prev, [field]: value }))
              )}
            </div>
            <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-teal text-white text-sm font-medium rounded-lg hover:bg-teal-dark transition-colors"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {showImport && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowImport(false)} />
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl relative animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-navy">导入电站</h3>
              <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg mb-4">
                <FileSpreadsheet size={24} className="text-teal flex-shrink-0" />
                <p className="text-sm text-gray-600 leading-relaxed">
                  请上传 Excel 文件（.xlsx），按以下列顺序排列：
                  电站编号、户主姓名、装机地址、发电户号、逆变器序列号、逆变器品牌型号、装机容量、组件块数、组件规格型号、经度坐标、纬度坐标
                </p>
              </div>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-teal hover:bg-teal/5 transition-colors">
                <Upload size={28} className="text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">点击选择文件</span>
                <span className="text-xs text-gray-400 mt-1">支持 .xlsx / .xls 格式</span>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setShowImport(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StationListPage;
