import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
  Camera,
  Loader2,
} from 'lucide-react';
import { getSectionTree, getProjectSections, type Section as TemplateSection } from '@/api/sections';
import { uploadFileToOss, getPresignedUrl } from '@/api/storage';
import { openImagePreview } from '@/components/ui/ImagePreview';
import { showToast } from '@/components/ui/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { PhotoSectionSubmit } from '@/api/inspections';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChecklistItem {
  itemId: number;
  itemNo: number;
  content: string;
  itemType: number;
  result: '' | '正常' | '异常';
  exceptionNote: string;
  measuredValue: Record<string, string | number | null> | null;
}

interface ChecklistSection {
  sectionId: number;
  sectionNo?: number;
  sectionName: string;
  items: ChecklistItem[];
}

interface ChecklistData {
  sections: ChecklistSection[];
}

interface CustomPhotoItem {
  id: string;
  sectionId: number;
  itemId: number;
  title: string;
}

interface InspectionChecklistProps {
  checklistData: ChecklistData;
  onChange: (data: ChecklistData) => void;
  readOnly?: boolean;
  projectId?: number;
  onPhotosChange?: (photos: PhotoSectionSubmit[]) => void;
  initialPhotos?: PhotoSectionSubmit[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildInitialData(template: TemplateSection[]): ChecklistData {
  return {
    sections: template.map((sec) => ({
      sectionId: sec.id,
      sectionNo: sec.sectionNo,
      sectionName: sec.sectionName,
      items: sec.items.map((item) => ({
        itemId: item.id,
        itemNo: item.itemNo,
        content: item.content,
        itemType: item.itemType,
        result: '' as const,
        exceptionNote: '',
        measuredValue: item.itemType === 2 ? { value: null } : null,
      })),
    })),
  };
}

function sectionIsComplete(section: ChecklistSection): boolean {
  return section.items.every((item) => {
    if (item.itemType === 3) return true;
    if (item.itemType === 2) return item.measuredValue?.value != null;
    return item.result !== '';
  });
}

function photoKey(sectionId: number, itemId: number) {
  return `${sectionId}-${itemId}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const ResultBadge: React.FC<{ result: string }> = ({ result }) => {
  if (result === '正常') {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded text-xs font-medium">
        <CheckCircle size={12} />
        正常
      </span>
    );
  }
  if (result === '异常') {
    return (
      <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 px-2 py-0.5 rounded text-xs font-medium">
        <AlertTriangle size={12} />
        异常
      </span>
    );
  }
  return <span className="text-gray-400 text-xs">未检查</span>;
};

const ToggleButtons: React.FC<{ value: string; onChange: (v: '正常' | '异常') => void }> = ({ value, onChange }) => (
  <div className="flex gap-2 shrink-0">
    <button
      type="button"
      onClick={() => onChange('正常')}
      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        value === '正常' ? 'bg-green-500 text-white' : 'border border-green-400 text-green-600 hover:bg-green-50'
      }`}
    >
      正常
    </button>
    <button
      type="button"
      onClick={() => onChange('异常')}
      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        value === '异常' ? 'bg-red-500 text-white' : 'border border-red-400 text-red-600 hover:bg-red-50'
      }`}
    >
      异常
    </button>
  </div>
);

function PhotoThumb({ objectKey, onRemove }: { objectKey: string; onRemove: () => void }) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    let cancelled = false;
    getPresignedUrl(objectKey).then(u => { if (!cancelled) setUrl(u); }).catch(() => {});
    return () => { cancelled = true; };
  }, [objectKey]);

  if (!url) {
    return (
      <div className="aspect-square rounded bg-gray-100 flex items-center justify-center">
        <Loader2 size={12} className="animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="aspect-square rounded overflow-hidden bg-gray-100 relative group">
      <img src={url} alt="" className="w-full h-full object-cover cursor-pointer" onClick={() => openImagePreview(url)} />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 size={8} />
      </button>
    </div>
  );
}

// Photo upload row (reused for type=3 items and custom items)
function PhotoUploadRow({ pKey, urls, onUpload, onRemove, fileInputRef }: {
  pKey: string;
  urls: string[];
  onUpload: (key: string, files: FileList) => void;
  onRemove: (key: string, index: number) => void;
  fileInputRef: (key: string, el: HTMLInputElement | null) => void;
}) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-w-[600px]">
      {urls.map((objectKey, idx) => (
        <PhotoThumb key={objectKey} objectKey={objectKey} onRemove={() => onRemove(pKey, idx)} />
      ))}
      <input
        ref={el => fileInputRef(pKey, el)}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            onUpload(pKey, e.target.files);
            e.target.value = '';
          }
        }}
      />
      <button
        type="button"
        onClick={() => {
          const input = document.getElementById(`photo-input-${pKey}`) as HTMLInputElement;
          input?.click();
        }}
        className="aspect-square rounded border border-dashed border-gray-300 flex flex-col items-center justify-center gap-0.5 hover:border-teal-400 transition-colors"
      >
        <Camera size={14} className="text-gray-400" />
        <span className="text-[10px] text-gray-400">上传</span>
      </button>
      <input
        id={`photo-input-${pKey}`}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            onUpload(pKey, e.target.files);
            e.target.value = '';
          }
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const InspectionChecklist: React.FC<InspectionChecklistProps> = ({
  checklistData,
  onChange,
  readOnly = false,
  projectId,
  onPhotosChange,
  initialPhotos,
}) => {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Photo state: key=`sectionId-itemId`, value=objectKey[]
  const [photoUrls, setPhotoUrls] = useState<Record<string, string[]>>({});
  // Per-section custom photo items
  const [customItems, setCustomItems] = useState<CustomPhotoItem[]>([]);
  // Counter for generating negative itemIds
  const itemIdCounter = useRef(-1);

  const checklistDataRef = useRef(checklistData);
  checklistDataRef.current = checklistData;

  // Fetch template on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = projectId
          ? await getProjectSections(projectId)
          : await getSectionTree();
        if (cancelled) return;

        const raw: TemplateSection[] = res.data;
        if (!raw || !Array.isArray(raw)) throw new Error('模板数据格式异常');

        const current = checklistDataRef.current;
        if (!current.sections || current.sections.length === 0) {
          // New mode: use template directly
          onChange(buildInitialData(raw));
        } else {
          // Edit mode: merge type=3 items from template into existing data
          const merged: ChecklistData = {
            sections: current.sections.map((sec) => {
              const tplSection = raw.find(t => t.id === sec.sectionId);
              if (!tplSection) return sec;
              const photoItems = tplSection.items
                .filter(tpl => tpl.itemType === 3)
                .filter(tpl => !sec.items.some(i => i.itemId === tpl.id))
                .map(tpl => ({
                  itemId: tpl.id,
                  itemNo: tpl.itemNo,
                  content: tpl.content,
                  itemType: 3,
                  result: '' as const,
                  exceptionNote: '',
                  measuredValue: null,
                }));
              return photoItems.length > 0 ? { ...sec, items: [...sec.items, ...photoItems] } : sec;
            }),
          };
          onChange(merged);
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || '加载检查模板失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Initialize from existing photos (edit mode)
  useEffect(() => {
    if (!initialPhotos || initialPhotos.length === 0) return;
    const urls: Record<string, string[]> = {};
    const customs: CustomPhotoItem[] = [];

    for (const section of initialPhotos) {
      for (const item of section.items || []) {
        const key = photoKey(section.sectionId, item.itemId);
        urls[key] = item.urls || [];
        // Negative itemId means custom item
        if (item.itemId < 0) {
          customs.push({
            id: `custom-${section.sectionId}-${item.itemId}`,
            sectionId: section.sectionId,
            itemId: item.itemId,
            title: item.itemName || '',
          });
          if (item.itemId <= itemIdCounter.current) {
            itemIdCounter.current = item.itemId - 1;
          }
        }
      }
    }
    setPhotoUrls(urls);
    setCustomItems(customs);
  }, [initialPhotos]);

  // Assemble photos for submission
  const assemblePhotos = useCallback((
    pUrls: Record<string, string[]>,
    cItems: CustomPhotoItem[],
  ): PhotoSectionSubmit[] => {
    const sectionMap = new Map<number, { itemId: number; itemName: string; urls: string[] }[]>();

    for (const [key, urls] of Object.entries(pUrls)) {
      if (urls.length === 0) continue;
      const dashIdx = key.indexOf('-');
      const sId = Number(key.substring(0, dashIdx));
      const iId = Number(key.substring(dashIdx + 1));

      // Get itemName: from template item or custom item
      let itemName = '';
      if (iId >= 0) {
        for (const sec of checklistDataRef.current.sections) {
          if (sec.sectionId === sId) {
            const item = sec.items.find(i => i.itemId === iId);
            if (item) { itemName = item.content; break; }
          }
        }
      } else {
        const custom = cItems.find(c => c.sectionId === sId && c.itemId === iId);
        itemName = custom?.title || '';
      }

      if (!sectionMap.has(sId)) sectionMap.set(sId, []);
      sectionMap.get(sId)!.push({ itemId: iId, itemName, urls });
    }

    const result: PhotoSectionSubmit[] = [];
    for (const [sectionId, items] of sectionMap) {
      result.push({ sectionId, items });
    }
    return result;
  }, []);

  useEffect(() => {
    if (!onPhotosChange) return;
    onPhotosChange(assemblePhotos(photoUrls, customItems));
  }, [photoUrls, customItems, onPhotosChange, assemblePhotos]);

  // Callbacks
  const toggleCollapse = useCallback((sectionId: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }, []);

  const updateItem = useCallback(
    (sectionId: number, itemId: number, patch: Partial<Pick<ChecklistItem, 'result' | 'exceptionNote' | 'measuredValue'>>) => {
      const next: ChecklistData = {
        sections: checklistData.sections.map((sec) => {
          if (sec.sectionId !== sectionId) return sec;
          return { ...sec, items: sec.items.map((item) => item.itemId !== itemId ? item : { ...item, ...patch }) };
        }),
      };
      onChange(next);
    },
    [checklistData, onChange],
  );

  const handlePhotoUpload = useCallback(async (key: string, files: FileList) => {
    const newUrls: string[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const objectKey = await uploadFileToOss(files[i], 'photo');
        newUrls.push(objectKey);
      } catch (e: any) {
        showToast({ icon: 'fail', content: `照片上传失败: ${e.message || '未知错误'}` });
      }
    }
    if (newUrls.length > 0) {
      setPhotoUrls(prev => ({ ...prev, [key]: [...(prev[key] || []), ...newUrls] }));
    }
  }, []);

  const removePhoto = useCallback((key: string, index: number) => {
    setPhotoUrls(prev => ({ ...prev, [key]: (prev[key] || []).filter((_, i) => i !== index) }));
  }, []);

  // Add custom photo item to a section
  const addCustomItem = useCallback((sectionId: number) => {
    const itemId = itemIdCounter.current--;
    setCustomItems(prev => [...prev, {
      id: `custom-${Date.now()}-${itemId}`,
      sectionId,
      itemId,
      title: '',
    }]);
  }, []);

  const removeCustomItem = useCallback((id: string) => {
    setCustomItems(prev => {
      const item = prev.find(c => c.id === id);
      if (item) {
        const key = photoKey(item.sectionId, item.itemId);
        setPhotoUrls(p => {
          const next = { ...p };
          delete next[key];
          return next;
        });
      }
      return prev.filter(c => c.id !== id);
    });
  }, []);

  const updateCustomTitle = useCallback((id: string, title: string) => {
    setCustomItems(prev => prev.map(c => c.id === id ? { ...c, title } : c));
  }, []);

  if (loading) return <LoadingSpinner size="lg" />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-red-500">
        <AlertTriangle size={32} className="mb-2" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {checklistData.sections.map((section) => {
        const isCollapsed = collapsed.has(section.sectionId);
        const complete = sectionIsComplete(section);
        const sectionCustoms = customItems.filter(c => c.sectionId === section.sectionId);

        return (
          <div key={section.sectionId}>
            {/* Section header */}
            <button
              type="button"
              onClick={() => toggleCollapse(section.sectionId)}
              className="w-full flex items-center justify-between group"
            >
              <h3 className="text-lg font-bold text-navy border-l-4 border-teal pl-3 my-4">
                {section.sectionNo ?? section.sectionId}. {section.sectionName}
                {complete && <CheckCircle size={14} className="inline-block ml-2 text-green-500 align-middle" />}
              </h3>
              {isCollapsed ? <ChevronDown size={20} className="text-gray-400 group-hover:text-gray-600" /> : <ChevronUp size={20} className="text-gray-400 group-hover:text-gray-600" />}
            </button>

            {!isCollapsed && (
              <div className="space-y-0">
                {section.items.map((item) => {
                  if (item.itemType === 3) {
                    const key = photoKey(section.sectionId, item.itemId);
                    const urls = photoUrls[key] || [];
                    return (
                      <div key={item.itemId} id={`checklist-item-${item.itemId}`} className="py-3 px-2 border-b border-gray-50">
                        <p className="text-sm text-gray-700 mb-2">{item.content}</p>
                        <PhotoUploadRow pKey={key} urls={urls} onUpload={handlePhotoUpload} onRemove={removePhoto} fileInputRef={() => {}} />
                      </div>
                    );
                  }

                  return (
                    <div key={item.itemId} id={`checklist-item-${item.itemId}`} className="flex justify-between items-start py-2.5 px-2 border-b border-gray-50 gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium text-gray-900 mr-1">{item.itemNo}.</span>
                          {item.content}
                        </p>
                        {item.itemType === 2 && (
                          <div className="mt-1.5">
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-500 shrink-0">实测值</label>
                              <input
                                type="text" maxLength={100} disabled={readOnly}
                                value={item.measuredValue?.value ?? ''}
                                onChange={(e) => updateItem(section.sectionId, item.itemId, { measuredValue: { value: e.target.value === '' ? null : e.target.value } })}
                                className="w-48 px-3 py-2 border rounded-lg text-base text-center focus:outline-none focus:ring-1 focus:ring-teal disabled:bg-gray-50 disabled:text-gray-400"
                              />
                            </div>
                          </div>
                        )}
                        {item.result === '异常' && (
                          <textarea
                            disabled={readOnly} rows={3} maxLength={300} placeholder="请填写异常说明..."
                            value={item.exceptionNote}
                            onChange={(e) => updateItem(section.sectionId, item.itemId, { exceptionNote: e.target.value })}
                            className="w-full mt-1.5 px-3 py-2 border rounded-lg text-base resize-none focus:outline-none focus:ring-1 focus:ring-teal disabled:bg-gray-50 disabled:text-gray-400"
                          />
                        )}
                      </div>
                      {item.itemType !== 2 && (
                        <div className="shrink-0 pt-0.5">
                          {readOnly ? <ResultBadge result={item.result} /> : <ToggleButtons value={item.result} onChange={(val) => updateItem(section.sectionId, item.itemId, { result: val })} />}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Custom photo items for this section */}
                {sectionCustoms.map((custom) => {
                  const key = photoKey(custom.sectionId, custom.itemId);
                  const urls = photoUrls[key] || [];
                  return (
                    <div key={custom.id} className="py-3 px-2 border-b border-gray-50">
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={custom.title}
                          onChange={(e) => updateCustomTitle(custom.id, e.target.value)}
                          placeholder="请输入照片标题"
                          className="flex-1 text-sm text-gray-700 bg-transparent border-b border-gray-200 focus:border-teal focus:outline-none py-1"
                        />
                        <button type="button" onClick={() => removeCustomItem(custom.id)} className="p-1 text-gray-400 hover:text-red-500">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <PhotoUploadRow pKey={key} urls={urls} onUpload={handlePhotoUpload} onRemove={removePhoto} fileInputRef={() => {}} />
                    </div>
                  );
                })}

                {/* Add custom photo button */}
                {!readOnly && (
                  <div className="py-2 px-2 border-b border-gray-50">
                    <button
                      type="button"
                      onClick={() => addCustomItem(section.sectionId)}
                      className="flex items-center gap-1.5 text-sm text-teal hover:text-teal-dark"
                    >
                      <Plus size={14} />
                      添加自定义照片
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default InspectionChecklist;
