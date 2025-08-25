/**
 * Performance Regression Detection System
 * Automatically detects and alerts on performance degradations
 */

export interface PerformanceBaseline {
  id: string;
  name: string;
  timestamp: number;
  environment: 'development' | 'staging' | 'production';
  metrics: {
    coreWebVitals: {
      fcp: number;    // First Contentful Paint
      lcp: number;    // Largest Contentful Paint
      fid: number;    // First Input Delay
      cls: number;    // Cumulative Layout Shift
      ttfb: number;   // Time to First Byte
      inp?: number;   // Interaction to Next Paint
    };
    customMetrics: {
      videoInitTime?: number;
      apiResponseTime?: number;
      fileUploadTime?: number;
      websocketLatency?: number;
      dashboardLoadTime?: number;
    };
    loadMetrics: {
      concurrentUsers: number;
      requestsPerSecond: number;
      averageResponseTime: number;
      errorRate: number;
      memoryUsage?: number;
      cpuUsage?: number;
    };
  };
  testConditions: {
    userAgent: string;
    connectionType?: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    cacheEnabled: boolean;
  };
}

export interface RegressionAlert {
  id: string;
  type: 'regression' | 'improvement' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  metric: string;
  currentValue: number;
  baselineValue: number;
  changePercentage: number;
  threshold: number;
  timestamp: number;
  environment: string;
  description: string;
  recommendation?: string;
}

export interface RegressionDetectionConfig {
  // Thresholds for regression detection (percentage increase)
  regressionThresholds: {
    critical: number;    // 50% degradation
    high: number;        // 30% degradation
    medium: number;      // 20% degradation
    low: number;         // 10% degradation
  };
  
  // Minimum sample size for statistical significance
  minSampleSize: number;
  
  // Time window for comparison (in days)
  comparisonWindow: number;
  
  // Metrics to monitor for regression
  monitoredMetrics: string[];
  
  // Alert configuration
  alerting: {
    enabled: boolean;
    webhook?: string;
    email?: string[];
    slack?: string;
  };
}

export class PerformanceRegressionDetector {
  private config: RegressionDetectionConfig;
  private baselines: PerformanceBaseline[] = [];
  private alerts: RegressionAlert[] = [];

  constructor(config: Partial<RegressionDetectionConfig> = {}) {
    this.config = {
      regressionThresholds: {
        critical: 50,
        high: 30,
        medium: 20,
        low: 10
      },
      minSampleSize: 5,
      comparisonWindow: 7, // 7 days
      monitoredMetrics: [
        'fcp', 'lcp', 'fid', 'cls', 'ttfb', 'inp',
        'videoInitTime', 'apiResponseTime', 'fileUploadTime',
        'websocketLatency', 'dashboardLoadTime'
      ],
      alerting: {
        enabled: true
      },
      ...config
    };

    this.loadBaselines();
  }

  /**
   * Create a new performance baseline from current metrics
   */
  async createBaseline(
    name: string,
    environment: 'development' | 'staging' | 'production',
    metrics: PerformanceBaseline['metrics'],
    testConditions: PerformanceBaseline['testConditions']
  ): Promise<PerformanceBaseline> {
    const baseline: PerformanceBaseline = {
      id: `baseline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      timestamp: Date.now(),
      environment,
      metrics,
      testConditions
    };

    this.baselines.push(baseline);
    await this.saveBaselines();

    console.log(`📊 Performance baseline created: ${name} (${environment})`);
    return baseline;
  }

  /**
   * Analyze current metrics against baseline to detect regressions
   */
  async analyzeRegression(
    currentMetrics: PerformanceBaseline['metrics'],
    environment: 'development' | 'staging' | 'production' = 'production'
  ): Promise<RegressionAlert[]> {
    const relevantBaselines = this.getRelevantBaselines(environment);
    
    if (relevantBaselines.length === 0) {
      console.warn(`No baselines found for environment: ${environment}`);
      return [];
    }

    const alerts: RegressionAlert[] = [];

    // Analyze Core Web Vitals
    alerts.push(...this.analyzeCoreWebVitals(currentMetrics.coreWebVitals, relevantBaselines, environment));
    
    // Analyze custom metrics
    alerts.push(...this.analyzeCustomMetrics(currentMetrics.customMetrics, relevantBaselines, environment));
    
    // Analyze load metrics
    alerts.push(...this.analyzeLoadMetrics(currentMetrics.loadMetrics, relevantBaselines, environment));

    // Store alerts
    this.alerts.push(...alerts);
    await this.saveAlerts();

    // Send notifications for high/critical alerts
    const criticalAlerts = alerts.filter(alert => 
      alert.severity === 'critical' || alert.severity === 'high'
    );
    
    if (criticalAlerts.length > 0 && this.config.alerting.enabled) {
      await this.sendAlerts(criticalAlerts);
    }

    return alerts;
  }

  /**
   * Get relevant baselines for comparison
   */
  private getRelevantBaselines(environment: string): PerformanceBaseline[] {
    const cutoffTime = Date.now() - (this.config.comparisonWindow * 24 * 60 * 60 * 1000);
    
    return this.baselines
      .filter(baseline => 
        baseline.environment === environment && 
        baseline.timestamp >= cutoffTime
      )
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 10); // Take last 10 baselines
  }

  /**
   * Analyze Core Web Vitals for regressions
   */
  private analyzeCoreWebVitals(
    current: PerformanceBaseline['metrics']['coreWebVitals'],
    baselines: PerformanceBaseline[],
    environment: string
  ): RegressionAlert[] {
    const alerts: RegressionAlert[] = [];
    const metrics = ['fcp', 'lcp', 'fid', 'cls', 'ttfb', 'inp'] as const;

    metrics.forEach(metric => {
      if (current[metric] === undefined) return;

      const baselineValues = baselines
        .map(b => b.metrics.coreWebVitals[metric])
        .filter(v => v !== undefined) as number[];

      if (baselineValues.length < this.config.minSampleSize) return;

      const baselineAverage = baselineValues.reduce((sum, val) => sum + val, 0) / baselineValues.length;
      const currentValue = current[metric]!;
      const changePercentage = ((currentValue - baselineAverage) / baselineAverage) * 100;

      const alert = this.createRegressionAlert(
        metric,
        currentValue,
        baselineAverage,
        changePercentage,
        environment,
        this.getCoreWebVitalDescription(metric, changePercentage)
      );

      if (alert) {
        alerts.push(alert);
      }
    });

    return alerts;
  }

  /**
   * Analyze custom metrics for regressions
   */
  private analyzeCustomMetrics(
    current: PerformanceBaseline['metrics']['customMetrics'],
    baselines: PerformanceBaseline[],
    environment: string
  ): RegressionAlert[] {
    const alerts: RegressionAlert[] = [];
    const metrics = ['videoInitTime', 'apiResponseTime', 'fileUploadTime', 'websocketLatency', 'dashboardLoadTime'] as const;

    metrics.forEach(metric => {
      if (current[metric] === undefined) return;

      const baselineValues = baselines
        .map(b => b.metrics.customMetrics[metric])
        .filter(v => v !== undefined) as number[];

      if (baselineValues.length < this.config.minSampleSize) return;

      const baselineAverage = baselineValues.reduce((sum, val) => sum + val, 0) / baselineValues.length;
      const currentValue = current[metric]!;
      const changePercentage = ((currentValue - baselineAverage) / baselineAverage) * 100;

      const alert = this.createRegressionAlert(
        metric,
        currentValue,
        baselineAverage,
        changePercentage,
        environment,
        this.getCustomMetricDescription(metric, changePercentage)
      );

      if (alert) {
        alerts.push(alert);
      }
    });

    return alerts;
  }

  /**
   * Analyze load metrics for regressions
   */
  private analyzeLoadMetrics(
    current: PerformanceBaseline['metrics']['loadMetrics'],
    baselines: PerformanceBaseline[],
    environment: string
  ): RegressionAlert[] {
    const alerts: RegressionAlert[] = [];

    // Analyze error rate increase
    const errorRates = baselines.map(b => b.metrics.loadMetrics.errorRate);
    if (errorRates.length >= this.config.minSampleSize) {
      const baselineErrorRate = errorRates.reduce((sum, val) => sum + val, 0) / errorRates.length;
      const errorRateChange = ((current.errorRate - baselineErrorRate) / Math.max(baselineErrorRate, 0.001)) * 100;

      if (errorRateChange > this.config.regressionThresholds.low) {
        const alert = this.createRegressionAlert(
          'errorRate',
          current.errorRate,
          baselineErrorRate,
          errorRateChange,
          environment,
          `Error rate increased by ${errorRateChange.toFixed(1)}%`
        );

        if (alert) {
          alerts.push(alert);
        }
      }
    }

    // Analyze response time increase
    const responseTimes = baselines.map(b => b.metrics.loadMetrics.averageResponseTime);
    if (responseTimes.length >= this.config.minSampleSize) {
      const baselineResponseTime = responseTimes.reduce((sum, val) => sum + val, 0) / responseTimes.length;
      const responseTimeChange = ((current.averageResponseTime - baselineResponseTime) / baselineResponseTime) * 100;

      const alert = this.createRegressionAlert(
        'averageResponseTime',
        current.averageResponseTime,
        baselineResponseTime,
        responseTimeChange,
        environment,
        `Average response time changed by ${responseTimeChange.toFixed(1)}%`
      );

      if (alert) {
        alerts.push(alert);
      }
    }

    return alerts;
  }

  /**
   * Create regression alert if thresholds are exceeded
   */
  private createRegressionAlert(
    metric: string,
    currentValue: number,
    baselineValue: number,
    changePercentage: number,
    environment: string,
    description: string
  ): RegressionAlert | null {
    let severity: RegressionAlert['severity'] | null = null;
    let type: RegressionAlert['type'] = 'regression';

    // Determine severity based on change percentage
    if (Math.abs(changePercentage) >= this.config.regressionThresholds.critical) {
      severity = 'critical';
    } else if (Math.abs(changePercentage) >= this.config.regressionThresholds.high) {
      severity = 'high';
    } else if (Math.abs(changePercentage) >= this.config.regressionThresholds.medium) {
      severity = 'medium';
    } else if (Math.abs(changePercentage) >= this.config.regressionThresholds.low) {
      severity = 'low';
    }

    // Determine type (regression vs improvement)
    if (changePercentage < -this.config.regressionThresholds.low) {
      type = 'improvement';
      severity = null; // Don't alert on improvements
    }

    if (!severity) return null;

    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      metric,
      currentValue,
      baselineValue,
      changePercentage,
      threshold: this.getThresholdForSeverity(severity),
      timestamp: Date.now(),
      environment,
      description,
      recommendation: this.getRecommendation(metric, changePercentage)
    };
  }

  /**
   * Get threshold value for severity level
   */
  private getThresholdForSeverity(severity: RegressionAlert['severity']): number {
    return this.config.regressionThresholds[severity];
  }

  /**
   * Get Core Web Vital description
   */
  private getCoreWebVitalDescription(metric: string, changePercentage: number): string {
    const metricNames = {
      fcp: 'First Contentful Paint',
      lcp: 'Largest Contentful Paint',
      fid: 'First Input Delay',
      cls: 'Cumulative Layout Shift',
      ttfb: 'Time to First Byte',
      inp: 'Interaction to Next Paint'
    };

    const name = metricNames[metric as keyof typeof metricNames] || metric;
    return `${name} ${changePercentage > 0 ? 'increased' : 'decreased'} by ${Math.abs(changePercentage).toFixed(1)}%`;
  }

  /**
   * Get custom metric description
   */
  private getCustomMetricDescription(metric: string, changePercentage: number): string {
    const metricNames = {
      videoInitTime: 'Video initialization time',
      apiResponseTime: 'API response time',
      fileUploadTime: 'File upload time',
      websocketLatency: 'WebSocket latency',
      dashboardLoadTime: 'Dashboard load time'
    };

    const name = metricNames[metric as keyof typeof metricNames] || metric;
    return `${name} ${changePercentage > 0 ? 'increased' : 'decreased'} by ${Math.abs(changePercentage).toFixed(1)}%`;
  }

  /**
   * Get recommendation for performance improvement
   */
  private getRecommendation(metric: string, changePercentage: number): string {
    const recommendations = {
      fcp: 'Optimize critical resource loading, reduce render-blocking resources',
      lcp: 'Optimize largest element loading, use image optimization and CDN',
      fid: 'Reduce JavaScript execution time, implement code splitting',
      cls: 'Ensure proper sizing for images and elements, avoid dynamic content injection',
      ttfb: 'Optimize server response time, implement caching strategies',
      inp: 'Optimize event handlers, reduce JavaScript execution time',
      videoInitTime: 'Optimize video loading, implement progressive loading',
      apiResponseTime: 'Optimize database queries, implement API caching',
      fileUploadTime: 'Implement chunked uploads, optimize file processing',
      websocketLatency: 'Optimize server configuration, check network connectivity',
      dashboardLoadTime: 'Implement lazy loading, optimize data fetching',
      errorRate: 'Review error logs, improve error handling and retry logic',
      averageResponseTime: 'Scale infrastructure, optimize critical paths'
    };

    return recommendations[metric as keyof typeof recommendations] || 'Review performance optimizations for this metric';
  }

  /**
   * Send alerts to configured notification channels
   */
  private async sendAlerts(alerts: RegressionAlert[]): Promise<void> {
    console.log(`🚨 Sending ${alerts.length} performance alerts`);

    for (const alert of alerts) {
      try {
        // Send to webhook
        if (this.config.alerting.webhook) {
          await this.sendWebhookAlert(alert);
        }

        // Send to Slack
        if (this.config.alerting.slack) {
          await this.sendSlackAlert(alert);
        }

        // Send email notifications
        if (this.config.alerting.email && this.config.alerting.email.length > 0) {
          await this.sendEmailAlert(alert);
        }

        console.log(`📧 Alert sent: ${alert.metric} (${alert.severity})`);
      } catch (error) {
        console.error(`Failed to send alert for ${alert.metric}:`, error);
      }
    }
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(alert: RegressionAlert): Promise<void> {
    if (!this.config.alerting.webhook) return;

    await fetch(this.config.alerting.webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'performance_regression',
        alert,
        timestamp: Date.now()
      })
    });
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(alert: RegressionAlert): Promise<void> {
    if (!this.config.alerting.slack) return;

    const severityEmoji = {
      low: '📢',
      medium: '⚠️',
      high: '🚨',
      critical: '🔥'
    };

    const message = {
      text: `${severityEmoji[alert.severity]} Performance Regression Detected`,
      attachments: [
        {
          color: alert.severity === 'critical' || alert.severity === 'high' ? 'danger' : 'warning',
          fields: [
            {
              title: 'Metric',
              value: alert.metric,
              short: true
            },
            {
              title: 'Change',
              value: `${alert.changePercentage > 0 ? '+' : ''}${alert.changePercentage.toFixed(1)}%`,
              short: true
            },
            {
              title: 'Current Value',
              value: alert.currentValue.toFixed(2),
              short: true
            },
            {
              title: 'Baseline',
              value: alert.baselineValue.toFixed(2),
              short: true
            },
            {
              title: 'Environment',
              value: alert.environment,
              short: true
            },
            {
              title: 'Severity',
              value: alert.severity.toUpperCase(),
              short: true
            }
          ],
          footer: 'VideoPlanet Performance Monitor',
          ts: Math.floor(alert.timestamp / 1000)
        }
      ]
    };

    await fetch(this.config.alerting.slack, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message)
    });
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(alert: RegressionAlert): Promise<void> {
    // This would integrate with your email service (SendGrid, SES, etc.)
    console.log(`📧 Would send email alert for ${alert.metric} to:`, this.config.alerting.email);
  }

  /**
   * Load baselines from storage
   */
  private async loadBaselines(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('performance_baselines');
        if (stored) {
          this.baselines = JSON.parse(stored);
        }
      }
    } catch (error) {
      console.warn('Failed to load baselines:', error);
    }
  }

  /**
   * Save baselines to storage
   */
  private async saveBaselines(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('performance_baselines', JSON.stringify(this.baselines));
      }
    } catch (error) {
      console.warn('Failed to save baselines:', error);
    }
  }

  /**
   * Save alerts to storage
   */
  private async saveAlerts(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        // Keep only last 100 alerts
        const recentAlerts = this.alerts.slice(-100);
        localStorage.setItem('performance_alerts', JSON.stringify(recentAlerts));
      }
    } catch (error) {
      console.warn('Failed to save alerts:', error);
    }
  }

  /**
   * Get all baselines
   */
  public getBaselines(): PerformanceBaseline[] {
    return [...this.baselines];
  }

  /**
   * Get all alerts
   */
  public getAlerts(): RegressionAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear all baselines
   */
  public clearBaselines(): void {
    this.baselines = [];
    this.saveBaselines();
  }

  /**
   * Clear all alerts
   */
  public clearAlerts(): void {
    this.alerts = [];
    this.saveAlerts();
  }
}

// Export singleton instance
export const regressionDetector = new PerformanceRegressionDetector();