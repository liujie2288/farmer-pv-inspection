import { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Search, Plus, Upload, Trash2, Edit3, ChevronRight,
  Users, FileSpreadsheet, X
} from 'lucide-react';
import {
  listFarmers, createFarmer, updateFarmer, deleteFarmer,
  batchDeleteFarmers, importFarmers, Farmer
} from '@/api/farmers';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { showToast } from '@/components/ui/Toast';
import { confirm } from '@/components/ui/Dialog';
import EmptyState from '@/components/ui/EmptyState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import StatusTag from '@/components/ui/StatusTag';

interface FarmerFormState {
  farmerCode: string;
  farmerName: string;
  powerAccount: string;
  inverterSn: string;
  inverterBrand: string;
  moduleSpec: string;
  moduleCount: string;
  capacityKw: string;
}

const emptyForm: FarmerFormState = {
  farmerCode: '',
  farmerName: '',
  powerAccount: '',
  inverterSn: '',
  inverterBrand: '',
  moduleSpec: '',
  moduleCount: '',
  capacityKw: '',
};

const statusTabs: { label: string; value: number | undefined }[] = [
  { label: '全部', value: undefined },
  { label: '未巡检', value: 0 },
  { label: '已巡检', value: 1 },
];

function FarmerListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const pid = Number(projectId);

  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Create dialog state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<FarmerFormState>({ ...emptyForm });

  // Edit dialog state
  const [editFarmer, setEditFarmer] = useState<Farmer | null>(null);
  const [editForm, setEditForm] = useState<FarmerFormState>({ ...emptyForm });

  // Import dialog state
  const [showImport, setShowImport] = useState(false);

  // Load farmers
  const loadFarmers = useCallback(async (p: number = 1) => {
    setLoading(true);
    try {
      const res = await listFarmers(pid, {
        page: p,
        size: 20,
        farmerName: searchText || undefined,
        status: statusFilter,
      });
      if (p === 1) {
        setFarmers(res.data.records);
      } else {
        setFarmers(prev => [...prev, ...res.data.records]);
      }
      setTotal(res.data.total);
      setPage(p);
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '加载失败' });
    } finally {
      setLoading(false);
    }
  }, [pid, searchText, statusFilter]);

  useEffect(() => { loadFarmers(1); }, [loadFarmers]);

  // Handle search
  const handleSearch = () => {
    setSelectedIds(new Set());
    loadFarmers(1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
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
    if (selectedIds.size === farmers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(farmers.map(f => f.id)));
    }
  };

  // Create farmer
  const handleOpenCreate = () => {
    setCreateForm({ ...emptyForm });
    setShowCreate(true);
  };

  const handleCreate = async () => {
    if (!createForm.farmerCode.trim() || !createForm.farmerName.trim()) {
      showToast({ icon: 'fail', content: '请填写农户编号和姓名' });
      return;
    }
    try {
      await createFarmer(pid, {
        farmerCode: createForm.farmerCode,
        farmerName: createForm.farmerName,
        powerAccount: createForm.powerAccount || null,
        inverterSn: createForm.inverterSn || null,
        inverterBrand: createForm.inverterBrand || null,
        moduleSpec: createForm.moduleSpec || null,
        moduleCount: createForm.moduleCount ? Number(createForm.moduleCount) : null,
        capacityKw: createForm.capacityKw ? Number(createForm.capacityKw) : null,
      });
      showToast({ icon: 'success', content: '创建成功' });
      setShowCreate(false);
      loadFarmers(1);
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '创建失败' });
    }
  };

  // Edit farmer
  const handleOpenEdit = (farmer: Farmer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditFarmer(farmer);
    setEditForm({
      farmerCode: farmer.farmerCode || '',
      farmerName: farmer.farmerName || '',
      powerAccount: farmer.powerAccount || '',
      inverterSn: farmer.inverterSn || '',
      inverterBrand: farmer.inverterBrand || '',
      moduleSpec: farmer.moduleSpec || '',
      moduleCount: farmer.moduleCount != null ? String(farmer.moduleCount) : '',
      capacityKw: farmer.capacityKw != null ? String(farmer.capacityKw) : '',
    });
  };

  const handleEdit = async () => {
    if (!editFarmer) return;
    if (!editForm.farmerCode.trim() || !editForm.farmerName.trim()) {
      showToast({ icon: 'fail', content: '请填写农户编号和姓名' });
      return;
    }
    try {
      await updateFarmer(pid, editFarmer.id, {
        farmerCode: editForm.farmerCode,
        farmerName: editForm.farmerName,
        powerAccount: editForm.powerAccount || null,
        inverterSn: editForm.inverterSn || null,
        inverterBrand: editForm.inverterBrand || null,
        moduleSpec: editForm.moduleSpec || null,
        moduleCount: editForm.moduleCount ? Number(editForm.moduleCount) : null,
        capacityKw: editForm.capacityKw ? Number(editForm.capacityKw) : null,
      });
      showToast({ icon: 'success', content: '修改成功' });
      setEditFarmer(null);
      loadFarmers(1);
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '修改失败' });
    }
  };

  // Delete single farmer
  const handleDelete = async (farmer: Farmer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const ok = await confirm({ content: `确定删除农户"${farmer.farmerName}"吗？`, title: '删除确认' });
    if (!ok) return;
    try {
      await deleteFarmer(pid, farmer.id);
      showToast({ icon: 'success', content: '删除成功' });
      loadFarmers(1);
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '删除失败' });
    }
  };

  // Batch delete
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) {
      showToast({ icon: 'info', content: '请选择要删除的农户' });
      return;
    }
    const ok = await confirm({
      content: `确定删除选中的 ${selectedIds.size} 户吗？此操作不可撤销。`,
      title: '批量删除确认',
    });
    if (!ok) return;
    try {
      await batchDeleteFarmers(pid, Array.from(selectedIds));
      showToast({ icon: 'success', content: '批量删除成功' });
      setSelectedIds(new Set());
      loadFarmers(1);
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
      const res = await importFarmers(pid, file);
      showToast({ icon: 'success', content: `成功导入 ${res.data.successCount} 户` });
      setShowImport(false);
      loadFarmers(1);
    } catch (e: any) {
      showToast({ icon: 'fail', content: e.message || '导入失败' });
    }
  };

  // Navigate to farmer detail
  const goToDetail = (farmerId: number) => {
    navigate(`/admin/projects/${pid}/farmers/${farmerId}`);
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sentinelRef = useInfiniteScroll(
    () => loadFarmers(page + 1),
    { hasMore: farmers.length < total, loading, root: scrollContainerRef.current },
  );

  const allSelected = farmers.length > 0 && selectedIds.size === farmers.length;

  // Reusable form fields renderer
  const formFields: { key: keyof FarmerFormState; label: string; placeholder: string; required?: boolean; type?: string }[] = [
    { key: 'farmerCode', label: '农户编号', placeholder: '必填', required: true },
    { key: 'farmerName', label: '农户姓名', placeholder: '必填', required: true },
    { key: 'powerAccount', label: '发电户号', placeholder: '选填' },
    { key: 'inverterSn', label: '逆变器序列号', placeholder: '选填' },
    { key: 'inverterBrand', label: '逆变器品牌', placeholder: '选填' },
    { key: 'moduleSpec', label: '组件规格', placeholder: '选填' },
    { key: 'moduleCount', label: '组件块数', placeholder: '选填', type: 'number' },
    { key: 'capacityKw', label: '装机容量(kW)', placeholder: '选填', type: 'number' },
  ];

  const renderFormFields = (
    form: FarmerFormState,
    onChange: (field: keyof FarmerFormState, value: string) => void
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
            onChange={e => onChange(field.key, e.target.value)}
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
              placeholder="搜索农户姓名"
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
            共 {total} 户
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
          <div className="w-28">农户编号</div>
          <div className="w-24">农户姓名</div>
          <div className="w-32">发电户号</div>
          <div className="w-20">状态</div>
          <div className="w-28">逆变器品牌</div>
          <div className="w-24">装机容量</div>
          <div className="flex-1 text-right">操作</div>
        </div>
      </div>

      {/* Content area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6">
        {loading && farmers.length === 0 ? (
          <LoadingSpinner size="lg" />
        ) : farmers.length === 0 ? (
          <EmptyState icon={Users} message="暂无农户数据" />
        ) : (
          <>
            {/* Desktop table rows */}
            <div className="hidden lg:block">
              {farmers.map(f => (
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
                  <div className="w-28 text-sm font-mono text-gray-700 truncate">{f.farmerCode}</div>
                  <div className="w-24 text-sm font-medium text-gray-900 truncate">{f.farmerName}</div>
                  <div className="w-32 text-sm text-gray-500 truncate">{f.powerAccount || '-'}</div>
                  <div className="w-20">
                    <StatusTag inspected={f.status === 1} />
                  </div>
                  <div className="w-28 text-sm text-gray-500 truncate">{f.inverterBrand || '-'}</div>
                  <div className="w-24 text-sm text-gray-500">
                    {f.capacityKw != null ? `${f.capacityKw} kW` : '-'}
                  </div>
                  <div className="flex-1 flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={e => handleOpenEdit(f, e)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-teal hover:bg-teal/10 rounded transition-colors"
                    >
                      <Edit3 size={13} />
                      编辑
                    </button>
                    <button
                      onClick={e => handleDelete(f, e)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 size={13} />
                      删除
                    </button>
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
              {farmers.map(f => (
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
                          <span className="text-sm font-medium text-gray-900 truncate">{f.farmerName}</span>
                          <StatusTag inspected={f.status === 1} />
                        </div>
                        <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                          <div>编号: {f.farmerCode}</div>
                          {f.powerAccount && <div>户号: {f.powerAccount}</div>}
                          {f.capacityKw != null && <div>容量: {f.capacityKw} kW</div>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={e => handleOpenEdit(f, e)}
                        className="p-1.5 text-gray-400 hover:text-teal rounded transition-colors"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={e => handleDelete(f, e)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                      <ChevronRight size={16} className="text-gray-300" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div ref={sentinelRef} className="h-1" />
            {loading && farmers.length > 0 && (
              <div className="flex justify-center py-4">
                <span className="text-sm text-gray-400">加载中...</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Dialog */}
      {showCreate && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreate(false)} />
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl relative animate-fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-navy">新增农户</h3>
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

      {/* Edit Dialog */}
      {editFarmer && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setEditFarmer(null)} />
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl relative animate-fade-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-navy">编辑农户</h3>
              <button onClick={() => setEditFarmer(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4 overflow-y-auto flex-1">
              {renderFormFields(editForm, (field, value) =>
                setEditForm(prev => ({ ...prev, [field]: value }))
              )}
            </div>
            <div className="flex gap-3 justify-between px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => {
                  handleDelete(editFarmer);
                  setEditFarmer(null);
                }}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                删除
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setEditFarmer(null)}
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
        </div>
      )}

      {/* Import Dialog */}
      {showImport && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowImport(false)} />
          <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl relative animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-navy">导入农户</h3>
              <button onClick={() => setShowImport(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg mb-4">
                <FileSpreadsheet size={24} className="text-teal flex-shrink-0" />
                <p className="text-sm text-gray-600 leading-relaxed">
                  请上传 Excel 文件（.xlsx），按以下列顺序排列：
                  农户编号、农户姓名、发电户号、逆变器序列号、逆变器品牌、组件规格、组件块数
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

export default FarmerListPage;
