/**
 * Performance Analytics API Endpoint
 * Collects and stores performance metrics from the client
 */

import { NextRequest, NextResponse } from 'next/server';

export interface PerformanceMetricData {
  id: string;
  name: string;
  value: number;
  delta: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  entries: any[];
  navigationType: string;
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType?: string;
  deviceMemory?: number;
}

export interface CustomMetricData {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

// In-memory storage for development (replace with database in production)
const performanceMetrics: PerformanceMetricData[] = [];
const customMetrics: CustomMetricData[] = [];

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate the incoming data
    if (!data.name || typeof data.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      );
    }

    // Store Core Web Vitals metrics
    if (data.id && data.rating) {
      const metric: PerformanceMetricData = {
        id: data.id,
        name: data.name,
        value: data.value,
        delta: data.delta || 0,
        rating: data.rating,
        entries: data.entries || [],
        navigationType: data.navigationType || 'unknown',
        timestamp: data.timestamp || Date.now(),
        url: data.url || '',
        userAgent: data.userAgent || '',
        connectionType: data.connectionType,
        deviceMemory: data.deviceMemory
      };

      performanceMetrics.push(metric);
      
      // Keep only last 1000 metrics to prevent memory overflow
      if (performanceMetrics.length > 1000) {
        performanceMetrics.splice(0, performanceMetrics.length - 1000);
      }

      console.log(`📊 Performance Metric: ${metric.name} = ${metric.value}ms (${metric.rating})`);
      
      // Check for performance issues and log warnings
      await checkPerformanceThresholds(metric);
      
    } else {
      // Store custom metrics
      const customMetric: CustomMetricData = {
        name: data.name,
        value: data.value,
        timestamp: data.timestamp || Date.now(),
        metadata: data.metadata
      };

      customMetrics.push(customMetric);
      
      // Keep only last 2000 custom metrics
      if (customMetrics.length > 2000) {
        customMetrics.splice(0, customMetrics.length - 2000);
      }

      console.log(`📈 Custom Metric: ${customMetric.name} = ${customMetric.value}ms`);
    }

    return NextResponse.json({ status: 'success' });
    
  } catch (error) {
    console.error('Error processing performance metric:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metricType = searchParams.get('type') || 'all';
    const limit = parseInt(searchParams.get('limit') || '100');
    const since = searchParams.get('since');
    
    let results: any = {};

    if (metricType === 'all' || metricType === 'web-vitals') {
      let filteredWebVitals = performanceMetrics;
      
      if (since) {
        const sinceTimestamp = parseInt(since);
        filteredWebVitals = performanceMetrics.filter(m => m.timestamp >= sinceTimestamp);
      }
      
      results.webVitals = filteredWebVitals.slice(-limit);
    }

    if (metricType === 'all' || metricType === 'custom') {
      let filteredCustom = customMetrics;
      
      if (since) {
        const sinceTimestamp = parseInt(since);
        filteredCustom = customMetrics.filter(m => m.timestamp >= sinceTimestamp);
      }
      
      results.customMetrics = filteredCustom.slice(-limit);
    }

    // Generate summary statistics
    if (metricType === 'all' || metricType === 'summary') {
      results.summary = generatePerformanceSummary();
    }

    return NextResponse.json(results);
    
  } catch (error) {
    console.error('Error retrieving performance metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check performance thresholds and log warnings
 */
async function checkPerformanceThresholds(metric: PerformanceMetricData): Promise<void> {
  const thresholds = {
    'FCP': { good: 1800, poor: 3000 },      // First Contentful Paint
    'LCP': { good: 2500, poor: 4000 },      // Largest Contentful Paint
    'FID': { good: 100, poor: 300 },        // First Input Delay
    'CLS': { good: 0.1, poor: 0.25 },       // Cumulative Layout Shift
    'TTFB': { good: 800, poor: 1800 },      // Time to First Byte
    'INP': { good: 200, poor: 500 }         // Interaction to Next Paint
  };

  const threshold = thresholds[metric.name as keyof typeof thresholds];
  
  if (threshold) {
    if (metric.value > threshold.poor) {
      console.warn(`🚨 POOR Performance: ${metric.name} = ${metric.value}ms (threshold: ${threshold.poor}ms)`);
      
      // Send alert to monitoring system (implement webhook/notification)
      await sendPerformanceAlert({
        severity: 'high',
        metric: metric.name,
        value: metric.value,
        threshold: threshold.poor,
        url: metric.url,
        timestamp: metric.timestamp
      });
      
    } else if (metric.value > threshold.good) {
      console.warn(`⚠️ NEEDS IMPROVEMENT: ${metric.name} = ${metric.value}ms (threshold: ${threshold.good}ms)`);
      
      await sendPerformanceAlert({
        severity: 'medium',
        metric: metric.name,
        value: metric.value,
        threshold: threshold.good,
        url: metric.url,
        timestamp: metric.timestamp
      });
    } else {
      console.log(`✅ GOOD Performance: ${metric.name} = ${metric.value}ms`);
    }
  }
}

/**
 * Send performance alert to monitoring system
 */
async function sendPerformanceAlert(alert: any): Promise<void> {
  try {
    // In production, this would send to Slack, email, or monitoring service
    console.log('📧 Performance Alert:', alert);
    
    // TODO: Implement actual alerting
    // - Send to Slack webhook
    // - Send email notification
    // - Create monitoring dashboard alert
    // - Log to centralized logging system
    
  } catch (error) {
    console.error('Failed to send performance alert:', error);
  }
}

/**
 * Generate performance summary statistics
 */
function generatePerformanceSummary(): any {
  const now = Date.now();
  const last24Hours = now - (24 * 60 * 60 * 1000);
  const lastHour = now - (60 * 60 * 1000);

  // Filter recent metrics
  const recent24h = performanceMetrics.filter(m => m.timestamp >= last24Hours);
  const recent1h = performanceMetrics.filter(m => m.timestamp >= lastHour);

  const summary = {
    timestamp: now,
    totalMetrics: performanceMetrics.length,
    last24Hours: recent24h.length,
    lastHour: recent1h.length,
    coreWebVitals: {},
    customMetrics: {},
    trends: {},
    issues: []
  };

  // Summarize Core Web Vitals
  ['FCP', 'LCP', 'FID', 'CLS', 'TTFB', 'INP'].forEach(metricName => {
    const metrics = recent24h.filter(m => m.name === metricName);
    if (metrics.length > 0) {
      const values = metrics.map(m => m.value);
      const ratings = metrics.map(m => m.rating);
      
      summary.coreWebVitals[metricName] = {
        count: metrics.length,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        median: getMedian(values),
        p75: getPercentile(values, 75),
        p95: getPercentile(values, 95),
        ratings: {
          good: ratings.filter(r => r === 'good').length,
          needsImprovement: ratings.filter(r => r === 'needs-improvement').length,
          poor: ratings.filter(r => r === 'poor').length
        },
        latest: metrics[metrics.length - 1]
      };
    }
  });

  // Summarize custom metrics
  const customMetricNames = [...new Set(customMetrics.map(m => m.name))];
  customMetricNames.forEach(name => {
    const metrics = customMetrics.filter(m => m.name === name && m.timestamp >= last24Hours);
    if (metrics.length > 0) {
      const values = metrics.map(m => m.value);
      summary.customMetrics[name] = {
        count: metrics.length,
        average: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        latest: metrics[metrics.length - 1]
      };
    }
  });

  // Identify performance issues
  const poorMetrics = recent24h.filter(m => m.rating === 'poor');
  const needsImprovementMetrics = recent24h.filter(m => m.rating === 'needs-improvement');

  if (poorMetrics.length > 0) {
    summary.issues.push({
      severity: 'high',
      count: poorMetrics.length,
      message: `${poorMetrics.length} metrics with poor performance in last 24 hours`
    });
  }

  if (needsImprovementMetrics.length > 0) {
    summary.issues.push({
      severity: 'medium',
      count: needsImprovementMetrics.length,
      message: `${needsImprovementMetrics.length} metrics need improvement in last 24 hours`
    });
  }

  return summary;
}

/**
 * Calculate median value
 */
function getMedian(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Calculate percentile value
 */
function getPercentile(values: number[], percentile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}