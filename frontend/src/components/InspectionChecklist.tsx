import React, { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { getChecklistTemplate, type PhotoUrlsMap } from '@/api/inspections';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import PhotoUploader from '@/components/ui/PhotoUploader';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplateNumericLabel {
  key: string;
  label: string;
}

// Backend returns numericLabels as string[] (e.g. ["接地电阻","接触电阻"]).
// Normalize to {key, label} objects.
function normalizeLabels(raw: any): TemplateNumericLabel[] | null {
  if (!raw || !Array.isArray(raw) || raw.length === 0) return null;
  return raw.map((item: any) =>
    typeof item === 'string'
      ? { key: item, label: item }
      : { key: item.key ?? item.label, label: item.label ?? item.key }
  );
}

interface TemplateItem {
  itemId: number;
  content: string;
  hasNumeric: boolean;
  numericLabels: TemplateNumericLabel[] | null;
  hasPhoto: boolean;
}

interface TemplateSection {
  sectionId: number;
  sectionName: string;
  items: TemplateItem[];
}

interface ChecklistItem {
  itemId: number;
  content: string;
  result: '' | '正常' | '异常';
  exceptionNote: string;
  measuredValue: Record<string, number | null> | null;
}

interface ChecklistSection {
  sectionId: number;
  sectionName: string;
  items: ChecklistItem[];
}

interface ChecklistData {
  sections: ChecklistSection[];
}

interface InspectionChecklistProps {
  checklistData: ChecklistData;
  onChange: (data: ChecklistData) => void;
  readOnly?: boolean;
  photoUrls?: PhotoUrlsMap;
  onPhotosChange?: (photos: PhotoUrlsMap) => void;
  longitude?: number;
  latitude?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildInitialData(template: TemplateSection[]): ChecklistData {
  return {
    sections: template.map((sec) => ({
      sectionId: sec.sectionId,
      sectionName: sec.sectionName,
      items: sec.items.map((item) => ({
        itemId: item.itemId,
        content: item.content,
        result: '' as const,
        exceptionNote: '',
        measuredValue: item.hasNumeric && item.numericLabels?.length
          ? Object.fromEntries(item.numericLabels.map((l) => [l.key, null]))
          : null,
      })),
    })),
  };
}

function sectionIsComplete(section: ChecklistSection): boolean {
  return section.items.every((item) => item.result !== '');
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ResultBadgeProps {
  result: string;
}

const ResultBadge: React.FC<ResultBadgeProps> = ({ result }) => {
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
  return (
    <span className="text-gray-400 text-xs">未检查</span>
  );
};

interface ToggleButtonsProps {
  value: string;
  onChange: (value: '正常' | '异常') => void;
}

const ToggleButtons: React.FC<ToggleButtonsProps> = ({ value, onChange }) => (
  <div className="flex gap-2 shrink-0">
    <button
      type="button"
      onClick={() => onChange('正常')}
      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        value === '正常'
          ? 'bg-green-500 text-white'
          : 'border border-green-400 text-green-600 hover:bg-green-50'
      }`}
    >
      正常
    </button>
    <button
      type="button"
      onClick={() => onChange('异常')}
      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        value === '异常'
          ? 'bg-red-500 text-white'
          : 'border border-red-400 text-red-600 hover:bg-red-50'
      }`}
    >
      异常
    </button>
  </div>
);

interface NumericInputsProps {
  labels: TemplateNumericLabel[];
  values: Record<string, number | null>;
  onChange: (key: string, value: number | null) => void;
  readOnly: boolean;
}

const NumericInputs: React.FC<NumericInputsProps> = ({
  labels,
  values,
  onChange,
  readOnly,
}) => (
  <div className="flex flex-wrap gap-2 mt-1">
    {labels.map((lbl) => (
      <div key={lbl.key} className="flex items-center gap-1">
        <label className="text-xs text-gray-500 shrink-0">{lbl.label}</label>
        <input
          type="number"
          step="any"
          disabled={readOnly}
          value={values[lbl.key] ?? ''}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(lbl.key, raw === '' ? null : parseFloat(raw));
          }}
          className="w-20 px-2 py-1 border rounded text-sm text-center focus:outline-none focus:ring-1 focus:ring-teal disabled:bg-gray-50 disabled:text-gray-400"
        />
      </div>
    ))}
  </div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const InspectionChecklist: React.FC<InspectionChecklistProps> = ({
  checklistData,
  onChange,
  readOnly = false,
  photoUrls = {},
  onPhotosChange,
  longitude,
  latitude,
}) => {
  // collapsed sections tracked by sectionId
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [template, setTemplate] = useState<TemplateSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Item-level template lookup
  const itemTemplateMap = React.useMemo(() => {
    const map = new Map<string, TemplateItem>();
    for (const sec of template) {
      for (const item of sec.items) {
        map.set(`${sec.sectionId}-${item.itemId}`, item);
      }
    }
    return map;
  }, [template]);

  // Fetch template on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getChecklistTemplate();
        if (cancelled) return;

        // Axios interceptor returns response.data = { code, data: { sections: [...] } }.
        // So res.data = { sections: [...] }. Handle multiple shapes defensively.
        const payload = (res as any)?.data ?? res;
        const raw: TemplateSection[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.sections)
            ? payload.sections
            : null;

        if (!raw) {
          throw new Error('模板数据格式异常');
        }

        const normalized = raw.map((sec: any) => ({
          ...sec,
          items: sec.items?.map((item: any) => ({
            ...item,
            numericLabels: normalizeLabels(item.numericLabels),
          })),
        }));

        setTemplate(normalized);
        // Initialise checklist data if empty
        if (!checklistData.sections || checklistData.sections.length === 0) {
          onChange(buildInitialData(normalized));
        }
      } catch (err: any) {
        if (!cancelled) setError(err.message || '加载检查模板失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------------------------
  // Callbacks
  // -----------------------------------------------------------------------

  const toggleCollapse = useCallback((sectionId: number) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }, []);

  const updateItem = useCallback(
    (
      sectionId: number,
      itemId: number,
      patch: Partial<Pick<ChecklistItem, 'result' | 'exceptionNote' | 'measuredValue'>>,
    ) => {
      const next: ChecklistData = {
        sections: checklistData.sections.map((sec) => {
          if (sec.sectionId !== sectionId) return sec;
          return {
            ...sec,
            items: sec.items.map((item) => {
              if (item.itemId !== itemId) return item;
              return { ...item, ...patch };
            }),
          };
        }),
      };
      onChange(next);
    },
    [checklistData, onChange],
  );

  // -----------------------------------------------------------------------
  // Loading / Error states
  // -----------------------------------------------------------------------

  if (loading) {
    return <LoadingSpinner size="lg" />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-red-500">
        <AlertTriangle size={32} className="mb-2" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-1">
      {checklistData.sections.map((section) => {
        const isCollapsed = collapsed.has(section.sectionId);
        const complete = sectionIsComplete(section);

        return (
          <div key={section.sectionId}>
            {/* Section header */}
            <button
              type="button"
              onClick={() => toggleCollapse(section.sectionId)}
              className="w-full flex items-center justify-between group"
            >
              <h3 className="text-lg font-bold text-navy border-l-4 border-teal pl-3 my-4">
                {section.sectionId}. {section.sectionName}
                {complete && (
                  <CheckCircle
                    size={14}
                    className="inline-block ml-2 text-green-500 align-middle"
                  />
                )}
              </h3>
              {isCollapsed ? (
                <ChevronDown size={20} className="text-gray-400 group-hover:text-gray-600" />
              ) : (
                <ChevronUp size={20} className="text-gray-400 group-hover:text-gray-600" />
              )}
            </button>

            {/* Collapsible section body */}
            {!isCollapsed && (
              <div className="space-y-0">
                {section.items.map((item) => {
                  const tplItem = itemTemplateMap.get(
                    `${section.sectionId}-${item.itemId}`,
                  );
                  const numericLabels = tplItem?.numericLabels ?? [];

                  return (
                    <div
                      key={item.itemId}
                      className="flex justify-between items-start py-2.5 px-2 border-b border-gray-50 gap-3"
                    >
                      {/* Left: item number + content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium text-gray-900 mr-1">
                            {item.itemId}.
                          </span>
                          {item.content}
                        </p>

                        {/* Numeric inputs */}
                        {tplItem?.hasNumeric && numericLabels.length > 0 && (
                          <NumericInputs
                            labels={numericLabels}
                            values={item.measuredValue ?? {}}
                            onChange={(key, val) =>
                              updateItem(section.sectionId, item.itemId, {
                                measuredValue: {
                                  ...(item.measuredValue ?? {}),
                                  [key]: val,
                                },
                              })
                            }
                            readOnly={readOnly}
                          />
                        )}

                        {/* Exception note (only when abnormal) */}
                        {item.result === '异常' && (
                          <textarea
                            disabled={readOnly}
                            rows={2}
                            placeholder="请填写异常说明..."
                            value={item.exceptionNote}
                            onChange={(e) =>
                              updateItem(section.sectionId, item.itemId, {
                                exceptionNote: e.target.value,
                              })
                            }
                            className="w-full mt-1 px-3 py-2 border rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-teal disabled:bg-gray-50 disabled:text-gray-400"
                          />
                        )}
                      </div>

                      {/* Right: result controls or badge */}
                      <div className="shrink-0 pt-0.5">
                        {readOnly ? (
                          <ResultBadge result={item.result} />
                        ) : (
                          <ToggleButtons
                            value={item.result}
                            onChange={(val) =>
                              updateItem(section.sectionId, item.itemId, {
                                result: val,
                              })
                            }
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Section photo upload */}
                <div className="py-3 px-2">
                  <PhotoUploader
                    sectionId={section.sectionId}
                    photos={photoUrls[String(section.sectionId)] || []}
                    onChange={(updatedPhotos) =>
                      onPhotosChange?.({
                        ...photoUrls,
                        [String(section.sectionId)]: updatedPhotos,
                      })
                    }
                    maxCount={9}
                    longitude={longitude}
                    latitude={latitude}
                    readOnly={readOnly}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default InspectionChecklist;
