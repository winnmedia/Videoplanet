'use client';

/**
 * Performance Monitoring Dashboard
 * Real-time visualization of Core Web Vitals and custom metrics
 */

import React, { useState, useEffect } from 'react';
import { usePerformanceTracking } from '@/shared/ui/WebVitalsReporter';

interface MetricCard {
  title: string;
  value: number;
  unit: string;
  threshold: number;
  status: 'good' | 'warning' | 'poor';
  trend: 'up' | 'down' | 'stable';
  change: number;
}

interface AlertItem {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  resolved: boolean;
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  
  const { generateReport, clearMetrics } = usePerformanceTracking();

  useEffect(() => {
    loadDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, timeRange]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load performance metrics
      const [performanceResponse, alertsResponse] = await Promise.all([
        fetch(`/api/analytics/performance?type=summary&since=${getTimestampForRange(timeRange)}`),
        fetch(`/api/monitoring/alerts?resolved=false&limit=20`)
      ]);

      const performanceData = await performanceResponse.json();
      const alertsData = await alertsResponse.json();

      setMetrics(performanceData);
      setAlerts(alertsData.alerts || []);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimestampForRange = (range: string): string => {
    const now = Date.now();
    const ranges = {
      '1h': now - (60 * 60 * 1000),
      '24h': now - (24 * 60 * 60 * 1000),
      '7d': now - (7 * 24 * 60 * 60 * 1000),
      '30d': now - (30 * 24 * 60 * 60 * 1000)
    };
    return ranges[range as keyof typeof ranges]?.toString() || ranges['24h'].toString();
  };

  const getMetricStatus = (value: number, thresholds: { good: number, poor: number }): 'good' | 'warning' | 'poor' => {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'warning';
    return 'poor';
  };

  const getCoreWebVitalsCards = (): MetricCard[] => {
    if (!metrics?.summary?.coreWebVitals) return [];

    const vitals = metrics.summary.coreWebVitals;
    const cards: MetricCard[] = [];

    // FCP - First Contentful Paint
    if (vitals.FCP) {
      cards.push({
        title: 'First Contentful Paint',
        value: vitals.FCP.average,
        unit: 'ms',
        threshold: 1800,
        status: getMetricStatus(vitals.FCP.average, { good: 1800, poor: 3000 }),
        trend: 'stable',
        change: 0
      });
    }

    // LCP - Largest Contentful Paint
    if (vitals.LCP) {
      cards.push({
        title: 'Largest Contentful Paint',
        value: vitals.LCP.average,
        unit: 'ms',
        threshold: 2500,
        status: getMetricStatus(vitals.LCP.average, { good: 2500, poor: 4000 }),
        trend: 'stable',
        change: 0
      });
    }

    // FID - First Input Delay
    if (vitals.FID) {
      cards.push({
        title: 'First Input Delay',
        value: vitals.FID.average,
        unit: 'ms',
        threshold: 100,
        status: getMetricStatus(vitals.FID.average, { good: 100, poor: 300 }),
        trend: 'stable',
        change: 0
      });
    }

    // CLS - Cumulative Layout Shift
    if (vitals.CLS) {
      cards.push({
        title: 'Cumulative Layout Shift',
        value: vitals.CLS.average,
        unit: '',
        threshold: 0.1,
        status: getMetricStatus(vitals.CLS.average, { good: 0.1, poor: 0.25 }),
        trend: 'stable',
        change: 0
      });
    }

    // TTFB - Time to First Byte
    if (vitals.TTFB) {
      cards.push({
        title: 'Time to First Byte',
        value: vitals.TTFB.average,
        unit: 'ms',
        threshold: 800,
        status: getMetricStatus(vitals.TTFB.average, { good: 800, poor: 1800 }),
        trend: 'stable',
        change: 0
      });
    }

    return cards;
  };

  const getCustomMetricsCards = (): MetricCard[] => {
    if (!metrics?.summary?.customMetrics) return [];

    const customMetrics = metrics.summary.customMetrics;
    const cards: MetricCard[] = [];

    // Video Initialization Time
    if (customMetrics['video-initialization-time']) {
      cards.push({
        title: 'Video Load Time',
        value: customMetrics['video-initialization-time'].average,
        unit: 'ms',
        threshold: 2000,
        status: getMetricStatus(customMetrics['video-initialization-time'].average, { good: 2000, poor: 5000 }),
        trend: 'stable',
        change: 0
      });
    }

    // API Response Time
    if (customMetrics['api-response-time']) {
      cards.push({
        title: 'API Response Time',
        value: customMetrics['api-response-time'].average,
        unit: 'ms',
        threshold: 200,
        status: getMetricStatus(customMetrics['api-response-time'].average, { good: 200, poor: 1000 }),
        trend: 'stable',
        change: 0
      });
    }

    // File Upload Performance
    if (customMetrics['file-upload-performance']) {
      cards.push({
        title: 'File Upload Time',
        value: customMetrics['file-upload-performance'].average,
        unit: 'ms',
        threshold: 30000,
        status: getMetricStatus(customMetrics['file-upload-performance'].average, { good: 30000, poor: 60000 }),
        trend: 'stable',
        change: 0
      });
    }

    // WebSocket Performance
    if (customMetrics['websocket-performance']) {
      cards.push({
        title: 'WebSocket Latency',
        value: customMetrics['websocket-performance'].average,
        unit: 'ms',
        threshold: 100,
        status: getMetricStatus(customMetrics['websocket-performance'].average, { good: 100, poor: 500 }),
        trend: 'stable',
        change: 0
      });
    }

    return cards;
  };

  const getSeverityColor = (severity: string): string => {
    const colors = {
      low: 'text-blue-600 bg-blue-100',
      medium: 'text-yellow-600 bg-yellow-100',
      high: 'text-red-600 bg-red-100',
      critical: 'text-red-800 bg-red-200'
    };
    return colors[severity as keyof typeof colors] || colors.medium;
  };

  const getStatusColor = (status: string): string => {
    const colors = {
      good: 'text-green-600 bg-green-100',
      warning: 'text-yellow-600 bg-yellow-100',
      poor: 'text-red-600 bg-red-100'
    };
    return colors[status as keyof typeof colors] || colors.warning;
  };

  const generatePerformanceReport = () => {
    const report = generateReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearAllMetrics = async () => {
    if (confirm('Are you sure you want to clear all stored metrics? This action cannot be undone.')) {
      clearMetrics();
      await loadDashboardData();
    }
  };

  if (isLoading && !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading performance dashboard...</p>
        </div>
      </div>
    );
  }

  const coreWebVitalsCards = getCoreWebVitalsCards();
  const customMetricsCards = getCustomMetricsCards();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
              <p className="text-gray-600">Real-time monitoring of Core Web Vitals and application performance</p>
            </div>
            <div className="flex space-x-4">
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
{autoRefresh ? 'AUTO REFRESH' : 'PAUSED'}
              </button>
              <button
                onClick={generatePerformanceReport}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
              >
                📊 Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        {metrics?.summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Metrics</h3>
              <p className="text-3xl font-bold text-gray-900">{metrics.summary.totalMetrics || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Last 24 Hours</h3>
              <p className="text-3xl font-bold text-gray-900">{metrics.summary.last24Hours || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Active Alerts</h3>
              <p className="text-3xl font-bold text-red-600">{alerts.length || 0}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Issues Found</h3>
              <p className="text-3xl font-bold text-yellow-600">{metrics.summary.issues?.length || 0}</p>
            </div>
          </div>
        )}

        {/* Core Web Vitals */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Core Web Vitals</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {coreWebVitalsCards.map((card, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(card.status)}`}>
                    {card.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {card.value.toFixed(card.unit === '' ? 3 : 0)}
                      <span className="text-sm font-normal text-gray-500">{card.unit}</span>
                    </p>
                    <p className="text-xs text-gray-500">Threshold: {card.threshold}{card.unit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Metrics */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Application Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {customMetricsCards.map((card, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-500">{card.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(card.status)}`}>
                    {card.status.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {card.value.toFixed(0)}
                      <span className="text-sm font-normal text-gray-500">{card.unit}</span>
                    </p>
                    <p className="text-xs text-gray-500">Threshold: {card.threshold}{card.unit}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Alerts */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Active Alerts</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
ALL SYSTEMS PERFORMING WELL
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {alerts.map((alert) => (
                  <div key={alert.id} className="p-6 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{alert.metric}</p>
                        <p className="text-sm text-gray-500">
                          Value: {alert.value} | Threshold: {alert.threshold}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Issues Summary */}
        {metrics?.summary?.issues && metrics.summary.issues.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Performance Issues</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="divide-y divide-gray-200">
                {metrics.summary.issues.map((issue: any, index: number) => (
                  <div key={index} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{issue.message}</p>
                        <p className="text-sm text-gray-500">Count: {issue.count}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getSeverityColor(issue.severity)}`}>
                        {issue.severity.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center">
          <button
            onClick={loadDashboardData}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? 'Refreshing...' : '🔄 Refresh Data'}
          </button>
          
          <button
            onClick={clearAllMetrics}
            className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
          >
CLEAR ALL METRICS
          </button>
        </div>
      </div>
    </div>
  );
}