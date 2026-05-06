import { ChevronLeft, ChevronRightIcon } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, total, onChange }: PaginationProps) {
  if (total <= 0) return null;

  return (
    <div className="hidden lg:flex px-2 py-3 items-center justify-between">
      <span className="text-sm text-gray-400">
        共 {total} 条，第 {page}/{totalPages} 页
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(1)}
          disabled={page <= 1}
          className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          首页
        </button>
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
          .reduce<(number | string)[]>((acc, p, idx, arr) => {
            if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
            acc.push(p);
            return acc;
          }, [])
          .map((p, idx) =>
            typeof p === 'string' ? (
              <span key={`ellipsis-${idx}`} className="px-1 text-sm text-gray-400">...</span>
            ) : (
              <button
                key={p}
                onClick={() => onChange(p)}
                className={`min-w-[32px] h-8 text-sm rounded transition-colors ${
                  p === page
                    ? 'bg-teal text-white font-medium'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            )
          )
        }
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRightIcon size={18} />
        </button>
        <button
          onClick={() => onChange(totalPages)}
          disabled={page >= totalPages}
          className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          末页
        </button>
      </div>
    </div>
  );
}
