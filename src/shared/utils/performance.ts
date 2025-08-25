/**
 * Performance Monitoring Utilities
 * Track Core Web Vitals and custom metrics
 */

import { useEffect, useCallback } from 'react';

// Core Web Vitals thresholds
export const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  FID: { good: 100, needsImprovement: 300 },   // First Input Delay
  CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }, // Time to First Byte
};

// Performance Observer for monitoring
export function observePerformance(callback: (metric: any) => void) {
  if (typeof window === 'undefined' || !window.PerformanceObserver) {
    return;
  }

  // Observe Largest Contentful Paint
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      callback({
        name: 'LCP',
        value: lastEntry.startTime,
        rating: getRating('LCP', lastEntry.startTime),
      });
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    console.warn('LCP observer not supported');
  }

  // Observe First Input Delay
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        callback({
          name: 'FID',
          value: entry.processingStart - entry.startTime,
          rating: getRating('FID', entry.processingStart - entry.startTime),
        });
      });
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    console.warn('FID observer not supported');
  }

  // Observe Cumulative Layout Shift
  let clsValue = 0;
  let clsEntries: any[] = [];
  
  try {
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          clsEntries.push(entry);
        }
      }
      callback({
        name: 'CLS',
        value: clsValue,
        rating: getRating('CLS', clsValue),
        entries: clsEntries,
      });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    console.warn('CLS observer not supported');
  }
}

// Get rating for a metric value
function getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = WEB_VITALS_THRESHOLDS[metric as keyof typeof WEB_VITALS_THRESHOLDS];
  if (!thresholds) return 'good';
  
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

// Custom performance marks
export function markPerformance(name: string) {
  if (typeof window !== 'undefined' && window.performance?.mark) {
    window.performance.mark(name);
  }
}

// Measure between marks
export function measurePerformance(name: string, startMark: string, endMark: string) {
  if (typeof window !== 'undefined' && window.performance?.measure) {
    try {
      window.performance.measure(name, startMark, endMark);
      const measures = window.performance.getEntriesByName(name);
      return measures[measures.length - 1]?.duration;
    } catch (e) {
      console.warn('Performance measurement failed:', e);
    }
  }
  return null;
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  useEffect(() => {
    const metrics: any[] = [];
    
    const handleMetric = (metric: any) => {
      metrics.push(metric);
      console.log(`[Performance] ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`);
      
      // Send to analytics if needed
      if (window.gtag) {
        window.gtag('event', 'web_vitals', {
          event_category: 'Performance',
          event_label: metric.name,
          value: Math.round(metric.value),
          non_interaction: true,
        });
      }
    };
    
    observePerformance(handleMetric);
    
    // Log metrics on page unload
    return () => {
      if (metrics.length > 0) {
        console.table(metrics);
      }
    };
  }, []);
}

// Debounce utility for performance
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle utility for performance
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Memory monitoring
export function getMemoryUsage() {
  if (typeof window !== 'undefined' && (window.performance as any)?.memory) {
    const memory = (window.performance as any).memory;
    return {
      usedJSHeapSize: (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      totalJSHeapSize: (memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
      jsHeapSizeLimit: (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB',
      usage: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2) + '%',
    };
  }
  return null;
}

// FPS monitoring
export function useFPSMonitor() {
  const fps = useCallback(() => {
    let lastTime = performance.now();
    let frames = 0;
    let fps = 0;
    
    function loop() {
      const currentTime = performance.now();
      frames++;
      
      if (currentTime >= lastTime + 1000) {
        fps = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
        console.log(`FPS: ${fps}`);
      }
      
      requestAnimationFrame(loop);
    }
    
    requestAnimationFrame(loop);
  }, []);
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      fps();
    }
  }, [fps]);
}

// Memoize function results
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  resolver?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  const memoized = function(this: any, ...args: Parameters<T>): ReturnType<T> {
    const key = resolver ? resolver(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func.apply(this, args);
    cache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return result;
  } as T;
  
  return memoized;
}

// Performance metrics collector
export class MetricsCollector {
  private metrics: Map<string, number[]> = new Map();
  private readonly maxSamples = 100;
  
  record(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const samples = this.metrics.get(name)!;
    samples.push(value);
    
    // Keep only last N samples
    if (samples.length > this.maxSamples) {
      samples.shift();
    }
  }
  
  getStats(name: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const samples = this.metrics.get(name);
    if (!samples || samples.length === 0) {
      return null;
    }
    
    const sorted = [...samples].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    
    return {
      count,
      average: sum / count,
      min: sorted[0],
      max: sorted[count - 1],
      p50: sorted[Math.floor(count * 0.5)],
      p95: sorted[Math.floor(count * 0.95)],
      p99: sorted[Math.floor(count * 0.99)],
    };
  }
  
  getAllStats(): Map<string, ReturnType<typeof this.getStats>> {
    const allStats = new Map();
    for (const [name] of this.metrics) {
      allStats.set(name, this.getStats(name));
    }
    return allStats;
  }
  
  clear(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }
}

// Global metrics collector instance
export const metricsCollector = new MetricsCollector();

// Request timing utility
export async function timeRequest<T>(
  name: string,
  request: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();
  
  try {
    const result = await request();
    const duration = performance.now() - startTime;
    
    metricsCollector.record(name, duration);
    
    if (duration > 1000) {
      console.warn(`[Performance] Slow request '${name}': ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    metricsCollector.record(`${name}_error`, duration);
    throw error;
  }
}

// Batch processor for API calls
export class BatchProcessor<T, R> {
  private queue: Array<{ item: T; resolve: (value: R) => void; reject: (error: any) => void }> = [];
  private timer: NodeJS.Timeout | null = null;
  
  constructor(
    private processor: (items: T[]) => Promise<R[]>,
    private batchSize = 10,
    private delay = 100
  ) {}
  
  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ item, resolve, reject });
      
      if (this.queue.length >= this.batchSize) {
        this.flush();
      } else if (!this.timer) {
        this.timer = setTimeout(() => this.flush(), this.delay);
      }
    });
  }
  
  private async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    if (this.queue.length === 0) return;
    
    const batch = this.queue.splice(0, this.batchSize);
    const items = batch.map(b => b.item);
    
    try {
      const results = await this.processor(items);
      batch.forEach((b, i) => b.resolve(results[i]));
    } catch (error) {
      batch.forEach(b => b.reject(error));
    }
    
    // Process remaining items
    if (this.queue.length > 0) {
      this.timer = setTimeout(() => this.flush(), this.delay);
    }
  }
}

// Lazy load utility - Removed due to JSX in .ts file
// Use React.lazy directly in component files (.tsx) instead
// Example:
// const LazyComponent = React.lazy(() => import('./Component'));
// <React.Suspense fallback={<div>Loading...</div>}>
//   <LazyComponent />
// </React.Suspense>

// Global type declarations
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}