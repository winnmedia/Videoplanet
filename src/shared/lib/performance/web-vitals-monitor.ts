/**
 * Real User Monitoring (RUM) System for VideoPlanet
 * Collects Core Web Vitals and custom performance metrics
 */

import { onFCP, onLCP, onCLS, onTTFB, onINP } from 'web-vitals';

export interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  entries: PerformanceEntry[];
  navigationType: string;
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType?: string;
  deviceMemory?: number;
}

export interface CustomMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface VideoPlayerMetrics {
  initializationTime: number;
  firstFrame: number;
  bufferingEvents: number;
  qualityChanges: number;
  errorRate: number;
}

export interface FileUploadMetrics {
  uploadSpeed: number;
  chunkSize: number;
  errorRate: number;
  retryCount: number;
  totalTime: number;
}

export interface WebSocketMetrics {
  connectionTime: number;
  messageLatency: number;
  reconnectionCount: number;
  errorRate: number;
  throughput: number;
}

export class WebVitalsMonitor {
  private metrics: PerformanceMetric[] = [];
  private customMetrics: CustomMetric[] = [];
  private observers: PerformanceObserver[] = [];
  private isEnabled: boolean = true;
  
  // Storage keys
  private readonly STORAGE_KEY = 'videoplanet_performance_metrics';
  private readonly CUSTOM_STORAGE_KEY = 'videoplanet_custom_metrics';
  
  constructor() {
    this.initializeWebVitals();
    this.initializeCustomMetrics();
    this.setupPerformanceObservers();
    this.setupPageVisibilityHandler();
  }

  /**
   * Initialize Core Web Vitals monitoring
   */
  private initializeWebVitals(): void {
    const sendMetric = (metric: any) => {
      const performanceMetric: PerformanceMetric = {
        id: metric.id,
        name: metric.name,
        value: metric.value,
        delta: metric.delta,
        rating: metric.rating,
        entries: metric.entries,
        navigationType: this.getNavigationType(),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        connectionType: this.getConnectionType(),
        deviceMemory: this.getDeviceMemory()
      };
      
      this.storeMetric(performanceMetric);
      this.sendToAnalytics(performanceMetric);
    };

    // Monitor Core Web Vitals
    onFCP(sendMetric);  // First Contentful Paint
    onLCP(sendMetric);  // Largest Contentful Paint  
    onCLS(sendMetric);  // Cumulative Layout Shift
    onTTFB(sendMetric); // Time to First Byte
    onINP(sendMetric);  // Interaction to Next Paint (replaces FID in web-vitals v5+)
  }

  /**
   * Setup custom performance observers for VideoPlanet-specific metrics
   */
  private setupPerformanceObservers(): void {
    // Monitor Resource Loading
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            this.trackResourcePerformance(entry as PerformanceResourceTiming);
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Monitor Long Tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackLongTask(entry);
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);

      // Monitor Navigation Timing
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackNavigationTiming(entry as PerformanceNavigationTiming);
        }
      });
      navigationObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navigationObserver);
    }
  }

  /**
   * Initialize custom metrics collection
   */
  private initializeCustomMetrics(): void {
    // Track DOM Content Loaded
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => {
        this.recordCustomMetric('page-load-complete', performance.now());
      });
    }

    // Track first interaction
    let firstInteraction = true;
    ['click', 'keydown', 'scroll'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        if (firstInteraction) {
          this.recordCustomMetric('first-user-interaction', performance.now());
          firstInteraction = false;
        }
      }, { once: true, passive: true });
    });
  }

  /**
   * Record video player performance metrics
   */
  public recordVideoPlayerMetrics(metrics: VideoPlayerMetrics): void {
    this.recordCustomMetric('video-initialization-time', metrics.initializationTime, {
      firstFrame: metrics.firstFrame,
      bufferingEvents: metrics.bufferingEvents,
      qualityChanges: metrics.qualityChanges,
      errorRate: metrics.errorRate
    });
  }

  /**
   * Record file upload performance metrics
   */
  public recordFileUploadMetrics(metrics: FileUploadMetrics): void {
    this.recordCustomMetric('file-upload-performance', metrics.totalTime, {
      uploadSpeed: metrics.uploadSpeed,
      chunkSize: metrics.chunkSize,
      errorRate: metrics.errorRate,
      retryCount: metrics.retryCount
    });
  }

  /**
   * Record WebSocket performance metrics
   */
  public recordWebSocketMetrics(metrics: WebSocketMetrics): void {
    this.recordCustomMetric('websocket-performance', metrics.connectionTime, {
      messageLatency: metrics.messageLatency,
      reconnectionCount: metrics.reconnectionCount,
      errorRate: metrics.errorRate,
      throughput: metrics.throughput
    });
  }

  /**
   * Record dashboard widget loading performance
   */
  public recordDashboardWidgetMetrics(widgetName: string, loadTime: number): void {
    this.recordCustomMetric(`dashboard-widget-${widgetName}`, loadTime, {
      widget: widgetName,
      timestamp: Date.now()
    });
  }

  /**
   * Record API response time metrics
   */
  public recordAPIResponseTime(endpoint: string, responseTime: number, status: number): void {
    this.recordCustomMetric('api-response-time', responseTime, {
      endpoint,
      status,
      timestamp: Date.now()
    });
  }

  /**
   * Record custom metric
   */
  private recordCustomMetric(name: string, value: number, metadata?: Record<string, any>): void {
    const metric: CustomMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata
    };

    this.customMetrics.push(metric);
    this.storeCustomMetric(metric);
    
    // Send to analytics if threshold is met
    this.checkThresholds(metric);
  }

  /**
   * Track resource loading performance
   */
  private trackResourcePerformance(entry: PerformanceResourceTiming): void {
    // Track video file loading
    if (entry.name.includes('.mp4') || entry.name.includes('.mov')) {
      this.recordCustomMetric('video-resource-load', entry.duration, {
        size: entry.transferSize,
        type: 'video',
        url: entry.name
      });
    }

    // Track JavaScript bundle loading
    if (entry.name.includes('.js')) {
      this.recordCustomMetric('js-resource-load', entry.duration, {
        size: entry.transferSize,
        type: 'javascript',
        url: entry.name
      });
    }

    // Track CSS loading
    if (entry.name.includes('.css')) {
      this.recordCustomMetric('css-resource-load', entry.duration, {
        size: entry.transferSize,
        type: 'stylesheet',
        url: entry.name
      });
    }
  }

  /**
   * Track long tasks that block the main thread
   */
  private trackLongTask(entry: PerformanceEntry): void {
    this.recordCustomMetric('long-task', entry.duration, {
      startTime: entry.startTime,
      name: entry.name
    });
  }

  /**
   * Track navigation timing
   */
  private trackNavigationTiming(entry: PerformanceNavigationTiming): void {
    const metrics = {
      dnsLookup: entry.domainLookupEnd - entry.domainLookupStart,
      tcpConnect: entry.connectEnd - entry.connectStart,
      tlsNegotiation: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
      serverResponse: entry.responseStart - entry.requestStart,
      documentLoad: entry.loadEventEnd - entry.loadEventStart,
      domInteractive: entry.domInteractive - entry.domLoading,
      domComplete: entry.domComplete - entry.domLoading
    };

    Object.entries(metrics).forEach(([name, value]) => {
      if (value > 0) {
        this.recordCustomMetric(`navigation-${name}`, value);
      }
    });
  }

  /**
   * Get navigation type (navigate, reload, back_forward, prerender)
   */
  private getNavigationType(): string {
    if ('navigation' in performance) {
      return performance.navigation.type.toString();
    }
    return 'unknown';
  }

  /**
   * Get connection type from Network Information API
   */
  private getConnectionType(): string | undefined {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType;
  }

  /**
   * Get device memory from Device Memory API
   */
  private getDeviceMemory(): number | undefined {
    return (navigator as any).deviceMemory;
  }

  /**
   * Store metric in local storage for offline analytics
   */
  private storeMetric(metric: PerformanceMetric): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const metrics = stored ? JSON.parse(stored) : [];
      metrics.push(metric);
      
      // Keep only last 100 metrics to prevent storage overflow
      if (metrics.length > 100) {
        metrics.splice(0, metrics.length - 100);
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(metrics));
    } catch (error) {
      console.warn('Failed to store performance metric:', error);
    }
  }

  /**
   * Store custom metric in local storage
   */
  private storeCustomMetric(metric: CustomMetric): void {
    try {
      const stored = localStorage.getItem(this.CUSTOM_STORAGE_KEY);
      const metrics = stored ? JSON.parse(stored) : [];
      metrics.push(metric);
      
      // Keep only last 200 custom metrics
      if (metrics.length > 200) {
        metrics.splice(0, metrics.length - 200);
      }
      
      localStorage.setItem(this.CUSTOM_STORAGE_KEY, JSON.stringify(metrics));
    } catch (error) {
      console.warn('Failed to store custom metric:', error);
    }
  }

  /**
   * Send metrics to analytics endpoint
   */
  private async sendToAnalytics(metric: PerformanceMetric): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await fetch('/api/analytics/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metric),
        keepalive: true
      });
    } catch (error) {
      console.warn('Failed to send performance metric to analytics:', error);
    }
  }

  /**
   * Check if metrics exceed thresholds and trigger alerts
   */
  private checkThresholds(metric: CustomMetric): void {
    const thresholds = {
      'video-initialization-time': 2000,  // 2 seconds
      'api-response-time': 200,           // 200ms
      'file-upload-performance': 30000,   // 30 seconds
      'websocket-performance': 100,       // 100ms
      'long-task': 50                     // 50ms
    };

    if (thresholds[metric.name] && metric.value > thresholds[metric.name]) {
      this.triggerPerformanceAlert(metric, thresholds[metric.name]);
    }
  }

  /**
   * Trigger performance alert
   */
  private triggerPerformanceAlert(metric: CustomMetric, threshold: number): void {
    console.warn(`Performance threshold exceeded for ${metric.name}: ${metric.value}ms (threshold: ${threshold}ms)`);
    
    // Send alert to monitoring system
    this.sendAlert({
      type: 'performance_threshold_exceeded',
      metric: metric.name,
      value: metric.value,
      threshold,
      timestamp: metric.timestamp,
      url: window.location.href
    });
  }

  /**
   * Send alert to monitoring system
   */
  private async sendAlert(alert: any): Promise<void> {
    try {
      await fetch('/api/monitoring/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alert),
        keepalive: true
      });
    } catch (error) {
      console.warn('Failed to send performance alert:', error);
    }
  }

  /**
   * Setup page visibility handler to pause monitoring when tab is hidden
   */
  private setupPageVisibilityHandler(): void {
    document.addEventListener('visibilitychange', () => {
      this.isEnabled = !document.hidden;
    });
  }

  /**
   * Get all stored metrics
   */
  public getStoredMetrics(): PerformanceMetric[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to retrieve stored metrics:', error);
      return [];
    }
  }

  /**
   * Get all stored custom metrics
   */
  public getStoredCustomMetrics(): CustomMetric[] {
    try {
      const stored = localStorage.getItem(this.CUSTOM_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to retrieve stored custom metrics:', error);
      return [];
    }
  }

  /**
   * Clear all stored metrics
   */
  public clearStoredMetrics(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.CUSTOM_STORAGE_KEY);
    this.metrics = [];
    this.customMetrics = [];
  }

  /**
   * Generate performance report
   */
  public generateReport(): any {
    const webVitals = this.getStoredMetrics();
    const customMetrics = this.getStoredCustomMetrics();

    return {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
      deviceMemory: this.getDeviceMemory(),
      webVitals,
      customMetrics,
      summary: this.generateSummary(webVitals, customMetrics)
    };
  }

  /**
   * Generate performance summary
   */
  private generateSummary(webVitals: PerformanceMetric[], customMetrics: CustomMetric[]): any {
    const summary = {
      coreWebVitals: {},
      customMetrics: {},
      issues: []
    };

    // Summarize Core Web Vitals
    ['FCP', 'LCP', 'FID', 'CLS', 'TTFB', 'INP'].forEach(metric => {
      const measurements = webVitals.filter(m => m.name === metric);
      if (measurements.length > 0) {
        const values = measurements.map(m => m.value);
        summary.coreWebVitals[metric] = {
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          latest: values[values.length - 1],
          rating: measurements[measurements.length - 1]?.rating
        };
      }
    });

    // Summarize custom metrics
    const customMetricNames = [...new Set(customMetrics.map(m => m.name))];
    customMetricNames.forEach(name => {
      const measurements = customMetrics.filter(m => m.name === name);
      const values = measurements.map(m => m.value);
      summary.customMetrics[name] = {
        count: measurements.length,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values)
      };
    });

    return summary;
  }

  /**
   * Cleanup observers when component unmounts
   */
  public cleanup(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Create global instance
export const webVitalsMonitor = new WebVitalsMonitor();

// Export for Next.js App Router
export function useWebVitalsMonitor() {
  return webVitalsMonitor;
}