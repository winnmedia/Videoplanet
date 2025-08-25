import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('');
  console.log('🎯 디자인 검증 완료 - 결과 정리 중...');
  console.log('─'.repeat(60));

  const fs = require('fs').promises;
  const path = require('path');

  try {
    // 개별 테스트 결과 파일들 수집
    const reportDir = './test-results/design-verification-report';
    const files = await fs.readdir(reportDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    console.log(`📊 ${jsonFiles.length}개 테스트 결과 파일 발견`);

    let totalVerifications = 0;
    let passedVerifications = 0;
    const categoryResults: Record<string, { passed: number; total: number }> = {};

    // 각 결과 파일 분석
    for (const jsonFile of jsonFiles) {
      const filePath = path.join(reportDir, jsonFile);
      const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
      
      const category = jsonFile.replace('-verification.json', '');
      const passed = data.filter((result: any) => result.valid).length;
      const total = data.length;

      categoryResults[category] = { passed, total };
      totalVerifications += total;
      passedVerifications += passed;

      console.log(`   ${category}: ${passed}/${total} (${(passed/total*100).toFixed(1)}%)`);
    }

    // 종합 결과 리포트 생성
    const overallScore = totalVerifications > 0 ? (passedVerifications / totalVerifications * 100) : 100;
    
    const summaryReport = {
      timestamp: new Date().toISOString(),
      totalVerifications,
      passedVerifications,
      failedVerifications: totalVerifications - passedVerifications,
      overallScore: parseFloat(overallScore.toFixed(2)),
      categoryBreakdown: categoryResults,
      status: overallScore >= 80 ? 'PASS' : overallScore >= 60 ? 'WARNING' : 'FAIL'
    };

    // 종합 리포트 저장
    const summaryPath = path.join(reportDir, 'design-verification-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summaryReport, null, 2));

    // 결과 출력
    console.log('─'.repeat(60));
    console.log('📋 디자인 검증 종합 결과:');
    console.log(`   전체 검증: ${totalVerifications}개`);
    console.log(`   통과: ${passedVerifications}개 (${overallScore.toFixed(1)}%)`);
    console.log(`   실패: ${totalVerifications - passedVerifications}개`);
    
    // 상태별 이모지와 메시지
    if (overallScore >= 90) {
      console.log('🎉 훌륭한 디자인 일관성을 달성했습니다!');
    } else if (overallScore >= 80) {
      console.log('✅ 양호한 디자인 일관성을 유지하고 있습니다.');
    } else if (overallScore >= 60) {
      console.log('⚠️ 디자인 일관성 개선이 필요합니다.');
    } else {
      console.log('❌ 디자인 일관성 문제가 다수 발견되었습니다.');
    }

    // 개선이 필요한 영역 표시
    const poorCategories = Object.entries(categoryResults)
      .filter(([, result]) => result.total > 0 && result.passed / result.total < 0.7)
      .map(([category]) => category);

    if (poorCategories.length > 0) {
      console.log('🔧 개선 필요 영역:');
      poorCategories.forEach(category => {
        const result = categoryResults[category];
        console.log(`   - ${category}: ${result.passed}/${result.total} (${(result.passed/result.total*100).toFixed(1)}%)`);
      });
    }

    // 리포트 파일 경로 안내
    console.log('─'.repeat(60));
    console.log('📁 상세 리포트 위치:');
    console.log(`   HTML 리포트: ${path.resolve(reportDir)}/index.html`);
    console.log(`   종합 JSON: ${path.resolve(summaryPath)}`);
    console.log('');

    // 추천 개선 사항
    if (overallScore < 80) {
      console.log('💡 권장 개선 사항:');
      if (categoryResults['brand-color-verification']?.passed / categoryResults['brand-color-verification']?.total < 0.8) {
        console.log('   - 브랜드 색상 일관성 개선: design-tokens.scss 활용 강화');
      }
      if (categoryResults['spacing-typography-verification']?.passed / categoryResults['spacing-typography-verification']?.total < 0.8) {
        console.log('   - 간격 및 타이포그래피 통일: CSS 변수 사용 확대');
      }
      if (categoryResults['responsive-design-verification']?.passed / categoryResults['responsive-design-verification']?.total < 0.8) {
        console.log('   - 반응형 디자인 최적화: 모바일 우선 접근법 적용');
      }
      console.log('');
    }

  } catch (error) {
    console.error('❌ 결과 정리 중 오류 발생:', error.message);
  }

  console.log('🎨 VideoPlanet 디자인 검증 시스템 종료');
}

export default globalTeardown;