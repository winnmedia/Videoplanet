/**
 * Virtual List Component for Performance Optimization
 * Renders only visible items for large lists
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './VirtualList.module.scss';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number; // Number of items to render outside visible area
  className?: string;
  onScroll?: (scrollTop: number) => void;
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className,
  onScroll,
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);
  
  // Add overscan
  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(items.length - 1, visibleEnd + overscan);
  
  // Calculate total height
  const totalHeight = items.length * itemHeight;
  
  // Calculate offset for visible items
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollTop(scrollTop);
    onScroll?.(scrollTop);
  }, [onScroll]);

  // Auto-scroll to top when items change significantly
  useEffect(() => {
    if (containerRef.current && scrollTop > totalHeight) {
      containerRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [items.length, scrollTop, totalHeight]);

  // Slice items for rendering
  const visibleItems = items.slice(startIndex, endIndex + 1);

  return (
    <div
      ref={containerRef}
      className={`${styles.virtualListContainer} ${className || ''}`}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
      role="list"
      aria-label="Virtual scrolling list"
    >
      <div
        className={styles.virtualListContent}
        style={{ height: totalHeight, position: 'relative' }}
      >
        <div
          className={styles.virtualListItems}
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              className={styles.virtualListItem}
              style={{ height: itemHeight }}
              role="listitem"
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
      
      {/* Loading indicator for large lists */}
      {items.length > 100 && (
        <div className={styles.scrollIndicator}>
          <span>
            {visibleStart + 1} - {Math.min(visibleEnd, items.length)} / {items.length}
          </span>
        </div>
      )}
    </div>
  );
}

// Hook for virtual scrolling
export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan = 3
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);
  
  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(items.length - 1, visibleEnd + overscan);
  
  const visibleItems = items.slice(startIndex, endIndex + 1);
  const offsetY = startIndex * itemHeight;
  const totalHeight = items.length * itemHeight;
  
  return {
    visibleItems,
    startIndex,
    endIndex,
    offsetY,
    totalHeight,
    scrollTop,
    setScrollTop,
  };
}