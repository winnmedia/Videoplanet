/**
 * Performance Monitoring Alerts API
 * Handles performance alerts and notifications
 */

import { NextRequest, NextResponse } from 'next/server';

export interface PerformanceAlert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  url: string;
  userAgent?: string;
  resolved: boolean;
  resolvedAt?: number;
  notes?: string;
}

// In-memory storage for development (replace with database in production)
const alerts: PerformanceAlert[] = [];
let alertIdCounter = 1;

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validate alert data
    if (!data.type || !data.metric || typeof data.value !== 'number') {
      return NextResponse.json(
        { error: 'Invalid alert data' },
        { status: 400 }
      );
    }

    // Create new alert
    const alert: PerformanceAlert = {
      id: `alert_${alertIdCounter++}`,
      type: data.type,
      severity: data.severity || 'medium',
      metric: data.metric,
      value: data.value,
      threshold: data.threshold,
      timestamp: data.timestamp || Date.now(),
      url: data.url || '',
      userAgent: data.userAgent,
      resolved: false
    };

    alerts.push(alert);

    // Keep only last 500 alerts
    if (alerts.length > 500) {
      alerts.splice(0, alerts.length - 500);
    }

    console.log(`🚨 New Performance Alert: ${alert.metric} = ${alert.value} (threshold: ${alert.threshold})`);

    // Process alert based on severity
    await processAlert(alert);

    return NextResponse.json({ 
      status: 'success', 
      alertId: alert.id 
    });
    
  } catch (error) {
    console.error('Error processing performance alert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const resolved = searchParams.get('resolved');
    const limit = parseInt(searchParams.get('limit') || '50');
    const since = searchParams.get('since');

    let filteredAlerts = [...alerts];

    // Filter by severity
    if (severity) {
      filteredAlerts = filteredAlerts.filter(a => a.severity === severity);
    }

    // Filter by resolved status
    if (resolved !== null) {
      const isResolved = resolved === 'true';
      filteredAlerts = filteredAlerts.filter(a => a.resolved === isResolved);
    }

    // Filter by timestamp
    if (since) {
      const sinceTimestamp = parseInt(since);
      filteredAlerts = filteredAlerts.filter(a => a.timestamp >= sinceTimestamp);
    }

    // Sort by timestamp (newest first)
    filteredAlerts.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    const results = filteredAlerts.slice(0, limit);

    // Generate alert summary
    const summary = generateAlertSummary();

    return NextResponse.json({
      alerts: results,
      summary,
      total: filteredAlerts.length,
      showing: results.length
    });
    
  } catch (error) {
    console.error('Error retrieving performance alerts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('id');
    const data = await request.json();

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    const alert = alerts.find(a => a.id === alertId);
    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Update alert
    if (data.resolved !== undefined) {
      alert.resolved = data.resolved;
      if (data.resolved) {
        alert.resolvedAt = Date.now();
      } else {
        delete alert.resolvedAt;
      }
    }

    if (data.notes !== undefined) {
      alert.notes = data.notes;
    }

    return NextResponse.json({ 
      status: 'success', 
      alert 
    });
    
  } catch (error) {
    console.error('Error updating performance alert:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process alert based on severity and type
 */
async function processAlert(alert: PerformanceAlert): Promise<void> {
  try {
    // Log alert details
    const severityEmoji = {
      low: '📢',
      medium: '⚠️',
      high: '🚨',
      critical: '🔥'
    };

    console.log(`${severityEmoji[alert.severity]} ${alert.severity.toUpperCase()} Alert: ${alert.type}`);
    console.log(`   Metric: ${alert.metric} = ${alert.value}`);
    console.log(`   Threshold: ${alert.threshold}`);
    console.log(`   URL: ${alert.url}`);
    console.log(`   Time: ${new Date(alert.timestamp).toISOString()}`);

    // Handle different alert types
    switch (alert.type) {
      case 'performance_threshold_exceeded':
        await handlePerformanceThresholdAlert(alert);
        break;
      case 'core_web_vitals_degradation':
        await handleCoreWebVitalsAlert(alert);
        break;
      case 'resource_load_timeout':
        await handleResourceLoadAlert(alert);
        break;
      case 'api_response_slow':
        await handleAPIResponseAlert(alert);
        break;
      case 'memory_usage_high':
        await handleMemoryUsageAlert(alert);
        break;
      default:
        console.log(`   Unknown alert type: ${alert.type}`);
    }

    // Send notifications based on severity
    if (alert.severity === 'critical' || alert.severity === 'high') {
      await sendImmediateNotification(alert);
    } else if (alert.severity === 'medium') {
      await scheduleNotification(alert);
    }

  } catch (error) {
    console.error('Error processing alert:', error);
  }
}

/**
 * Handle performance threshold exceeded alerts
 */
async function handlePerformanceThresholdAlert(alert: PerformanceAlert): Promise<void> {
  // Check if this is a recurring issue
  const recentAlerts = alerts.filter(a => 
    a.metric === alert.metric &&
    a.timestamp > (Date.now() - 5 * 60 * 1000) && // Last 5 minutes
    a.id !== alert.id
  );

  if (recentAlerts.length >= 3) {
    // Escalate to critical if multiple occurrences
    alert.severity = 'critical';
    console.log(`🔥 ESCALATED TO CRITICAL: ${alert.metric} has exceeded threshold ${recentAlerts.length + 1} times in 5 minutes`);
  }
}

/**
 * Handle Core Web Vitals degradation alerts
 */
async function handleCoreWebVitalsAlert(alert: PerformanceAlert): Promise<void> {
  // Core Web Vitals are critical for SEO and user experience
  if (['LCP', 'FID', 'CLS'].includes(alert.metric)) {
    alert.severity = 'high';
    console.log(`🎯 Core Web Vital degradation detected: ${alert.metric}`);
  }
}

/**
 * Handle resource loading timeout alerts
 */
async function handleResourceLoadAlert(alert: PerformanceAlert): Promise<void> {
  console.log(`📦 Resource loading issue detected`);
  
  // Check if it's a critical resource (JavaScript, CSS)
  if (alert.url && (alert.url.includes('.js') || alert.url.includes('.css'))) {
    alert.severity = 'high';
  }
}

/**
 * Handle API response time alerts
 */
async function handleAPIResponseAlert(alert: PerformanceAlert): Promise<void> {
  console.log(`🌐 API response time issue detected`);
  
  // Check if it's a critical API endpoint
  const criticalEndpoints = ['/api/auth', '/api/projects', '/api/feedback'];
  const isCritical = criticalEndpoints.some(endpoint => alert.url?.includes(endpoint));
  
  if (isCritical) {
    alert.severity = 'high';
  }
}

/**
 * Handle memory usage alerts
 */
async function handleMemoryUsageAlert(alert: PerformanceAlert): Promise<void> {
  console.log(`🧠 Memory usage issue detected`);
  
  // High memory usage can lead to performance degradation
  if (alert.value > 100) { // MB
    alert.severity = 'high';
  }
}

/**
 * Send immediate notification for critical/high alerts
 */
async function sendImmediateNotification(alert: PerformanceAlert): Promise<void> {
  try {
    // In production, implement actual notification systems:
    // - Slack webhook
    // - Email notification
    // - SMS for critical alerts
    // - PagerDuty/OpsGenie integration
    
    console.log(`📧 IMMEDIATE NOTIFICATION: ${alert.severity} alert for ${alert.metric}`);
    
    // TODO: Implement notification channels
    // await sendSlackNotification(alert);
    // await sendEmailNotification(alert);
    
  } catch (error) {
    console.error('Failed to send immediate notification:', error);
  }
}

/**
 * Schedule notification for medium/low alerts
 */
async function scheduleNotification(alert: PerformanceAlert): Promise<void> {
  try {
    // Group medium alerts and send periodic summaries
    console.log(`📋 SCHEDULED NOTIFICATION: ${alert.severity} alert for ${alert.metric}`);
    
    // TODO: Implement scheduled notifications
    // - Daily digest emails
    // - Weekly performance reports
    // - Slack summary messages
    
  } catch (error) {
    console.error('Failed to schedule notification:', error);
  }
}

/**
 * Generate alert summary statistics
 */
function generateAlertSummary(): any {
  const now = Date.now();
  const last24Hours = now - (24 * 60 * 60 * 1000);
  const lastHour = now - (60 * 60 * 1000);

  const recent24h = alerts.filter(a => a.timestamp >= last24Hours);
  const recent1h = alerts.filter(a => a.timestamp >= lastHour);

  const summary = {
    total: alerts.length,
    last24Hours: recent24h.length,
    lastHour: recent1h.length,
    unresolved: alerts.filter(a => !a.resolved).length,
    bySeverity: {
      critical: alerts.filter(a => a.severity === 'critical' && !a.resolved).length,
      high: alerts.filter(a => a.severity === 'high' && !a.resolved).length,
      medium: alerts.filter(a => a.severity === 'medium' && !a.resolved).length,
      low: alerts.filter(a => a.severity === 'low' && !a.resolved).length
    },
    byType: {},
    topIssues: []
  };

  // Count by alert type
  const types = [...new Set(alerts.map(a => a.type))];
  types.forEach(type => {
    summary.byType[type] = recent24h.filter(a => a.type === type).length;
  });

  // Find top issues (most frequent)
  const metricCounts = {};
  recent24h.forEach(alert => {
    metricCounts[alert.metric] = (metricCounts[alert.metric] || 0) + 1;
  });

  summary.topIssues = Object.entries(metricCounts)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([metric, count]) => ({ metric, count }));

  return summary;
}