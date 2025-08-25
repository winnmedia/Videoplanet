'use client';

/**
 * Web Vitals Reporter Component
 * Integrates with Next.js app to automatically collect and report Web Vitals
 */

import { useEffect } from 'react';
import { useWebVitalsMonitor } from '@/shared/lib/performance/web-vitals-monitor';

export function WebVitalsReporter() {
  const monitor = useWebVitalsMonitor();

  useEffect(() => {
    // The monitor starts automatically when imported
    // This component just ensures it's initialized in the app
    
    // Cleanup on unmount
    return () => {
      monitor.cleanup();
    };
  }, [monitor]);

  // This component doesn't render anything visible
  return null;
}

/**
 * Hook for tracking custom performance metrics in components
 */
export function usePerformanceTracking() {
  const monitor = useWebVitalsMonitor();

  const trackVideoPlayer = (metrics: any) => {
    monitor.recordVideoPlayerMetrics(metrics);
  };

  const trackFileUpload = (metrics: any) => {
    monitor.recordFileUploadMetrics(metrics);
  };

  const trackWebSocket = (metrics: any) => {
    monitor.recordWebSocketMetrics(metrics);
  };

  const trackDashboardWidget = (widgetName: string, loadTime: number) => {
    monitor.recordDashboardWidgetMetrics(widgetName, loadTime);
  };

  const trackAPIResponse = (endpoint: string, responseTime: number, status: number) => {
    monitor.recordAPIResponseTime(endpoint, responseTime, status);
  };

  const generateReport = () => {
    return monitor.generateReport();
  };

  const clearMetrics = () => {
    monitor.clearStoredMetrics();
  };

  return {
    trackVideoPlayer,
    trackFileUpload,
    trackWebSocket,
    trackDashboardWidget,
    trackAPIResponse,
    generateReport,
    clearMetrics
  };
}