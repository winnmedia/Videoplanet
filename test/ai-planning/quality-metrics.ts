/**
 * AI 영상 기획 시스템 품질 메트릭 및 DoD 검증
 * 
 * INSTRUCTION.md 요구사항에 따른 품질 기준 자동 검증:
 * - DoD (Definition of Done) 8개 핵심 기준
 * - 성능 임계값 모니터링
 * - AI 품질 메트릭 평가
 * - 자동 품질 게이트 시스템
 * 
 * @author Grace (QA Lead) - Quality Metrics & DoD Automation
 */

import { test, expect, Page } from '@playwright/test';
import { 
  StoryMetadata, 
  StoryStage, 
  ShotDetails,
  LLMResponse 
} from './mock-llm-service';
import { 
  GoogleImageGenerationResponse 
} from './mock-google-images-api';
import { 
  PDFGenerationResponse,
  PDFQualityValidator 
} from './mock-pdf-generator';

// === DoD (Definition of Done) 기준 정의 ===

export interface DoDCriteria {
  id: string;
  name: string;
  description: string;
  category: 'functional' | 'performance' | 'quality' | 'ai-quality';
  priority: 'critical' | 'high' | 'medium';
  validator: (data: any) => Promise<DoDResult>;
}

export interface DoDResult {
  passed: boolean;
  score: number; // 0-100
  message: string;
  details?: any;
  recommendations?: string[];
}

export interface QualityGateReport {
  overallStatus: 'PASSED' | 'FAILED' | 'WARNING';
  overallScore: number; // 0-100
  totalCriteria: number;
  passedCriteria: number;
  failedCriteria: DoDResult[];
  warningCriteria: DoDResult[];
  executionTimeMs: number;
  timestamp: string;
}

// === INSTRUCTION.md 기반 DoD 기준 8개 ===

export const AI_PLANNING_DOD_CRITERIA: DoDCriteria[] = [
  
  // DOD-1: 4단계 스토리 생성 품질
  {
    id: 'DOD-001',
    name: '4단계 스토리 생성 품질',
    description: '1단계 입력 → 생성 시 4단계가 전개 방식·강도 규칙을 반영해 생성됨',
    category: 'ai-quality',
    priority: 'critical',
    validator: async (data: { metadata: StoryMetadata; stages: StoryStage[] }) => {
      const issues: string[] = [];
      let score = 100;

      // 4개 단계 생성 확인
      if (!data.stages || data.stages.length !== 4) {
        issues.push('4개 단계가 생성되지 않음');
        score -= 40;
      } else {
        // 기승전결 순서 확인
        const expectedStages = ['기', '승', '전', '결'];
        const actualStages = data.stages.map(s => s.stage);
        if (!expectedStages.every((stage, i) => actualStages[i] === stage)) {
          issues.push('기승전결 순서가 올바르지 않음');
          score -= 20;
        }

        // 전개 강도 반영 확인
        const intensity = data.metadata.developmentIntensity;
        const avgContentLength = data.stages.reduce((sum, s) => sum + s.content.length, 0) / 4;
        
        if (intensity === 'as-is' && avgContentLength > 100) {
          issues.push('그대로 강도에 비해 내용이 너무 풍부함');
          score -= 15;
        } else if (intensity === 'rich' && avgContentLength < 150) {
          issues.push('풍부하게 강도에 비해 내용이 부족함');
          score -= 15;
        }

        // 전개 방식 반영 확인
        if (data.metadata.developmentMethod.includes('기승전결')) {
          const hasKeyPoints = data.stages.every(s => s.keyPoints && s.keyPoints.length > 0);
          if (!hasKeyPoints) {
            issues.push('각 단계별 핵심 포인트가 누락됨');
            score -= 10;
          }
        }
      }

      return {
        passed: score >= 70,
        score,
        message: issues.length === 0 ? '4단계 생성 품질 양호' : issues.join(', '),
        details: { stages: data.stages?.length || 0, issues },
        recommendations: score < 70 ? ['LLM 프롬프트 개선', '전개 방식 규칙 재검토'] : []
      };
    }
  },

  // DOD-2: 단계별 편집 기능
  {
    id: 'DOD-002',
    name: '단계별 편집 기능',
    description: '2단계에서 각 단계 수정 가능, 내용이 3단계 분해에 반영됨',
    category: 'functional',
    priority: 'critical',
    validator: async (data: { editHistory: any[]; stages: StoryStage[]; shots: ShotDetails[] }) => {
      let score = 100;
      const issues: string[] = [];

      // 편집 이력 존재 확인
      if (!data.editHistory || data.editHistory.length === 0) {
        issues.push('편집 기능이 사용되지 않음 (테스트에서 편집 시도 필요)');
        score -= 30;
      } else {
        // 편집 내용이 숏트에 반영되었는지 확인
        const editedStageIds = data.editHistory.map(h => h.stageId);
        const affectedShots = data.shots.filter(shot => 
          editedStageIds.some(id => shot.description.includes(`단계${id}`))
        );

        if (affectedShots.length === 0) {
          issues.push('편집된 단계 내용이 숏트 분해에 반영되지 않음');
          score -= 25;
        }

        // 되돌리기 기능 테스트
        const hasRollback = data.editHistory.some(h => h.action === 'rollback');
        if (!hasRollback) {
          issues.push('되돌리기 기능이 테스트되지 않음');
          score -= 15;
        }
      }

      return {
        passed: score >= 70,
        score,
        message: issues.length === 0 ? '편집 기능 정상 작동' : issues.join(', '),
        details: { editCount: data.editHistory?.length || 0, issues },
        recommendations: score < 70 ? ['편집 플로우 테스트 강화', 'UI 피드백 개선'] : []
      };
    }
  },

  // DOD-3: 12개 숏트 정확 생성
  {
    id: 'DOD-003',
    name: '12개 숏트 정확 생성',
    description: '3단계에서 정확히 12개 숏트가 생성되고 편집 가능',
    category: 'functional',
    priority: 'critical',
    validator: async (data: { shots: ShotDetails[]; stages: StoryStage[] }) => {
      let score = 100;
      const issues: string[] = [];

      // 정확히 12개 숏트 확인
      if (!data.shots || data.shots.length !== 12) {
        issues.push(`12개가 아닌 ${data.shots?.length || 0}개 숏트 생성됨`);
        score -= 50;
      } else {
        // 각 단계당 3개씩 분배 확인
        const shotsPerStage = Math.floor(12 / 4); // 3개
        for (let stageIndex = 0; stageIndex < 4; stageIndex++) {
          const stageShots = data.shots.filter(shot => 
            Math.floor((shot.id - 1) / shotsPerStage) === stageIndex
          );
          if (stageShots.length !== shotsPerStage) {
            issues.push(`${stageIndex + 1}번째 단계에 ${stageShots.length}개 숏트 (예상: ${shotsPerStage}개)`);
            score -= 10;
          }
        }

        // ID 연속성 확인
        const sortedIds = data.shots.map(s => s.id).sort((a, b) => a - b);
        const expectedIds = Array.from({ length: 12 }, (_, i) => i + 1);
        if (!expectedIds.every((id, i) => sortedIds[i] === id)) {
          issues.push('숏트 ID가 1~12 연속으로 할당되지 않음');
          score -= 15;
        }

        // 필수 필드 존재 확인
        const requiredFields = ['title', 'description', 'shotType', 'camera', 'composition', 'duration'];
        const missingFields = data.shots.reduce((missing, shot) => {
          requiredFields.forEach(field => {
            if (!shot[field]) {
              missing.push(`Shot ${shot.id}: ${field} 누락`);
            }
          });
          return missing;
        }, []);

        if (missingFields.length > 0) {
          issues.push(`필수 필드 누락: ${missingFields.join(', ')}`);
          score -= Math.min(20, missingFields.length * 2);
        }
      }

      return {
        passed: score >= 80,
        score,
        message: issues.length === 0 ? '12개 숏트 생성 완료' : issues.join(', '),
        details: { shotCount: data.shots?.length || 0, issues },
        recommendations: score < 80 ? ['숏트 분해 로직 검토', '필수 필드 검증 강화'] : []
      };
    }
  },

  // DOD-4: 콘티 생성/재생성/다운로드
  {
    id: 'DOD-004',
    name: '콘티 생성/재생성/다운로드',
    description: '각 숏의 좌측 프레임에서 콘티 생성/재생성/다운로드가 정상 동작',
    category: 'functional',
    priority: 'high',
    validator: async (data: { contiOperations: any[]; shots: ShotDetails[] }) => {
      let score = 100;
      const issues: string[] = [];

      if (!data.contiOperations || data.contiOperations.length === 0) {
        issues.push('콘티 생성 작업이 수행되지 않음');
        score -= 40;
      } else {
        // 생성 작업 확인
        const generateOps = data.contiOperations.filter(op => op.type === 'generate');
        if (generateOps.length === 0) {
          issues.push('콘티 생성이 시도되지 않음');
          score -= 30;
        } else {
          // 성공률 확인 (80% 이상)
          const successfulGens = generateOps.filter(op => op.success);
          const successRate = successfulGens.length / generateOps.length;
          if (successRate < 0.8) {
            issues.push(`콘티 생성 성공률이 낮음: ${Math.round(successRate * 100)}%`);
            score -= 20;
          }
        }

        // 재생성 작업 확인
        const regenerateOps = data.contiOperations.filter(op => op.type === 'regenerate');
        if (regenerateOps.length === 0) {
          issues.push('콘티 재생성이 테스트되지 않음');
          score -= 15;
        } else {
          // 버전 관리 확인
          const hasVersioning = regenerateOps.some(op => op.version > 1);
          if (!hasVersioning) {
            issues.push('콘티 버전 관리가 작동하지 않음');
            score -= 10;
          }
        }

        // 다운로드 작업 확인
        const downloadOps = data.contiOperations.filter(op => op.type === 'download');
        if (downloadOps.length === 0) {
          issues.push('콘티 다운로드가 테스트되지 않음');
          score -= 10;
        }
      }

      return {
        passed: score >= 70,
        score,
        message: issues.length === 0 ? '콘티 기능 정상 작동' : issues.join(', '),
        details: { 
          operationCount: data.contiOperations?.length || 0,
          generateCount: data.contiOperations?.filter(op => op.type === 'generate').length || 0,
          issues 
        },
        recommendations: score < 70 ? ['Google API 안정성 개선', '에러 처리 강화', '사용자 피드백 개선'] : []
      };
    }
  },

  // DOD-5: 인서트샷 3개 중복 방지
  {
    id: 'DOD-005',
    name: '인서트샷 3개 중복 방지',
    description: '인서트 3컷 추천이 의미 중복 없이 제안됨',
    category: 'ai-quality',
    priority: 'medium',
    validator: async (data: { insertShots: any[]; shots: ShotDetails[] }) => {
      let score = 100;
      const issues: string[] = [];

      const shotsWithInserts = data.shots.filter(shot => shot.insertShots && shot.insertShots.length > 0);
      
      if (shotsWithInserts.length === 0) {
        issues.push('인서트샷이 생성되지 않음');
        score -= 50;
      } else {
        for (const shot of shotsWithInserts) {
          const inserts = shot.insertShots || [];
          
          // 정확히 3개 확인
          if (inserts.length !== 3) {
            issues.push(`Shot ${shot.id}: ${inserts.length}개 인서트샷 (예상: 3개)`);
            score -= 10;
          } else {
            // 목적 중복 확인
            const purposes = inserts.map(insert => insert.purpose);
            const uniquePurposes = [...new Set(purposes)];
            
            if (uniquePurposes.length !== 3) {
              issues.push(`Shot ${shot.id}: 인서트샷 목적 중복됨 (${purposes.join(', ')})`);
              score -= 15;
            }

            // 표준 목적 포함 확인
            const standardPurposes = ['정보 보강', '리듬 조절', '관계 강조'];
            const hasStandardPurposes = standardPurposes.every(purpose => 
              purposes.some(p => p.includes(purpose))
            );
            
            if (!hasStandardPurposes) {
              issues.push(`Shot ${shot.id}: 표준 인서트샷 목적 누락`);
              score -= 10;
            }
          }
        }
      }

      return {
        passed: score >= 70,
        score,
        message: issues.length === 0 ? '인서트샷 추천 품질 양호' : issues.join(', '),
        details: { 
          shotsWithInserts: shotsWithInserts.length,
          totalInserts: shotsWithInserts.reduce((sum, shot) => sum + (shot.insertShots?.length || 0), 0),
          issues 
        },
        recommendations: score < 70 ? ['인서트샷 생성 로직 개선', '목적 분류 체계 재검토'] : []
      };
    }
  },

  // DOD-6: PDF 여백 0 생성
  {
    id: 'DOD-006',
    name: 'PDF 여백 0 생성',
    description: '기획안 다운로드 시, 여백 0 페이지형 PDF로 생성되며 표지→4단계→12숏 카드 순으로 정렬',
    category: 'functional',
    priority: 'high',
    validator: async (data: { pdfResponse: PDFGenerationResponse }) => {
      if (!data.pdfResponse) {
        return {
          passed: false,
          score: 0,
          message: 'PDF 생성 응답이 없음',
          recommendations: ['PDF 생성 API 연결 확인']
        };
      }

      return PDFQualityValidator.validatePDFQuality(data.pdfResponse);
    }
  },

  // DOD-7: LLM 연속 일관성
  {
    id: 'DOD-007',
    name: 'LLM 연속 일관성',
    description: '전체 플로우에서 LLM이 연속적·일관되게 개입(용어·오브젝트 유지)',
    category: 'ai-quality',
    priority: 'high',
    validator: async (data: { llmResponses: LLMResponse<any>[]; metadata: StoryMetadata }) => {
      let score = 100;
      const issues: string[] = [];

      if (!data.llmResponses || data.llmResponses.length < 2) {
        issues.push('LLM 응답이 부족함 (최소 2개 필요)');
        score -= 40;
      } else {
        // 용어 일관성 확인
        const allContent = data.llmResponses
          .filter(response => response.success && response.data)
          .map(response => JSON.stringify(response.data))
          .join(' ');

        // 주요 키워드 일관성 체크
        const keyTerms = [
          data.metadata.title,
          ...data.metadata.toneAndManner,
          ...data.metadata.genre,
          data.metadata.target
        ];

        const inconsistentTerms = keyTerms.filter(term => {
          const occurrences = (allContent.match(new RegExp(term, 'gi')) || []).length;
          return occurrences < data.llmResponses.length * 0.5; // 50% 이상 등장해야 함
        });

        if (inconsistentTerms.length > 0) {
          issues.push(`용어 일관성 부족: ${inconsistentTerms.join(', ')}`);
          score -= 20;
        }

        // 톤앤매너 일관성 확인
        const toneWords = data.metadata.toneAndManner;
        const toneConsistency = toneWords.every(tone => 
          allContent.toLowerCase().includes(tone.toLowerCase()) ||
          allContent.includes(tone)
        );

        if (!toneConsistency) {
          issues.push('톤앤매너가 전체 콘텐츠에 일관되게 반영되지 않음');
          score -= 15;
        }

        // 응답 시간 일관성 확인
        const responseTimes = data.llmResponses.map(r => r.metadata?.processingTimeMs || 0);
        const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
        const maxVariation = Math.max(...responseTimes) - Math.min(...responseTimes);
        
        if (maxVariation > avgResponseTime * 2) {
          issues.push('LLM 응답 시간 편차가 큼 (성능 일관성 부족)');
          score -= 10;
        }
      }

      return {
        passed: score >= 70,
        score,
        message: issues.length === 0 ? 'LLM 일관성 양호' : issues.join(', '),
        details: { 
          responseCount: data.llmResponses?.length || 0,
          issues 
        },
        recommendations: score < 70 ? ['LLM 프롬프트 개선', '컨텍스트 관리 강화', 'API 성능 최적화'] : []
      };
    }
  },

  // DOD-8: 전체 워크플로우 성능
  {
    id: 'DOD-008',
    name: '전체 워크플로우 성능',
    description: '입력→4단계 생성→12숏트 분해→콘티 생성→PDF 출력 전체 과정이 5분 이내 완료',
    category: 'performance',
    priority: 'high',
    validator: async (data: { workflowTimeMs: number; stepTimes: any[] }) => {
      let score = 100;
      const issues: string[] = [];
      
      const maxTimeMs = 5 * 60 * 1000; // 5분
      const optimalTimeMs = 3 * 60 * 1000; // 3분 (최적)

      if (data.workflowTimeMs > maxTimeMs) {
        issues.push(`전체 워크플로우가 5분 초과: ${Math.round(data.workflowTimeMs / 1000)}초`);
        score -= 50;
      } else if (data.workflowTimeMs > optimalTimeMs) {
        issues.push(`전체 워크플로우가 3분 초과 (권장): ${Math.round(data.workflowTimeMs / 1000)}초`);
        score -= 20;
      }

      // 단계별 성능 확인
      if (data.stepTimes && data.stepTimes.length > 0) {
        data.stepTimes.forEach(step => {
          if (step.name === 'llm-4stages' && step.timeMs > 15000) {
            issues.push(`4단계 생성이 15초 초과: ${step.timeMs}ms`);
            score -= 10;
          }
          if (step.name === 'llm-12shots' && step.timeMs > 20000) {
            issues.push(`12숏트 분해가 20초 초과: ${step.timeMs}ms`);
            score -= 10;
          }
          if (step.name === 'conti-generation' && step.timeMs > 10000) {
            issues.push(`콘티 생성이 10초 초과: ${step.timeMs}ms`);
            score -= 10;
          }
          if (step.name === 'pdf-generation' && step.timeMs > 30000) {
            issues.push(`PDF 생성이 30초 초과: ${step.timeMs}ms`);
            score -= 15;
          }
        });
      }

      return {
        passed: score >= 70,
        score,
        message: issues.length === 0 ? `전체 워크플로우 ${Math.round(data.workflowTimeMs / 1000)}초 완료` : issues.join(', '),
        details: { 
          totalTimeSeconds: Math.round(data.workflowTimeMs / 1000),
          stepTimes: data.stepTimes,
          issues 
        },
        recommendations: score < 70 ? [
          'AI API 성능 최적화',
          '병렬 처리 도입',
          '캐싱 전략 적용',
          '프로그레시브 로딩 구현'
        ] : []
      };
    }
  }
];

/**
 * DoD 품질 게이트 실행기
 */
export class DoQualityGate {
  
  /**
   * 전체 DoD 기준 검증 실행
   */
  static async runQualityGate(testData: any): Promise<QualityGateReport> {
    const startTime = Date.now();
    const results: DoDResult[] = [];
    
    console.log('🚀 AI 영상 기획 시스템 품질 게이트 실행 시작...');
    
    // 각 DoD 기준 검증 실행
    for (const criteria of AI_PLANNING_DOD_CRITERIA) {
      try {
        console.log(`🔍 검증 중: ${criteria.name} (${criteria.id})`);
        const result = await criteria.validator(testData);
        results.push({
          ...result,
          criteriaId: criteria.id,
          criteriaName: criteria.name,
          priority: criteria.priority
        });
        
        const status = result.passed ? '✅' : '❌';
        console.log(`${status} ${criteria.id}: ${result.message} (점수: ${result.score})`);
        
      } catch (error) {
        console.error(`❌ ${criteria.id} 검증 중 오류:`, error);
        results.push({
          passed: false,
          score: 0,
          message: `검증 중 오류 발생: ${error.message}`,
          criteriaId: criteria.id,
          criteriaName: criteria.name,
          priority: criteria.priority
        });
      }
    }
    
    const executionTime = Date.now() - startTime;
    
    // 전체 결과 분석
    const passedResults = results.filter(r => r.passed);
    const failedResults = results.filter(r => !r.passed);
    const warningResults = results.filter(r => !r.passed && r.score >= 50); // 50점 이상이지만 실패한 경우
    
    const overallScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    
    // Critical 실패가 있으면 전체 실패
    const hasCriticalFailures = failedResults.some(r => r.priority === 'critical');
    const overallStatus = hasCriticalFailures ? 'FAILED' : 
                         failedResults.length > 0 ? 'WARNING' : 'PASSED';
    
    const report: QualityGateReport = {
      overallStatus,
      overallScore: Math.round(overallScore),
      totalCriteria: results.length,
      passedCriteria: passedResults.length,
      failedCriteria: failedResults,
      warningCriteria: warningResults,
      executionTimeMs: executionTime,
      timestamp: new Date().toISOString()
    };
    
    // 결과 출력
    console.log('\n📊 AI 영상 기획 시스템 품질 게이트 결과');
    console.log('═'.repeat(60));
    console.log(`🎯 전체 상태: ${overallStatus}`);
    console.log(`📈 전체 점수: ${report.overallScore}/100`);
    console.log(`✅ 통과: ${report.passedCriteria}/${report.totalCriteria}`);
    console.log(`❌ 실패: ${failedResults.length}/${report.totalCriteria}`);
    console.log(`⚠️  경고: ${warningResults.length}/${report.totalCriteria}`);
    console.log(`⏱️  실행시간: ${Math.round(executionTime / 1000)}초`);
    
    if (failedResults.length > 0) {
      console.log('\n❌ 실패한 기준:');
      failedResults.forEach(result => {
        console.log(`  • ${result.criteriaId}: ${result.message} (${result.score}점)`);
        if (result.recommendations && result.recommendations.length > 0) {
          console.log(`    권장사항: ${result.recommendations.join(', ')}`);
        }
      });
    }
    
    return report;
  }
  
  /**
   * 중요 기준만 빠른 검증
   */
  static async runCriticalChecks(testData: any): Promise<DoDResult[]> {
    const criticalCriteria = AI_PLANNING_DOD_CRITERIA.filter(c => c.priority === 'critical');
    const results: DoDResult[] = [];
    
    for (const criteria of criticalCriteria) {
      const result = await criteria.validator(testData);
      results.push(result);
    }
    
    return results;
  }
  
  /**
   * 개발 중 실시간 품질 체크
   */
  static async runDevelopmentChecks(testData: any): Promise<boolean> {
    const criticalResults = await this.runCriticalChecks(testData);
    const allPassed = criticalResults.every(r => r.passed);
    
    if (!allPassed) {
      console.log('⚠️ 개발 중 품질 체크 실패:');
      criticalResults.filter(r => !r.passed).forEach(result => {
        console.log(`  • ${result.message}`);
      });
    }
    
    return allPassed;
  }
}

/**
 * 성능 메트릭 수집기
 */
export class PerformanceMetrics {
  private metrics: Map<string, number> = new Map();
  private timestamps: Map<string, number> = new Map();
  
  startTimer(name: string): void {
    this.timestamps.set(name, Date.now());
  }
  
  endTimer(name: string): number {
    const startTime = this.timestamps.get(name);
    if (!startTime) {
      throw new Error(`Timer ${name} not found`);
    }
    
    const duration = Date.now() - startTime;
    this.metrics.set(name, duration);
    this.timestamps.delete(name);
    
    return duration;
  }
  
  getMetric(name: string): number | undefined {
    return this.metrics.get(name);
  }
  
  getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
  
  reset(): void {
    this.metrics.clear();
    this.timestamps.clear();
  }
}

/**
 * AI 품질 평가기
 */
export class AIQualityAssessment {
  
  /**
   * LLM 응답 품질 평가
   */
  static assessLLMResponseQuality(response: LLMResponse<any>, expectedCriteria: any): number {
    let score = 100;
    
    // 성공적 응답 확인
    if (!response.success) {
      return 0;
    }
    
    // 응답 시간 평가
    const responseTime = response.metadata?.processingTimeMs || 0;
    if (responseTime > 15000) {
      score -= 20; // 15초 초과 시 감점
    } else if (responseTime > 10000) {
      score -= 10; // 10초 초과 시 감점
    }
    
    // 토큰 사용량 평가
    const tokensUsed = response.metadata?.tokensUsed || 0;
    if (tokensUsed > 3000) {
      score -= 10; // 토큰 과다 사용 시 감점
    }
    
    // 내용 품질 평가 (간단한 휴리스틱)
    if (response.data) {
      const contentLength = JSON.stringify(response.data).length;
      if (contentLength < 100) {
        score -= 15; // 내용이 너무 적음
      }
    }
    
    return Math.max(0, score);
  }
  
  /**
   * 콘티 이미지 품질 평가
   */
  static assessContiImageQuality(response: GoogleImageGenerationResponse): number {
    let score = 100;
    
    if (!response.success) {
      return 0;
    }
    
    // 생성 시간 평가
    const generationTime = response.data?.metadata?.generationTimeMs || 0;
    if (generationTime > 10000) {
      score -= 15; // 10초 초과 시 감점
    }
    
    // 이미지 메타데이터 검증
    if (response.data?.metadata) {
      const { prompt, style, dimensions } = response.data.metadata;
      
      if (!prompt.includes('storyboard')) {
        score -= 10; // 스토리보드 스타일 미포함
      }
      
      if (!style.includes('pencil sketch')) {
        score -= 10; // 연필 스케치 스타일 미포함
      }
      
      if (dimensions.width < 400 || dimensions.height < 400) {
        score -= 5; // 해상도가 너무 낮음
      }
    }
    
    return Math.max(0, score);
  }
}

// 테스트에서 사용할 샘플 데이터
export const SAMPLE_QUALITY_DATA = {
  metadata: {
    title: '테스트 영상',
    oneLiner: '테스트 스토리',
    toneAndManner: ['따뜻한'],
    genre: ['드라마'],
    target: '테스트 사용자',
    duration: '60',
    format: 'vertical',
    tempo: 'normal',
    developmentMethod: '클래식 기승전결',
    developmentIntensity: 'moderate'
  },
  stages: [
    { stage: '기', title: 'Stage 1', content: 'Content 1', keyPoints: ['point1'] },
    { stage: '승', title: 'Stage 2', content: 'Content 2', keyPoints: ['point2'] },
    { stage: '전', title: 'Stage 3', content: 'Content 3', keyPoints: ['point3'] },
    { stage: '결', title: 'Stage 4', content: 'Content 4', keyPoints: ['point4'] }
  ],
  shots: Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    title: `Shot ${i + 1}`,
    description: `Description ${i + 1}`,
    shotType: 'Medium Shot',
    camera: 'Steady',
    composition: 'Rule of Thirds',
    duration: '5초',
    insertShots: [
      { purpose: '정보 보강', description: 'Insert 1', framing: 'Close-up' },
      { purpose: '리듬 조절', description: 'Insert 2', framing: 'Wide' },
      { purpose: '관계 강조', description: 'Insert 3', framing: 'Two Shot' }
    ]
  })),
  workflowTimeMs: 180000, // 3분
  stepTimes: [
    { name: 'llm-4stages', timeMs: 12000 },
    { name: 'llm-12shots', timeMs: 18000 },
    { name: 'conti-generation', timeMs: 8000 },
    { name: 'pdf-generation', timeMs: 25000 }
  ]
};

console.log('✅ AI 영상 기획 시스템 품질 메트릭 로드 완료');
console.log(`📋 DoD 기준: ${AI_PLANNING_DOD_CRITERIA.length}개`);
console.log(`🎯 Critical 기준: ${AI_PLANNING_DOD_CRITERIA.filter(c => c.priority === 'critical').length}개`);