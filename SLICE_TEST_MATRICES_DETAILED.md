# VideoPlanet 슬라이스 테스트 매트릭스
## 단위/통합 테스트 상세 설계서

### 🎯 테스트 피라미드 분배 전략

```
                    /\
                   /  \     E2E Tests (5%)
                  /____\    Critical user journeys only
                 /      \
                /        \   Integration Tests (25%)
               /          \  API, WebSocket, DB integration  
              /____________\ 
             /              \
            /                \ Unit Tests (70%)
           /                  \ Component, utility, business logic
          /____________________\
```

### 📊 테스트 매트릭스 개요

## 1. 대시보드 기능 테스트 매트릭스

### A. 피드백 알림 시스템

#### 단위 테스트 (Unit Tests)
```yaml
컴포넌트_테스트:
  FeedbackNotifications.test.tsx: ✅ 완료 (16 cases)
    - 알림 목록 렌더링 (3 cases)
    - 우선순위별 아이콘 표시 (3 cases)
    - 읽음 상태 토글 (4 cases)
    - 필터링 기능 (3 cases)
    - 애니메이션 효과 (2 cases)
    - 접근성 속성 (1 case)

유틸리티_테스트:
  src/shared/lib/notifications/utils.test.ts: 필요
    - formatNotificationTime()
    - calculatePriority()
    - groupNotificationsByDate()
    - sortNotificationsByPriority()
    
비즈니스_로직_테스트:
  src/entities/notification/model/notification.test.ts: 필요
    - NotificationService.markAsRead()
    - NotificationService.bulkMarkAsRead()
    - NotificationService.filterByPriority()
    - NotificationService.getUnreadCount()
```

#### 통합 테스트 (Integration Tests)
```yaml
API_통합:
  test/integration/notifications-api.spec.ts: 필요
    - GET /api/notifications 응답 구조 확인
    - POST /api/notifications/{id}/read 상태 변경
    - WebSocket 실시간 알림 수신
    - 페이지네이션 동작 확인
    - 에러 상태 처리 (404, 500)

상태_관리_통합:
  test/integration/notifications-store.spec.ts: 필요
    - Redux store와 API 동기화
    - 낙관적 업데이트 롤백
    - 캐시 무효화 전략
    - 백그라운드 동기화

WebSocket_통합:
  test/integration/notifications-websocket.spec.ts: 필요
    - 실시간 알림 수신 및 UI 반영
    - 연결 끊김 시 재연결 처리
    - 메시지 큐 처리
    - 중복 알림 방지
```

### B. 초대 관리 시스템

#### 단위 테스트 (Unit Tests)
```yaml
컴포넌트_테스트:
  InvitationManagement.test.tsx: ✅ 완료 (21 cases)
    - 초대 목록 렌더링 (5 cases)
    - 상태별 필터링 (4 cases)
    - 검색 기능 (3 cases)
    - 액션 버튼 (6 cases)
    - 만료 시간 표시 (2 cases)
    - 반응형 레이아웃 (1 case)

폼_검증_테스트:
  src/features/invitation/ui/InviteForm.test.tsx: 필요
    - 이메일 형식 검증
    - 역할 선택 검증
    - 중복 초대 방지
    - 필수 필드 검증
    - 폼 제출 처리

상태_머신_테스트:
  src/entities/invitation/model/invitation-state.test.ts: 필요
    - pending → accepted 전환
    - pending → declined 전환
    - pending → expired 자동 전환
    - 무효한 상태 전환 방지
```

#### 통합 테스트 (Integration Tests)
```yaml
초대_워크플로우_통합:
  test/integration/invitation-workflow.spec.ts: 필요
    - 초대 발송 → 이메일 전송 → 수락 프로세스
    - 권한 설정 → 실제 권한 적용 검증
    - 만료 처리 → 자동 정리 작업
    - 대량 초대 처리 성능

이메일_서비스_통합:
  test/integration/invitation-email.spec.ts: 필요
    - 이메일 템플릿 렌더링
    - 다국어 이메일 발송
    - 이메일 발송 실패 처리
    - 발송 상태 추적

인증_권한_통합:
  test/integration/invitation-auth.spec.ts: 필요
    - JWT 토큰 기반 초대 링크
    - 역할별 접근 제어 검증
    - 초대 수락 후 권한 부여
    - 만료된 초대 링크 차단
```

### C. 확장 간트차트 시스템

#### 단위 테스트 (Unit Tests)
```yaml
컴포넌트_테스트:
  EnhancedGanttSection.test.tsx: ✅ 완료 (22 cases)
    - 차트 렌더링 (6 cases)
    - 프로젝트 선택 (4 cases)
    - 진행률 계산 (5 cases)
    - 빈 상태 처리 (3 cases)
    - 로딩 스켈레톤 (2 cases)
    - 에러 상태 (2 cases)

간트_차트_코어_테스트:
  src/shared/ui/GanttChart/GanttChart.test.tsx: 필요
    - 타임라인 렌더링
    - 작업 바 표시
    - 의존성 화살표
    - 마일스톤 표시
    - 드래그 앤 드롭
    - 확대/축소 기능

날짜_계산_테스트:
  src/shared/lib/gantt/date-utils.test.ts: 필요
    - 작업 일정 계산
    - 휴일/주말 제외
    - 시간대 처리
    - 의존성 일정 계산
```

#### 통합 테스트 (Integration Tests)
```yaml
간트_데이터_통합:
  test/integration/gantt-data-flow.spec.ts: 필요
    - 프로젝트 데이터 로드
    - 실시간 진행률 업데이트
    - 작업 변경 사항 저장
    - 다중 프로젝트 전환

드래그_드롭_통합:
  test/integration/gantt-interactions.spec.ts: 필요
    - 작업 일정 변경
    - 의존성 연결 생성/삭제
    - 마일스톤 이동
    - 변경사항 즉시 저장

성능_최적화_통합:
  test/integration/gantt-performance.spec.ts: 필요
    - 대용량 데이터 렌더링 (1000+ 작업)
    - 가상 스크롤링 동작
    - 메모리 사용량 최적화
    - 리렌더링 최소화
```

## 2. 영상 기획 메뉴 테스트 매트릭스

### A. PLAN 아이콘 및 UI 개선

#### 단위 테스트 (Unit Tests)
```yaml
아이콘_컴포넌트_테스트:
  src/shared/ui/PlanIcon/PlanIcon.test.tsx: 필요
    - 기본 렌더링 (2 cases)
    - 활성/비활성 상태 (2 cases)
    - 호버 효과 (2 cases)
    - 다크모드 적응 (2 cases)
    - 크기 변형 (3 cases)
    - 접근성 속성 (2 cases)

버튼_상호작용_테스트:
  src/features/planning/ui/PlanModeButton.test.tsx: 필요
    - 클릭 핸들러
    - 키보드 내비게이션
    - 토글 상태 관리
    - 로딩 상태 처리
    - 비활성화 상태

UI_테마_테스트:
  src/shared/lib/theme/plan-theme.test.ts: 필요
    - 색상 팔레트 적용
    - 다크/라이트 모드 전환
    - 고대비 모드 지원
    - CSS 변수 동적 변경
```

#### 통합 테스트 (Integration Tests)
```yaml
테마_시스템_통합:
  test/integration/plan-theming.spec.ts: 필요
    - 전역 테마와 아이콘 동기화
    - 사용자 선호도 저장/복원
    - 시스템 테마 자동 감지
    - 브라우저 호환성 테스트

모드_전환_통합:
  test/integration/planning-mode-transition.spec.ts: 필요
    - 일반 모드 ↔ 기획 모드 전환
    - 상태 보존/복원
    - 라우팅 동기화
    - 권한 기반 접근 제어
```

### B. 영상 기획 워크플로우

#### 단위 테스트 (Unit Tests)
```yaml
스토리보드_에디터_테스트:
  src/features/storyboard/ui/StoryboardEditor.test.tsx: 필요
    - 씬 추가/삭제 (4 cases)
    - 씬 순서 변경 (3 cases)
    - 내용 편집 (5 cases)
    - 시간 계산 (3 cases)
    - 자동 저장 (2 cases)

댓글_시스템_테스트:
  src/features/comments/ui/CommentSystem.test.tsx: 필요
    - 댓글 작성/삭제 (4 cases)
    - 답글 기능 (3 cases)
    - 멘션 기능 (2 cases)
    - 실시간 업데이트 (3 cases)

버전_관리_테스트:
  src/features/versioning/ui/VersionControl.test.tsx: 필요
    - 버전 생성 (3 cases)
    - 버전 비교 (4 cases)
    - 롤백 기능 (2 cases)
    - 브랜치 관리 (3 cases)

승인_워크플로우_테스트:
  src/features/approval/ui/ApprovalWorkflow.test.tsx: 필요
    - 승인 요청 (3 cases)
    - 승인/거절 처리 (4 cases)
    - 다단계 승인 (3 cases)
    - 상태 추적 (2 cases)
```

#### 통합 테스트 (Integration Tests)
```yaml
전체_워크플로우_통합:
  test/integration/video-planning-workflow.spec.ts: 필요
    - 프로젝트 생성 → 스토리보드 → 승인 전체 흐름
    - 협업자 초대 → 실시간 편집 → 충돌 해결
    - 버전 관리 → 비교 → 롤백 시나리오
    - 파일 업로드 → 첨부 → 미리보기

실시간_협업_통합:
  test/integration/realtime-collaboration.spec.ts: 필요
    - 동시 편집 감지 및 처리
    - Operational Transform 알고리즘
    - 충돌 해결 UI 통합
    - 사용자 커서 표시

파일_관리_통합:
  test/integration/file-management.spec.ts: 필요
    - 대용량 파일 업로드
    - 이미지/비디오 압축
    - 클라우드 저장소 연동
    - 미리보기 생성
```

## 3. 실시간 기능 테스트 매트릭스

### A. WebSocket 연결 관리

#### 단위 테스트 (Unit Tests)
```yaml
WebSocket_서비스_테스트:
  src/shared/lib/websocket/WebSocketService.test.ts: 필요
    - 연결 설정 (3 cases)
    - 재연결 로직 (5 cases)
    - 메시지 큐 관리 (4 cases)
    - 에러 처리 (3 cases)
    - 연결 상태 추적 (2 cases)

메시지_핸들러_테스트:
  src/shared/lib/websocket/MessageHandler.test.ts: 필요
    - 메시지 타입별 라우팅
    - 메시지 검증
    - 중복 처리 방지
    - 순서 보장
    - 압축/압축 해제
```

#### 통합 테스트 (Integration Tests)
```yaml
WebSocket_서버_통합:
  test/integration/websocket-server.spec.ts: 필요
    - 서버 연결/해제 사이클
    - 다중 클라이언트 관리
    - 메시지 브로드캐스팅
    - 방 기반 그룹 메시징
    - 서버 재시작 복구

네트워크_복원력_통합:
  test/integration/network-resilience.spec.ts: 필요
    - 네트워크 끊김 감지
    - 자동 재연결 전략
    - 오프라인 큐 관리
    - 온라인 복구 동기화
```

### B. 실시간 알림 시스템

#### 단위 테스트 (Unit Tests)
```yaml
알림_엔진_테스트:
  src/shared/lib/notifications/NotificationEngine.test.ts: 필요
    - 알림 생성 규칙
    - 우선순위 계산
    - 중복 제거
    - 배치 처리
    - 사용자 선호도 적용

브라우저_알림_테스트:
  src/shared/lib/notifications/BrowserNotification.test.ts: 필요
    - 권한 요청 처리
    - 알림 표시/숨김
    - 클릭 이벤트 처리
    - Do Not Disturb 모드
    - 다중 탭 관리
```

#### 통합 테스트 (Integration Tests)
```yaml
푸시_알림_통합:
  test/integration/push-notifications.spec.ts: 필요
    - 서비스 워커 등록
    - 푸시 구독 관리
    - 백그라운드 알림 처리
    - 포그라운드/백그라운드 동기화

알림_전달_통합:
  test/integration/notification-delivery.spec.ts: 필요
    - 다중 채널 전달 (WebSocket, Push, Email)
    - 전달 실패 재시도
    - 사용자별 설정 적용
    - 분석 데이터 수집
```

## 4. 테스트 커버리지 목표 및 측정

### 📊 커버리지 목표

```yaml
전체_커버리지_목표:
  lines: 85%
  functions: 90%
  branches: 80%
  statements: 85%

핵심_기능_커버리지_목표:
  dashboard_widgets: 95%
  video_planning: 90%
  websocket_realtime: 92%
  authentication: 95%
  data_persistence: 88%

파일별_최소_커버리지:
  components: 85%
  utilities: 90%
  business_logic: 95%
  api_routes: 80%
  middleware: 85%
```

### 🎯 뮤테이션 테스트 목표

```yaml
뮤테이션_스코어_목표:
  전체: 78%
  핵심_로직: 90%
  UI_컴포넌트: 70%
  유틸리티: 85%
  API_레이어: 80%

뮤테이션_연산자:
  - Arithmetic (+, -, *, /, %)
  - Conditional (&&, ||, !)
  - Relational (<, >, <=, >=, ==, !=)
  - Statement (break, continue, return)
  - Array (push, pop, slice, splice)
```

### 🔍 테스트 품질 지표

```yaml
테스트_품질_KPI:
  flaky_test_rate: < 1%
  test_execution_time: < 10min
  test_maintenance_cost: < 20% 개발시간
  bug_escape_rate: < 0.1%
  test_to_code_ratio: 1:2 ~ 1:3

자동화_비율:
  unit_tests: 100%
  integration_tests: 95%
  e2e_tests: 80%
  visual_regression: 60%
  accessibility_tests: 90%
```

## 5. 테스트 실행 전략

### ⚡ 병렬 실행 최적화

```yaml
단위_테스트_병렬화:
  - 의존성 없는 테스트 그룹별 분할
  - CPU 코어당 1-2개 워커
  - 메모리 사용량 모니터링
  - 격리된 테스트 환경

통합_테스트_순차_실행:
  - 데이터베이스 상태 의존성
  - 외부 서비스 Rate Limit 고려  
  - 테스트간 cleanup 시간 확보
  - 리소스 경합 방지
```

### 🎪 테스트 환경 관리

```yaml
로컬_개발_환경:
  - 빠른 피드백 루프 (< 30초)
  - 파일 변경 감지 자동 실행
  - 실패한 테스트만 재실행
  - 커버리지 실시간 표시

CI_환경:
  - 전체 테스트 스위트 실행
  - 병렬 실행으로 시간 단축
  - 아티팩트 보존 (스크린샷, 로그)
  - 품질 게이트 자동 평가

스테이징_환경:
  - 운영과 동일한 데이터
  - E2E 테스트 전용 실행
  - 성능 테스트 기준선
  - 사용자 수용 테스트
```

## 6. 테스트 데이터 관리

### 📚 테스트 데이터 전략

```yaml
단위_테스트_데이터:
  - 하드코딩된 모킹 데이터
  - Factory 패턴으로 생성
  - 테스트별 격리된 데이터
  - 재사용 가능한 픽처

통합_테스트_데이터:
  - Seed 데이터베이스
  - 트랜잭션 롤백 정책
  - 외부 서비스 Mock 서버
  - 테스트별 독립적 스키마

E2E_테스트_데이터:
  - 실제 프로덕션 유사 데이터
  - 사용자 시나리오별 데이터셋
  - 민감정보 마스킹
  - 정기적 데이터 갱신
```

---

**문서 버전**: 1.0.0  
**최종 업데이트**: 2025-08-23  
**담당자**: Grace (QA Lead)  
**검토자**: Development Team