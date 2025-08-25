/**
 * VideoPlanet Compatibility Reporter
 * 
 * Custom Playwright reporter for cross-browser compatibility analysis
 */

import { Reporter, TestCase, TestResult, FullConfig } from '@playwright/test/reporter';

interface CompatibilityStats {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  byBrowser: Record<string, { passed: number; failed: number; total: number }>;
}

class CompatibilityReporter implements Reporter {
  private stats: CompatibilityStats = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    byBrowser: {}
  };

  onBegin(config: FullConfig, suite: any) {
    console.log(`📊 VideoPlanet 호환성 테스트 시작 - ${config.projects.length}개 프로젝트`);
    console.log(`🌐 테스트 브라우저: ${config.projects.map(p => p.name).join(', ')}`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    this.stats.total++;
    
    const browserName = test.parent.project()?.name || 'unknown';
    
    if (!this.stats.byBrowser[browserName]) {
      this.stats.byBrowser[browserName] = { passed: 0, failed: 0, total: 0 };
    }
    
    this.stats.byBrowser[browserName].total++;
    
    if (result.status === 'passed') {
      this.stats.passed++;
      this.stats.byBrowser[browserName].passed++;
    } else if (result.status === 'failed') {
      this.stats.failed++;
      this.stats.byBrowser[browserName].failed++;
    } else {
      this.stats.skipped++;
    }
  }

  onEnd() {
    console.log('\n📋 VideoPlanet 호환성 테스트 결과');
    console.log('='.repeat(50));
    
    // Overall stats
    console.log(`총 테스트: ${this.stats.total}`);
    console.log(`✅ 통과: ${this.stats.passed}`);
    console.log(`❌ 실패: ${this.stats.failed}`);
    console.log(`⏭️ 건너뜀: ${this.stats.skipped}`);
    console.log(`📊 성공률: ${Math.round((this.stats.passed / this.stats.total) * 100)}%`);
    
    // Browser-specific stats
    console.log('\n🌐 브라우저별 호환성:');
    Object.entries(this.stats.byBrowser).forEach(([browser, stats]) => {
      const successRate = Math.round((stats.passed / stats.total) * 100);
      const icon = successRate >= 90 ? '✅' : successRate >= 70 ? '⚠️' : '❌';
      console.log(`${icon} ${browser}: ${stats.passed}/${stats.total} (${successRate}%)`);
    });
    
    // Compatibility warning
    const overallSuccessRate = Math.round((this.stats.passed / this.stats.total) * 100);
    if (overallSuccessRate < 80) {
      console.log('\n⚠️ 경고: 호환성 문제가 감지되었습니다!');
      console.log('   일부 브라우저에서 테스트 실패가 다수 발생했습니다.');
    } else if (overallSuccessRate >= 95) {
      console.log('\n🎉 훌륭합니다! 모든 브라우저에서 안정적으로 동작합니다.');
    }
    
    console.log('\n' + '='.repeat(50));
  }
}

export default CompatibilityReporter;