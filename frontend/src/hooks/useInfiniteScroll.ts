import { useEffect, useRef } from 'react';

export function useInfiniteScroll(
  onLoadMore: () => void,
  options: {
    hasMore: boolean;
    loading: boolean;
    root?: HTMLElement | null;
  },
) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !options.hasMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !options.loading && options.hasMore) {
          onLoadMore();
        }
      },
      { root: options.root ?? null, rootMargin: '200px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [onLoadMore, options.hasMore, options.loading, options.root]);

  return sentinelRef;
}
