/**
 * AI 영상 기획 시스템 테스트 매트릭스
 * 
 * INSTRUCTION.md 요구사항에 따른 종합 테스트 전략:
 * - Unit Tests (70%): 순수 함수 및 컴포넌트 로직
 * - Integration Tests (20%): API 통합 및 상태 관리
 * - E2E Tests (10%): 전체 사용자 여정
 * 
 * @author Grace (QA Lead) - Test Pyramid Architecture Specialist
 */

export interface TestCase {
  id: string;
  category: 'unit' | 'integration' | 'e2e';
  feature: string;
  scenario: string;
  priority: 'high' | 'medium' | 'low';
  estimatedDurationMinutes: number;
  dependencies: string[];
  acceptanceCriteria: string[];
  mockRequirements: string[];
}

/**
 * AI 영상 기획 시스템 테스트 매트릭스
 * 총 48개 테스트 케이스, 예상 실행시간 240분
 */
export const AI_PLANNING_TEST_MATRIX: TestCase[] = [
  
  // ========================================
  // UNIT TESTS (70% - 34개 테스트)
  // ========================================
  
  // 1단계: 스토리 입력 (12개 테스트)
  {
    id: 'U001',
    category: 'unit',
    feature: '1단계-스토리입력',
    scenario: '필수 입력 필드 검증',
    priority: 'high',
    estimatedDurationMinutes: 3,
    dependencies: [],
    acceptanceCriteria: [
      '제목이 비어있으면 에러 메시지 표시',
      '한줄 스토리가 비어있으면 에러 메시지 표시',
      '분량이 선택되지 않으면 에러 메시지 표시',
      '포맷이 선택되지 않으면 에러 메시지 표시'
    ],
    mockRequirements: ['validation-service']
  },
  
  {
    id: 'U002',
    category: 'unit',
    feature: '1단계-스토리입력',
    scenario: '톤앤매너 멀티 선택 검증',
    priority: 'medium',
    estimatedDurationMinutes: 2,
    dependencies: [],
    acceptanceCriteria: [
      '최대 3개까지 선택 가능',
      '선택 해제 시 상태 업데이트',
      '선택된 항목 하이라이트 표시'
    ],
    mockRequirements: []
  },
  
  {
    id: 'U003',
    category: 'unit',
    feature: '1단계-스토리입력',
    scenario: '전개 방식별 파라미터 설정',
    priority: 'medium',
    estimatedDurationMinutes: 4,
    dependencies: [],
    acceptanceCriteria: [
      '훅-몰입-반전-떡밥 방식 파라미터 생성',
      '클래식 기승전결 방식 파라미터 생성',
      '귀납법/연역법 방식 파라미터 생성',
      '다큐멘터리 방식 파라미터 생성'
    ],
    mockRequirements: []
  },
  
  {
    id: 'U004',
    category: 'unit',
    feature: '1단계-스토리입력',
    scenario: '전개 강도별 콘텐츠 길이 계산',
    priority: 'medium',
    estimatedDurationMinutes: 3,
    dependencies: [],
    acceptanceCriteria: [
      '그대로: 기본 길이 유지',
      '적당히: 1.2배 확장',
      '풍부하게: 1.5배 확장'
    ],
    mockRequirements: []
  },

  {
    id: 'U005',
    category: 'unit',
    feature: '2단계-4단계검토',
    scenario: 'LLM 응답 JSON 파싱',
    priority: 'high',
    estimatedDurationMinutes: 5,
    dependencies: ['mock-llm-service'],
    acceptanceCriteria: [
      '유효한 JSON 응답 파싱 성공',
      '잘못된 JSON 에러 처리',
      '필수 필드 누락 감지',
      '타입 검증 (StoryStage[] 형태)'
    ],
    mockRequirements: ['llm-response-parser']
  },

  {
    id: 'U006',
    category: 'unit',
    feature: '2단계-4단계검토',
    scenario: '각 단계별 길이 힌트 계산',
    priority: 'medium',
    estimatedDurationMinutes: 3,
    dependencies: [],
    acceptanceCriteria: [
      '기(25%), 승(35%), 전(25%), 결(15%) 비율 적용',
      '60초 영상 기준 정확한 시간 분배',
      '90초 영상 기준 정확한 시간 분배'
    ],
    mockRequirements: []
  },

  {
    id: 'U007',
    category: 'unit',
    feature: '2단계-4단계검토',
    scenario: '인라인 편집 상태 관리',
    priority: 'high',
    estimatedDurationMinutes: 4,
    dependencies: [],
    acceptanceCriteria: [
      '편집 모드 진입/종료',
      '변경사항 임시 저장',
      '되돌리기 기능',
      '초기화 기능'
    ],
    mockRequirements: []
  },

  {
    id: 'U008',
    category: 'unit',
    feature: '3단계-12숏트분해',
    scenario: '4단계 → 12숏트 분배 알고리즘',
    priority: 'high',
    estimatedDurationMinutes: 6,
    dependencies: [],
    acceptanceCriteria: [
      '각 단계당 정확히 3개씩 숏트 생성',
      '총 12개 숏트 보장',
      '순서 보존 (기1,기2,기3,승1,승2,승3...)',
      'ID 자동 증가 (1~12)'
    ],
    mockRequirements: []
  },

  {
    id: 'U009',
    category: 'unit',
    feature: '3단계-12숏트분해',
    scenario: '템포별 숏트 길이 계산',
    priority: 'medium',
    estimatedDurationMinutes: 3,
    dependencies: [],
    acceptanceCriteria: [
      '빠르게: 4-6초',
      '보통: 6-8초',
      '느리게: 8-12초'
    ],
    mockRequirements: []
  },

  {
    id: 'U010',
    category: 'unit',
    feature: '3단계-12숏트분해',
    scenario: '카메라 워크 자동 할당',
    priority: 'low',
    estimatedDurationMinutes: 2,
    dependencies: [],
    acceptanceCriteria: [
      '템포에 따른 카메라 무브먼트 선택',
      '숏 타입별 적절한 구도 할당',
      '전환 효과 자동 설정'
    ],
    mockRequirements: []
  },

  {
    id: 'U011',
    category: 'unit',
    feature: '콘티생성',
    scenario: 'Google Images API 프롬프트 생성',
    priority: 'high',
    estimatedDurationMinutes: 4,
    dependencies: [],
    acceptanceCriteria: [
      '"storyboard pencil sketch, rough, monochrome" 스타일 포함',
      '네거티브 프롬프트 적용',
      '숏트 설명 기반 장면 묘사',
      '안전한 콘텐츠 필터링'
    ],
    mockRequirements: []
  },

  {
    id: 'U012',
    category: 'unit',
    feature: '콘티생성',
    scenario: '이미지 다운로드 링크 생성',
    priority: 'medium',
    estimatedDurationMinutes: 3,
    dependencies: [],
    acceptanceCriteria: [
      'PNG/JPEG 포맷 지원',
      '임시 URL 만료시간 설정',
      '파일명 자동 생성 (S01-conti-v1.png)',
      '재생성 시 버전 증가'
    ],
    mockRequirements: ['file-storage-service']
  },

  // 인서트샷 생성 (3개 테스트)
  {
    id: 'U013',
    category: 'unit',
    feature: '인서트샷생성',
    scenario: '3개 인서트샷 중복 방지',
    priority: 'high',
    estimatedDurationMinutes: 4,
    dependencies: [],
    acceptanceCriteria: [
      '정보보강, 리듬조절, 관계강조 목적 각각 1개씩',
      '동일 목적 중복 생성 방지',
      '본 숏과 의미적 연관성 검증'
    ],
    mockRequirements: ['llm-insert-generator']
  },

  {
    id: 'U014',
    category: 'unit',
    feature: '인서트샷생성',
    scenario: '프레이밍 자동 할당',
    priority: 'medium',
    estimatedDurationMinutes: 2,
    dependencies: [],
    acceptanceCriteria: [
      'Close-up, Medium Shot, Two Shot 등 적절한 프레이밍',
      '본 숏과 다른 프레이밍 선택',
      '목적에 맞는 프레이밍 매칭'
    ],
    mockRequirements: []
  },

  // PDF 생성 (4개 테스트)
  {
    id: 'U015',
    category: 'unit',
    feature: 'PDF생성',
    scenario: 'JSON → PDF 변환 로직',
    priority: 'high',
    estimatedDurationMinutes: 5,
    dependencies: [],
    acceptanceCriteria: [
      '메타데이터 → 표지 페이지',
      '4단계 → 개요 페이지',
      '12숏트 → 카드형 레이아웃',
      '여백 0 설정'
    ],
    mockRequirements: ['pdf-generator']
  },

  {
    id: 'U016',
    category: 'unit',
    feature: 'PDF생성',
    scenario: '여백 0 레이아웃 검증',
    priority: 'high',
    estimatedDurationMinutes: 4,
    dependencies: [],
    acceptanceCriteria: [
      '프린트 마진 0 설정',
      '페이지 꽉 찬 레이아웃',
      '모바일/데스크톱 PDF 뷰어 호환',
      '최소 폰트 크기 확보'
    ],
    mockRequirements: []
  },

  {
    id: 'U017',
    category: 'unit',
    feature: 'PDF생성',
    scenario: '다양한 콘텐츠 길이 대응',
    priority: 'medium',
    estimatedDurationMinutes: 3,
    dependencies: [],
    acceptanceCriteria: [
      '짧은 콘텐츠: 페이지 중앙 배치',
      '긴 콘텐츠: 자동 페이지 분할',
      '이미지 + 텍스트 균형 조정'
    ],
    mockRequirements: []
  },

  {
    id: 'U018',
    category: 'unit',
    feature: 'PDF생성',
    scenario: '콘티 이미지 임베딩',
    priority: 'medium',
    estimatedDurationMinutes: 4,
    dependencies: [],
    acceptanceCriteria: [
      '이미지 압축 및 최적화',
      '좌측 이미지, 우측 텍스트 레이아웃',
      '이미지 누락 시 플레이스홀더 표시'
    ],
    mockRequirements: ['image-processor']
  },

  // 에러 처리 및 예외상황 (8개 테스트)
  {
    id: 'U019',
    category: 'unit',
    feature: '에러처리',
    scenario: 'LLM API 실패 처리',
    priority: 'high',
    estimatedDurationMinutes: 3,
    dependencies: [],
    acceptanceCriteria: [
      '네트워크 에러 재시도 로직',
      '타임아웃 처리',
      '토큰 한도 초과 안내',
      '재시도 횟수 제한 (최대 3회)'
    ],
    mockRequirements: ['error-handler']
  },

  {
    id: 'U020',
    category: 'unit',
    feature: '에러처리',
    scenario: 'Google Images API 쿼터 초과',
    priority: 'high',
    estimatedDurationMinutes: 3,
    dependencies: [],
    acceptanceCriteria: [
      '쿼터 초과 감지',
      '대기시간 안내',
      '대체 프롬프트 제안',
      '재시도 스케줄링'
    ],
    mockRequirements: ['api-quota-manager']
  },

  {
    id: 'U021',
    category: 'unit',
    feature: '에러처리',
    scenario: '필수 입력 누락 검증',
    priority: 'medium',
    estimatedDurationMinutes: 2,
    dependencies: [],
    acceptanceCriteria: [
      '1단계에서 즉시 검증',
      '누락 필드 하이라이트',
      '진행 버튼 비활성화',
      '명확한 안내 메시지'
    ],
    mockRequirements: []
  },

  {
    id: 'U022',
    category: 'unit',
    feature: '에러처리',
    scenario: 'PDF 다운로드 실패',
    priority: 'medium',
    estimatedDurationMinutes: 3,
    dependencies: [],
    acceptanceCriteria: [
      '임시 링크 재발급',
      '로컬 저장 대안 안내',
      '다운로드 재시도 옵션',
      '에러 로그 수집'
    ],
    mockRequirements: []
  },

  // 자동저장 및 버전관리 (6개 테스트)
  {
    id: 'U023',
    category: 'unit',
    feature: '자동저장',
    scenario: '단계 전환 시 스냅샷 저장',
    priority: 'high',
    estimatedDurationMinutes: 4,
    dependencies: [],
    acceptanceCriteria: [
      '1→2단계 전환 시 자동 저장',
      '2→3단계 전환 시 자동 저장',
      '편집 완료 시 자동 저장',
      '타임스탬프 포함 저장'
    ],
    mockRequirements: ['local-storage']
  },

  {
    id: 'U024',
    category: 'unit',
    feature: '자동저장',
    scenario: '카드별 롤백 기능',
    priority: 'medium',
    estimatedDurationMinutes: 3,
    dependencies: [],
    acceptanceCriteria: [
      '기/승/전/결 각 단계별 롤백',
      '숏트별 개별 롤백',
      '인서트샷별 롤백',
      '원본 상태로 완전 복구'
    ],
    mockRequirements: []
  },

  {
    id: 'U025',
    category: 'unit',
    feature: '자동저장',
    scenario: '최근 작업 목록 관리',
    priority: 'low',
    estimatedDurationMinutes: 2,
    dependencies: [],
    acceptanceCriteria: [
      '최대 10개 작업 히스토리 유지',
      '작업명 + 수정시간 표시',
      '클릭 시 이전 저장본 복구',
      '로컬스토리지 용량 제한 관리'
    ],
    mockRequirements: []
  },

  {
    id: 'U026',
    category: 'unit',
    feature: '버전관리',
    scenario: '콘티 이미지 버전 라벨링',
    priority: 'medium',
    estimatedDurationMinutes: 3,
    dependencies: [],
    acceptanceCriteria: [
      'S01-conti-v1, S01-conti-v2... 형태',
      '재생성 시 버전 자동 증가',
      '이전 버전 접근 가능',
      '최대 5개 버전 보존'
    ],
    mockRequirements: []
  },

  // ========================================
  // INTEGRATION TESTS (20% - 10개 테스트)
  // ========================================

  {
    id: 'I001',
    category: 'integration',
    feature: 'AI-UI통합',
    scenario: 'LLM 호출 → 응답 파싱 → UI 업데이트',
    priority: 'high',
    estimatedDurationMinutes: 8,
    dependencies: ['mock-llm-service', 'react-query'],
    acceptanceCriteria: [
      'LLM API 호출 성공',
      '응답 데이터 Redux 저장',
      'UI 컴포넌트 리렌더링',
      '로딩 상태 표시'
    ],
    mockRequirements: ['llm-api-mock', 'redux-store']
  },

  {
    id: 'I002',
    category: 'integration',
    feature: 'AI-UI통합',
    scenario: 'Google API → 이미지 표시 → 다운로드',
    priority: 'high',
    estimatedDurationMinutes: 8,
    dependencies: ['mock-google-api', 'file-download'],
    acceptanceCriteria: [
      'Google Images API 호출 성공',
      '이미지 URL 프레임에 표시',
      '다운로드 버튼 활성화',
      '파일 다운로드 성공'
    ],
    mockRequirements: ['google-api-mock', 'file-service']
  },

  {
    id: 'I003',
    category: 'integration',
    feature: '상태관리통합',
    scenario: 'Redux Store 상태 변화 추적',
    priority: 'high',
    estimatedDurationMinutes: 6,
    dependencies: ['redux-toolkit'],
    acceptanceCriteria: [
      '위저드 단계별 상태 업데이트',
      '편집 상태 실시간 반영',
      '에러 상태 전역 관리',
      'DevTools 연동 확인'
    ],
    mockRequirements: []
  },

  {
    id: 'I004',
    category: 'integration',
    feature: '상태관리통합',
    scenario: '자동저장 및 복구 로직',
    priority: 'medium',
    estimatedDurationMinutes: 7,
    dependencies: ['local-storage', 'redux-persist'],
    acceptanceCriteria: [
      '편집 중 자동저장 트리거',
      '페이지 새로고침 후 복구',
      '브라우저 종료 후 복구',
      '저장 실패 시 경고 표시'
    ],
    mockRequirements: ['storage-mock']
  },

  {
    id: 'I005',
    category: 'integration',
    feature: '데이터플로우',
    scenario: '전체 데이터 플로우 검증 (입력→처리→출력)',
    priority: 'high',
    estimatedDurationMinutes: 10,
    dependencies: ['all-services'],
    acceptanceCriteria: [
      '사용자 입력 → LLM 생성',
      '4단계 → 12숏트 분해',
      '콘티 생성 → 이미지 표시',
      '최종 데이터 → PDF 출력'
    ],
    mockRequirements: ['full-pipeline-mock']
  },

  {
    id: 'I006',
    category: 'integration',
    feature: '실시간검증',
    scenario: '실시간 검증 시스템',
    priority: 'medium',
    estimatedDurationMinutes: 5,
    dependencies: ['validation-service'],
    acceptanceCriteria: [
      '입력 중 실시간 검증',
      '에러 메시지 즉시 표시',
      '유효성 상태 아이콘 업데이트',
      '진행 버튼 활성화/비활성화'
    ],
    mockRequirements: []
  },

  {
    id: 'I007',
    category: 'integration',
    feature: 'API통합',
    scenario: 'API 에러 처리 통합 플로우',
    priority: 'high',
    estimatedDurationMinutes: 7,
    dependencies: ['error-boundary'],
    acceptanceCriteria: [
      'LLM API 에러 → 재시도 → UI 피드백',
      'Google API 에러 → 대체 옵션 제공',
      'PDF 생성 에러 → 부분 저장',
      '전역 에러 바운더리 작동'
    ],
    mockRequirements: ['api-error-simulator']
  },

  {
    id: 'I008',
    category: 'integration',
    feature: '성능최적화',
    scenario: '대용량 데이터 처리 성능',
    priority: 'medium',
    estimatedDurationMinutes: 8,
    dependencies: [],
    acceptanceCriteria: [
      '12개 숏트 동시 생성 < 5초',
      '콘티 이미지 로딩 최적화',
      'PDF 생성 진행률 표시',
      '메모리 사용량 모니터링'
    ],
    mockRequirements: ['performance-monitor']
  },

  {
    id: 'I009',
    category: 'integration',
    feature: '캐싱시스템',
    scenario: 'API 응답 캐싱 및 재사용',
    priority: 'low',
    estimatedDurationMinutes: 6,
    dependencies: ['react-query'],
    acceptanceCriteria: [
      '동일 입력 해시 기반 캐싱',
      'LLM 응답 로컬 캐시 저장',
      '캐시 만료 시간 관리',
      '캐시 히트/미스 통계'
    ],
    mockRequirements: ['cache-mock']
  },

  {
    id: 'I010',
    category: 'integration',
    feature: '보안검증',
    scenario: 'API 키 보안 및 요청 검증',
    priority: 'high',
    estimatedDurationMinutes: 5,
    dependencies: ['security-service'],
    acceptanceCriteria: [
      'Google API 키 서버 보관 확인',
      '프론트엔드에 키 노출 방지',
      'API 요청 레이트 리밋',
      '악성 입력 필터링'
    ],
    mockRequirements: []
  },

  // ========================================
  // E2E TESTS (10% - 4개 테스트)
  // ========================================

  {
    id: 'E001',
    category: 'e2e',
    feature: '전체워크플로우',
    scenario: '완전한 사용자 여정 (입력→생성→편집→다운로드)',
    priority: 'high',
    estimatedDurationMinutes: 15,
    dependencies: ['playwright', 'all-mocks'],
    acceptanceCriteria: [
      '1단계: 모든 필드 입력 완료',
      '2단계: 4단계 생성 및 편집',
      '3단계: 12숏트 생성 및 콘티 생성',
      'PDF 다운로드 성공'
    ],
    mockRequirements: ['full-system-mock']
  },

  {
    id: 'E002',
    category: 'e2e',
    feature: '크로스브라우저',
    scenario: '크로스 브라우저 호환성 (Chrome/Firefox/Safari)',
    priority: 'medium',
    estimatedDurationMinutes: 20,
    dependencies: ['cross-browser-matrix'],
    acceptanceCriteria: [
      'Chrome: 모든 기능 정상 작동',
      'Firefox: 모든 기능 정상 작동',
      'Safari: 알려진 제약사항 내 작동',
      'Edge: 기본 기능 작동'
    ],
    mockRequirements: ['browser-specific-mocks']
  },

  {
    id: 'E003',
    category: 'e2e',
    feature: '성능검증',
    scenario: '성능 임계값 검증 (Core Web Vitals)',
    priority: 'medium',
    estimatedDurationMinutes: 12,
    dependencies: ['performance-monitoring'],
    acceptanceCriteria: [
      'LCP < 2.5s (페이지 로딩)',
      'FID < 100ms (상호작용)',
      'CLS < 0.1 (레이아웃 안정성)',
      'AI API 응답 시간 < 10초'
    ],
    mockRequirements: ['performance-mock']
  },

  {
    id: 'E004',
    category: 'e2e',
    feature: '접근성검증',
    scenario: '웹 접근성 (WCAG 2.1 AA) 준수',
    priority: 'low',
    estimatedDurationMinutes: 10,
    dependencies: ['axe-accessibility'],
    acceptanceCriteria: [
      '키보드 전용 내비게이션 가능',
      '스크린 리더 호환성',
      '색상 대비 4.5:1 이상',
      'ARIA 레이블 적절히 설정'
    ],
    mockRequirements: []
  }
];

/**
 * 테스트 매트릭스 통계
 */
export const TEST_MATRIX_STATS = {
  totalTests: AI_PLANNING_TEST_MATRIX.length,
  unitTests: AI_PLANNING_TEST_MATRIX.filter(t => t.category === 'unit').length,
  integrationTests: AI_PLANNING_TEST_MATRIX.filter(t => t.category === 'integration').length,
  e2eTests: AI_PLANNING_TEST_MATRIX.filter(t => t.category === 'e2e').length,
  estimatedTotalMinutes: AI_PLANNING_TEST_MATRIX.reduce((sum, t) => sum + t.estimatedDurationMinutes, 0),
  highPriorityTests: AI_PLANNING_TEST_MATRIX.filter(t => t.priority === 'high').length,
  mediumPriorityTests: AI_PLANNING_TEST_MATRIX.filter(t => t.priority === 'medium').length,
  lowPriorityTests: AI_PLANNING_TEST_MATRIX.filter(t => t.priority === 'low').length
};

/**
 * DoD (Definition of Done) 기준 검증용 테스트 케이스 필터
 */
export const DOD_CRITICAL_TESTS = AI_PLANNING_TEST_MATRIX.filter(test => 
  test.priority === 'high' && 
  ['U001', 'U005', 'U008', 'U013', 'U015', 'U019', 'I001', 'I002', 'I003', 'E001'].includes(test.id)
);

console.log('🧪 AI 영상 기획 시스템 테스트 매트릭스');
console.log(`📊 총 테스트: ${TEST_MATRIX_STATS.totalTests}개`);
console.log(`📊 Unit: ${TEST_MATRIX_STATS.unitTests}개 (${Math.round(TEST_MATRIX_STATS.unitTests/TEST_MATRIX_STATS.totalTests*100)}%)`);
console.log(`📊 Integration: ${TEST_MATRIX_STATS.integrationTests}개 (${Math.round(TEST_MATRIX_STATS.integrationTests/TEST_MATRIX_STATS.totalTests*100)}%)`);
console.log(`📊 E2E: ${TEST_MATRIX_STATS.e2eTests}개 (${Math.round(TEST_MATRIX_STATS.e2eTests/TEST_MATRIX_STATS.totalTests*100)}%)`);
console.log(`⏱️ 예상 실행시간: ${TEST_MATRIX_STATS.estimatedTotalMinutes}분`);
console.log(`🚨 DoD 필수 테스트: ${DOD_CRITICAL_TESTS.length}개`);