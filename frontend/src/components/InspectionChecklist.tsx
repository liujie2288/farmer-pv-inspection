import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { getSectionTree, type Section as TemplateSection } from '@/api/sections';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

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

interface InspectionChecklistProps {
  checklistData: ChecklistData;
  onChange: (data: ChecklistData) => void;
  readOnly?: boolean;
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
      items: sec.items
        .filter(item => item.itemType !== 3)
        .map((item) => ({
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
    if (item.itemType === 2) return item.measuredValue?.value != null;
    return item.result !== '';
  });
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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const InspectionChecklist: React.FC<InspectionChecklistProps> = ({
  checklistData,
  onChange,
  readOnly = false,
}) => {
  // collapsed sections tracked by sectionId
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track latest props to avoid stale closure in the init effect
  const checklistDataRef = useRef(checklistData);
  checklistDataRef.current = checklistData;

  // Fetch template on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getSectionTree();
        if (cancelled) return;

        const raw: TemplateSection[] = res.data;
        if (!raw || !Array.isArray(raw)) {
          throw new Error('模板数据格式异常');
        }

        // Initialise checklist data only if parent hasn't provided any
        const current = checklistDataRef.current;
        if (!current.sections || current.sections.length === 0) {
          onChange(buildInitialData(raw));
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
                {section.sectionNo ?? section.sectionId}. {section.sectionName}
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
                  return (
                    <div
                      key={item.itemId}
                      id={`checklist-item-${item.itemId}`}
                      className="flex justify-between items-start py-2.5 px-2 border-b border-gray-50 gap-3"
                    >
                      {/* Left: item number + content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium text-gray-900 mr-1">
                            {item.itemNo}.
                          </span>
                          {item.content}
                        </p>

                        {/* Numeric inputs for VALUE items */}
                        {item.itemType === 2 && (
                          <div className="mt-1.5">
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-500 shrink-0">实测值</label>
                              <input
                                type="text"
                                maxLength={100}
                                disabled={readOnly}
                                value={item.measuredValue?.value ?? ''}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  updateItem(section.sectionId, item.itemId, {
                                    measuredValue: { value: raw === '' ? null : raw },
                                  });
                                }}
                                className="w-48 px-3 py-2 border rounded-lg text-base text-center focus:outline-none focus:ring-1 focus:ring-teal disabled:bg-gray-50 disabled:text-gray-400"
                              />
                            </div>
                          </div>
                        )}

                        {/* Exception note (only when abnormal) */}
                        {item.result === '异常' && (
                          <textarea
                            disabled={readOnly}
                            rows={3}
                            maxLength={300}
                            placeholder="请填写异常说明..."
                            value={item.exceptionNote}
                            onChange={(e) =>
                              updateItem(section.sectionId, item.itemId, {
                                exceptionNote: e.target.value,
                              })
                            }
                            className="w-full mt-1.5 px-3 py-2 border rounded-lg text-base resize-none focus:outline-none focus:ring-1 focus:ring-teal disabled:bg-gray-50 disabled:text-gray-400"
                          />
                        )}
                      </div>

                      {/* Right: result controls or badge (CHECK items only) */}
                      {item.itemType !== 2 && (
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
                      )}
                    </div>
                  );
                })}

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default InspectionChecklist;
