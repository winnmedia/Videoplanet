import { FullConfig, FullResult, Reporter, Suite, TestCase, TestResult } from '@playwright/test/reporter';

/**
 * VideoPlanet 디자인 검증 전용 커스텀 리포터
 * 
 * 기능:
 * 1. 실시간 검증 진행 상황 표시
 * 2. 카테고리별 결과 요약
 * 3. 실패한 검증의 상세 정보 제공
 * 4. CI/CD 파이프라인용 JSON 출력
 */

class DesignVerificationReporter implements Reporter {
  private startTime: number = 0;
  private testResults: Array<{
    test: string;
    category: string;
    duration: number;
    status: 'passed' | 'failed' | 'skipped';
    error?: string;
  }> = [];

  onBegin(config: FullConfig, suite: Suite) {
    this.startTime = Date.now();
    console.log('');
    console.log('🎨 VideoPlanet 디자인 검증 시작');
    console.log('═'.repeat(80));
    console.log('');
  }

  onTestBegin(test: TestCase) {
    // 테스트 시작 시 실시간 피드백
    const category = this.getCategoryFromTest(test);
    const shortTitle = test.title.substring(0, 60);
    
    process.stdout.write(`🔍 [${category}] ${shortTitle}...`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const category = this.getCategoryFromTest(test);
    const duration = result.duration;
    const status = result.status;

    // 결과 저장
    this.testResults.push({
      test: test.title,
      category,
      duration,
      status,
      error: result.error?.message
    });

    // 실시간 결과 표시
    if (status === 'passed') {
      console.log(` ✅ (${duration}ms)`);
    } else if (status === 'failed') {
      console.log(` ❌ (${duration}ms)`);
      if (result.error?.message) {
        const errorLine = result.error.message.split('\n')[0];
        console.log(`    └─ ${errorLine.substring(0, 100)}`);
      }
    } else if (status === 'skipped') {
      console.log(` ⏭️ (건너뜀)`);
    }
  }

  onEnd(result: FullResult) {
    const totalDuration = Date.now() - this.startTime;
    
    console.log('');
    console.log('═'.repeat(80));
    console.log('📊 디자인 검증 결과 요약');
    console.log('═'.repeat(80));
    
    // 카테고리별 결과 요약
    const categoryStats = this.getCategoryStats();
    
    for (const [category, stats] of Object.entries(categoryStats)) {
      const passRate = stats.total > 0 ? (stats.passed / stats.total * 100) : 100;
      const statusIcon = passRate >= 90 ? '🎉' : passRate >= 80 ? '✅' : passRate >= 60 ? '⚠️' : '❌';
      
      console.log(`${statusIcon} ${this.getCategoryDisplayName(category)}`);
      console.log(`   통과: ${stats.passed}/${stats.total} (${passRate.toFixed(1)}%)`);
      console.log(`   평균 시간: ${(stats.totalDuration / stats.total).toFixed(0)}ms`);
      console.log('');
    }

    // 전체 통계
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(t => t.status === 'passed').length;
    const failedTests = this.testResults.filter(t => t.status === 'failed').length;
    const skippedTests = this.testResults.filter(t => t.status === 'skipped').length;
    const overallPassRate = totalTests > 0 ? (passedTests / totalTests * 100) : 100;

    console.log('📋 전체 결과');
    console.log(`   전체 테스트: ${totalTests}개`);
    console.log(`   통과: ${passedTests}개 (${overallPassRate.toFixed(1)}%)`);
    console.log(`   실패: ${failedTests}개`);
    console.log(`   건너뜀: ${skippedTests}개`);
    console.log(`   총 소요 시간: ${(totalDuration / 1000).toFixed(1)}초`);
    console.log('');

    // 실패한 테스트 상세 정보
    const failedTestsDetails = this.testResults.filter(t => t.status === 'failed');
    if (failedTestsDetails.length > 0) {
      console.log('❌ 실패한 검증 항목들:');
      console.log('─'.repeat(80));
      
      failedTestsDetails.slice(0, 10).forEach((failedTest, index) => {
        console.log(`${index + 1}. [${failedTest.category}] ${failedTest.test}`);
        if (failedTest.error) {
          console.log(`   오류: ${failedTest.error.split('\n')[0]}`);
        }
        console.log('');
      });

      if (failedTestsDetails.length > 10) {
        console.log(`   ... 외 ${failedTestsDetails.length - 10}개 더`);
        console.log('');
      }
    }

    // 권장 사항 출력
    this.printRecommendations(categoryStats);

    // CI/CD를 위한 JSON 결과 저장
    this.saveJSONResults(result);

    console.log('═'.repeat(80));
    console.log('🎨 디자인 검증 완료');
    console.log('');
  }

  private getCategoryFromTest(test: TestCase): string {
    const file = test.location.file;
    
    if (file.includes('brand-color')) return 'brand-colors';
    if (file.includes('spacing-typography')) return 'spacing-typography';
    if (file.includes('responsive-design')) return 'responsive-design';
    if (file.includes('accessibility')) return 'accessibility';
    if (file.includes('performance-impact')) return 'performance';
    if (file.includes('ui-consistency')) return 'ui-consistency';
    
    return 'general';
  }

  private getCategoryDisplayName(category: string): string {
    const names: Record<string, string> = {
      'brand-colors': '브랜드 색상 일관성',
      'spacing-typography': '간격 및 타이포그래피',
      'responsive-design': '반응형 디자인',
      'accessibility': '접근성 준수',
      'performance': '성능 영향',
      'ui-consistency': 'UI 일관성',
      'general': '일반 검증'
    };
    
    return names[category] || category;
  }

  private getCategoryStats() {
    const stats: Record<string, { passed: number; total: number; totalDuration: number }> = {};
    
    for (const result of this.testResults) {
      if (!stats[result.category]) {
        stats[result.category] = { passed: 0, total: 0, totalDuration: 0 };
      }
      
      stats[result.category].total++;
      stats[result.category].totalDuration += result.duration;
      
      if (result.status === 'passed') {
        stats[result.category].passed++;
      }
    }
    
    return stats;
  }

  private printRecommendations(categoryStats: ReturnType<typeof this.getCategoryStats>) {
    console.log('💡 개선 권장 사항:');
    console.log('─'.repeat(80));

    let hasRecommendations = false;

    for (const [category, stats] of Object.entries(categoryStats)) {
      const passRate = stats.total > 0 ? (stats.passed / stats.total * 100) : 100;
      
      if (passRate < 80) {
        hasRecommendations = true;
        
        switch (category) {
          case 'brand-colors':
            console.log('🎨 브랜드 색상:');
            console.log('   - design-tokens.scss 파일의 CSS 변수를 더 적극적으로 활용하세요');
            console.log('   - 하드코딩된 색상값을 브랜드 토큰으로 교체하세요');
            break;
            
          case 'spacing-typography':
            console.log('📏 간격 및 타이포그래피:');
            console.log('   - 일관된 간격 시스템($spacing-*) 사용을 확대하세요');
            console.log('   - 폰트 크기 토큰($font-size-*) 활용을 늘리세요');
            break;
            
          case 'responsive-design':
            console.log('📱 반응형 디자인:');
            console.log('   - 모바일 우선 접근법을 더 철저히 적용하세요');
            console.log('   - 터치 친화적인 인터페이스 크기를 확보하세요');
            break;
            
          case 'accessibility':
            console.log('♿ 접근성:');
            console.log('   - ARIA 라벨 및 의미있는 대체 텍스트를 추가하세요');
            console.log('   - 색상 대비율을 4.5:1 이상으로 개선하세요');
            break;
            
          case 'performance':
            console.log('🚀 성능:');
            console.log('   - 이미지 최적화 (WebP, 적정 크기) 를 진행하세요');
            console.log('   - CSS 애니메이션 최적화를 통해 60fps를 달성하세요');
            break;
            
          case 'ui-consistency':
            console.log('🎯 UI 일관성:');
            console.log('   - 컴포넌트 기반 디자인 시스템을 강화하세요');
            console.log('   - 페이지간 동일 요소의 스타일을 통일하세요');
            break;
        }
        console.log('');
      }
    }

    if (!hasRecommendations) {
      console.log('🎉 모든 영역에서 우수한 디자인 일관성을 달성했습니다!');
      console.log('');
    }
  }

  private async saveJSONResults(result: FullResult) {
    try {
      const fs = require('fs').promises;
      const path = require('path');
      
      const jsonResult = {
        timestamp: new Date().toISOString(),
        status: result.status,
        totalTests: this.testResults.length,
        passed: this.testResults.filter(t => t.status === 'passed').length,
        failed: this.testResults.filter(t => t.status === 'failed').length,
        skipped: this.testResults.filter(t => t.status === 'skipped').length,
        duration: Date.now() - this.startTime,
        categories: this.getCategoryStats(),
        failedTests: this.testResults
          .filter(t => t.status === 'failed')
          .map(t => ({
            test: t.test,
            category: t.category,
            error: t.error
          }))
      };

      const reportPath = './test-results/design-verification-report/reporter-summary.json';
      await fs.writeFile(reportPath, JSON.stringify(jsonResult, null, 2));
      
      console.log(`💾 CI/CD용 결과 파일 저장: ${path.resolve(reportPath)}`);
      
    } catch (error) {
      console.warn('⚠️ JSON 결과 저장 실패:', error.message);
    }
  }
}

export default DesignVerificationReporter;