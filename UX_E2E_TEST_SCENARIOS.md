# VideoPlanet UX E2E 테스트 시나리오

## 1. 사용자 온보딩 및 인증

### Feature: 첫 방문자 온보딩
```gherkin
Feature: 첫 방문자 온보딩 경험
  As a 첫 방문자
  I want to 서비스를 빠르게 이해하고 시작할 수 있어야
  So that 가치를 빠르게 경험할 수 있다

  Background:
    Given 브라우저에서 VideoPlanet 홈페이지에 접속했을 때
    And 로그인하지 않은 상태일 때

  Scenario: 홈페이지 첫 방문
    When 홈페이지가 로드되면
    Then 히어로 섹션에 "영상 제작의 모든 것을 한 곳에서" 메시지가 표시되고
    And "무료로 시작하기" CTA 버튼이 표시되며
    And "AI 기획 체험하기" 버튼이 표시된다

  Scenario: 게스트로 AI 기획 체험
    When "AI 기획 체험하기" 버튼을 클릭하면
    Then AI 기획 페이지로 이동하고
    And 상단에 "게스트 모드로 체험 중" 배너가 표시되며
    And 기본 입력 필드만 활성화되어 있다
    When 필수 정보를 입력하고 "기획서 생성" 버튼을 클릭하면
    Then 로딩 인디케이터가 표시되고
    And 기획서가 생성되면 미리보기가 표시되며
    And "저장하려면 회원가입" 프롬프트가 표시된다

  Scenario: 게스트에서 회원으로 전환
    Given 게스트로 기획서를 생성한 상태에서
    When "저장하려면 회원가입" 버튼을 클릭하면
    Then 회원가입 모달이 표시되고
    And 소셜 로그인 옵션(Google, 카카오, 네이버)이 표시된다
    When Google 로그인을 선택하면
    Then OAuth 인증 플로우가 시작되고
    When 인증이 성공하면
    Then 대시보드로 이동하고
    And "기획서가 저장되었습니다" 토스트 메시지가 표시되며
    And 저장된 기획서가 목록에 표시된다
```

### Feature: 로그인 및 인증
```gherkin
Feature: 사용자 인증 플로우
  As a 기존 사용자
  I want to 안전하고 편리하게 로그인할 수 있어야
  So that 내 작업을 계속할 수 있다

  Background:
    Given 로그인 페이지에 있을 때

  Scenario: 이메일 로그인 성공
    When 이메일 필드에 "user@example.com"를 입력하고
    And 비밀번호 필드에 "ValidPassword123!"를 입력하고
    And "로그인" 버튼을 클릭하면
    Then 로딩 스피너가 표시되고
    And 대시보드로 리다이렉트되며
    And 상단에 "안녕하세요, 사용자님!" 환영 메시지가 표시된다

  Scenario: 잘못된 자격증명으로 로그인 실패
    When 이메일 필드에 "user@example.com"를 입력하고
    And 비밀번호 필드에 "WrongPassword"를 입력하고
    And "로그인" 버튼을 클릭하면
    Then 에러 메시지 "이메일 또는 비밀번호가 일치하지 않습니다"가 표시되고
    And 비밀번호 필드가 비워지며
    And 포커스가 비밀번호 필드로 이동한다

  Scenario: 필수 필드 검증
    When "로그인" 버튼을 클릭하면
    Then 이메일 필드 아래에 "이메일을 입력해주세요" 에러가 표시되고
    And 비밀번호 필드 아래에 "비밀번호를 입력해주세요" 에러가 표시된다

  Scenario: 소셜 로그인 (카카오)
    When "카카오로 계속하기" 버튼을 클릭하면
    Then 카카오 OAuth 페이지로 리다이렉트되고
    When 카카오 계정으로 인증하면
    Then VideoPlanet으로 리다이렉트되고
    And 대시보드가 표시되며
    And 프로필에 카카오 계정 정보가 표시된다

  Scenario: 비밀번호 찾기
    When "비밀번호 찾기" 링크를 클릭하면
    Then 비밀번호 재설정 페이지로 이동하고
    When 등록된 이메일 "user@example.com"을 입력하고
    And "재설정 링크 보내기" 버튼을 클릭하면
    Then "이메일이 전송되었습니다" 확인 메시지가 표시되고
    And 로그인 페이지로 돌아가는 링크가 표시된다
```

## 2. 핵심 기능 플로우

### Feature: 프로젝트 생성 및 관리
```gherkin
Feature: 프로젝트 라이프사이클
  As a 로그인한 사용자
  I want to 프로젝트를 생성하고 관리할 수 있어야
  So that 영상 제작을 체계적으로 진행할 수 있다

  Background:
    Given 로그인한 상태로 대시보드에 있을 때

  Scenario: 새 프로젝트 생성
    When "새 프로젝트" 버튼을 클릭하면
    Then 프로젝트 생성 모달이 표시되고
    When 프로젝트 이름 "브랜드 홍보 영상"을 입력하고
    And 설명 "2024년 신제품 홍보 영상"을 입력하고
    And 템플릿 "기본 템플릿"을 선택하고
    And "생성" 버튼을 클릭하면
    Then 모달이 닫히고
    And "프로젝트가 생성되었습니다" 토스트가 표시되며
    And 프로젝트 상세 페이지로 이동한다

  Scenario: 프로젝트 목록 보기
    When 네비게이션에서 "프로젝트"를 클릭하면
    Then 프로젝트 목록 페이지가 표시되고
    And 각 프로젝트 카드에는 다음이 표시된다:
      | 요소       | 설명                |
      | 썸네일     | 프로젝트 대표 이미지   |
      | 제목       | 프로젝트 이름         |
      | 진행률     | 완료 퍼센티지         |
      | 최종 수정일 | 마지막 업데이트 시간   |
      | 상태       | 진행중/완료/대기      |

  Scenario: 프로젝트 검색 및 필터링
    Given 10개 이상의 프로젝트가 있을 때
    When 검색창에 "홍보"를 입력하면
    Then 제목이나 설명에 "홍보"가 포함된 프로젝트만 표시되고
    When "진행 중" 필터를 선택하면
    Then 진행 중 상태의 프로젝트만 표시된다

  Scenario: 프로젝트 삭제
    Given 프로젝트 상세 페이지에 있을 때
    When "프로젝트 설정" 메뉴를 클릭하고
    And "프로젝트 삭제"를 선택하면
    Then 확인 모달이 표시되고
    And "이 작업은 되돌릴 수 없습니다" 경고가 표시된다
    When 프로젝트 이름을 입력하고
    And "삭제 확인" 버튼을 클릭하면
    Then 프로젝트가 삭제되고
    And 프로젝트 목록으로 리다이렉트되며
    And "프로젝트가 삭제되었습니다" 토스트가 표시된다
```

### Feature: AI 영상 기획
```gherkin
Feature: AI 기반 영상 기획서 생성
  As a 콘텐츠 제작자
  I want to AI를 활용해 영상 기획서를 생성하고 싶어
  So that 효율적으로 콘텐츠를 기획할 수 있다

  Background:
    Given 로그인한 상태로 AI 기획 페이지에 있을 때

  Scenario: 기본 정보 입력
    When 영상 제목 필드에 "신제품 런칭 티저"를 입력하고
    And 한줄 스토리에 "혁신적인 기술로 일상을 바꾸는 순간"을 입력하고
    And 톤앤매너에서 "모던", "미니멀", "감성적"을 선택하고
    And 타겟 오디언스를 "20-30대 직장인"으로 설정하고
    And 영상 길이를 "60초"로 선택하면
    Then "기획서 생성" 버튼이 활성화된다

  Scenario: AI 기획서 생성
    Given 필수 정보를 모두 입력한 상태에서
    When "기획서 생성" 버튼을 클릭하면
    Then 로딩 애니메이션이 표시되고
    And "AI가 기획서를 생성 중입니다..." 메시지가 표시된다
    When 생성이 완료되면
    Then 기획서 미리보기가 표시되고
    And 다음 섹션들이 포함된다:
      | 섹션        | 내용                    |
      | 시놉시스     | 전체 스토리 요약          |
      | 씬 구성      | 장면별 상세 설명          |
      | 촬영 리스트   | 필요한 샷 목록           |
      | 예상 일정     | 제작 타임라인            |
      | 참고 레퍼런스 | 유사 콘텐츠 예시         |

  Scenario: 기획서 편집
    Given AI가 생성한 기획서를 보고 있을 때
    When "편집 모드" 버튼을 클릭하면
    Then 각 섹션이 편집 가능한 상태로 변경되고
    When 시놉시스를 수정하고
    And "변경사항 저장" 버튼을 클릭하면
    Then "저장 중..." 인디케이터가 표시되고
    And "변경사항이 저장되었습니다" 토스트가 표시된다

  Scenario: 기획서 내보내기
    Given 완성된 기획서를 보고 있을 때
    When "내보내기" 버튼을 클릭하면
    Then 내보내기 옵션 모달이 표시되고
    And 다음 옵션들이 제공된다:
      | 형식      | 설명                  |
      | PDF      | 인쇄용 문서 형식        |
      | DOCX     | 편집 가능한 워드 문서    |
      | 공유 링크  | 웹에서 볼 수 있는 링크   |
    When "PDF로 다운로드"를 선택하면
    Then PDF 파일이 생성되어 다운로드된다
```

### Feature: 영상 피드백 시스템
```gherkin
Feature: 협업 피드백 수집 및 관리
  As a 영상 제작자
  I want to 팀원들로부터 피드백을 수집하고 관리하고 싶어
  So that 효과적으로 수정사항을 반영할 수 있다

  Background:
    Given 프로젝트의 피드백 페이지에 있을 때

  Scenario: 영상 업로드
    When "영상 업로드" 버튼을 클릭하면
    Then 파일 선택 다이얼로그가 열리고
    When MP4 파일 "sample_video.mp4"를 선택하면
    Then 업로드 프로그레스 바가 표시되고
    And "업로드 중... 45%" 상태가 표시된다
    When 업로드가 완료되면
    Then 영상 플레이어에 영상이 로드되고
    And 타임라인이 표시되며
    And "피드백 받기" 버튼이 활성화된다

  Scenario: 타임스탬프 기반 피드백 추가
    Given 영상이 업로드된 상태에서
    When 영상을 재생하고 15초 지점에서 일시정지하면
    And "피드백 추가" 버튼을 클릭하면
    Then 피드백 입력 폼이 표시되고
    And 현재 타임스탬프 "0:15"가 자동으로 표시된다
    When 피드백 내용 "로고 크기를 키워주세요"를 입력하고
    And 우선순위를 "높음"으로 설정하고
    And "피드백 저장" 버튼을 클릭하면
    Then 피드백이 타임라인에 마커로 표시되고
    And 피드백 목록에 추가된다

  Scenario: 공유 링크 생성
    Given 영상과 피드백이 준비된 상태에서
    When "공유 링크 생성" 버튼을 클릭하면
    Then 공유 설정 모달이 표시되고
    When "누구나 볼 수 있음" 옵션을 선택하고
    And "링크 생성" 버튼을 클릭하면
    Then 고유한 공유 URL이 생성되고
    And "링크가 클립보드에 복사되었습니다" 토스트가 표시된다

  Scenario: 게스트의 피드백 제공
    Given 공유 링크를 통해 접속한 게스트일 때
    Then 영상이 즉시 재생 가능하고
    And 기존 피드백들이 타임라인에 표시된다
    When 영상의 30초 지점을 클릭하고
    And "피드백 추가"를 클릭하면
    Then 게스트용 피드백 폼이 표시되고
    When 이름 "김철수"를 입력하고
    And 피드백 "배경음악 볼륨을 낮춰주세요"를 입력하고
    And "제출" 버튼을 클릭하면
    Then "피드백이 전송되었습니다" 확인 메시지가 표시된다

  Scenario: 피드백 상태 관리
    Given 여러 피드백이 있는 상태에서
    When 피드백 항목의 상태 드롭다운을 클릭하면
    Then 다음 상태 옵션들이 표시된다:
      | 상태      | 설명                  |
      | 신규      | 아직 확인하지 않음      |
      | 진행 중    | 수정 작업 중           |
      | 검토 대기  | 수정 완료, 확인 필요    |
      | 완료      | 최종 확인 완료         |
      | 보류      | 추후 검토 예정         |
    When "완료"를 선택하면
    Then 피드백이 완료 상태로 변경되고
    And 타임라인 마커 색상이 초록색으로 변경된다
```

## 3. 에러 처리 및 복구

### Feature: 에러 상태 처리
```gherkin
Feature: 우아한 에러 처리
  As a 사용자
  I want to 에러가 발생해도 명확한 안내를 받고 싶어
  So that 문제를 해결하고 작업을 계속할 수 있다

  Scenario: 네트워크 연결 끊김
    Given 프로젝트를 편집하고 있을 때
    When 인터넷 연결이 끊어지면
    Then 상단에 "오프라인 모드" 배너가 표시되고
    And "변경사항이 로컬에 저장됩니다" 메시지가 표시된다
    When 연결이 복구되면
    Then "온라인으로 전환되었습니다" 토스트가 표시되고
    And 로컬 변경사항이 자동으로 동기화된다

  Scenario: API 요청 실패
    Given AI 기획서를 생성하는 중일 때
    When API 요청이 실패하면
    Then "일시적인 오류가 발생했습니다" 메시지가 표시되고
    And "다시 시도" 버튼이 표시된다
    When "다시 시도" 버튼을 클릭하면
    Then 요청이 재시도되고
    And 성공 시 정상적으로 진행된다

  Scenario: 세션 만료
    Given 장시간 비활성 상태였을 때
    When 액션을 수행하려고 하면
    Then "세션이 만료되었습니다" 모달이 표시되고
    And "다시 로그인" 버튼이 표시된다
    When "다시 로그인" 버튼을 클릭하면
    Then 로그인 페이지로 이동하고
    And 로그인 후 이전 페이지로 돌아온다

  Scenario: 권한 없음
    Given 다른 사용자의 프로젝트 URL에 접근했을 때
    Then "접근 권한이 없습니다" 페이지가 표시되고
    And "권한 요청" 버튼이 표시된다
    When "권한 요청" 버튼을 클릭하면
    Then 프로젝트 소유자에게 알림이 전송되고
    And "요청이 전송되었습니다" 확인 메시지가 표시된다
```

## 4. 접근성 시나리오

### Feature: 키보드 네비게이션
```gherkin
Feature: 키보드만으로 전체 서비스 이용
  As a 키보드 사용자
  I want to 마우스 없이 모든 기능을 사용할 수 있어야
  So that 접근성이 보장된다

  Scenario: Tab 키로 네비게이션
    Given 홈페이지에 있을 때
    When Tab 키를 누르면
    Then 포커스가 "건너뛰기 링크"로 이동하고
    When 다시 Tab 키를 누르면
    Then 포커스가 로고로 이동하고
    And 포커스 인디케이터가 명확히 표시된다
    When 계속 Tab 키를 누르면
    Then 모든 인터랙티브 요소를 순서대로 탐색할 수 있다

  Scenario: 모달 내 포커스 트랩
    Given 모달이 열린 상태에서
    When Tab 키를 반복해서 누르면
    Then 포커스가 모달 내부에서만 순환하고
    When Shift+Tab을 누르면
    Then 역방향으로 순환한다
    When Escape 키를 누르면
    Then 모달이 닫히고
    And 포커스가 모달을 연 버튼으로 돌아간다

  Scenario: 드롭다운 메뉴 키보드 조작
    Given 드롭다운 메뉴에 포커스가 있을 때
    When Enter 키를 누르면
    Then 드롭다운이 열리고
    When 화살표 아래 키를 누르면
    Then 다음 메뉴 항목으로 포커스가 이동하고
    When 화살표 위 키를 누르면
    Then 이전 메뉴 항목으로 포커스가 이동한다
    When Enter 키를 누르면
    Then 선택된 항목이 활성화된다
```

### Feature: 스크린 리더 지원
```gherkin
Feature: 스크린 리더 호환성
  As a 시각 장애인 사용자
  I want to 스크린 리더로 모든 콘텐츠를 이해할 수 있어야
  So that 서비스를 완전히 이용할 수 있다

  Scenario: 이미지 대체 텍스트
    Given 스크린 리더가 활성화된 상태에서
    When 프로젝트 썸네일 이미지를 만나면
    Then "프로젝트명 썸네일 이미지" 대체 텍스트가 읽힌다
    When 아이콘 버튼을 만나면
    Then 버튼의 기능을 설명하는 라벨이 읽힌다

  Scenario: 동적 콘텐츠 알림
    Given 피드백 페이지에서 스크린 리더를 사용 중일 때
    When 새 피드백이 추가되면
    Then "새 피드백이 추가되었습니다" 라이브 리전 알림이 읽히고
    When 상태가 변경되면
    Then "피드백 상태가 완료로 변경되었습니다" 알림이 읽힌다

  Scenario: 폼 입력 안내
    Given 회원가입 폼에서 스크린 리더를 사용 중일 때
    When 이메일 필드에 포커스하면
    Then "이메일 주소, 필수 입력" 라벨이 읽히고
    When 잘못된 형식을 입력하면
    Then "올바른 이메일 형식이 아닙니다" 에러가 즉시 읽힌다
```

## 5. 성능 테스트 시나리오

### Feature: 페이지 로딩 성능
```gherkin
Feature: 빠른 페이지 로딩
  As a 사용자
  I want to 페이지가 빠르게 로드되어야
  So that 즉시 작업을 시작할 수 있다

  Scenario: 초기 페이지 로드
    When 홈페이지에 처음 접속하면
    Then First Contentful Paint가 1.5초 이내에 발생하고
    And Time to Interactive가 3초 이내여야 하며
    And Cumulative Layout Shift가 0.1 이하여야 한다

  Scenario: 이미지 레이지 로딩
    Given 프로젝트 목록 페이지에 100개의 프로젝트가 있을 때
    When 페이지를 로드하면
    Then 뷰포트에 보이는 이미지만 로드되고
    When 스크롤을 내리면
    Then 새로 보이는 이미지가 순차적으로 로드된다

  Scenario: 무한 스크롤
    Given 피드백 목록에 많은 항목이 있을 때
    When 스크롤이 하단에 도달하면
    Then 다음 20개 항목이 자동으로 로드되고
    And 로딩 중 스피너가 표시되며
    And 기존 콘텐츠 위치가 유지된다
```

## 6. 데이터 검증 시나리오

### Feature: 입력 데이터 검증
```gherkin
Feature: 실시간 입력 검증
  As a 시스템
  I want to 사용자 입력을 실시간으로 검증해야
  So that 올바른 데이터만 저장된다

  Scenario Outline: 이메일 형식 검증
    When 이메일 필드에 "<input>"을 입력하면
    Then 검증 결과가 "<result>"이고
    And 메시지 "<message>"가 표시된다

    Examples:
      | input              | result | message                        |
      | user@example.com   | valid  | 사용 가능한 이메일입니다          |
      | invalid-email      | error  | 올바른 이메일 형식이 아닙니다      |
      | user@              | error  | 도메인을 입력해주세요             |
      | @example.com       | error  | 이메일 아이디를 입력해주세요       |

  Scenario Outline: 프로젝트 이름 검증
    When 프로젝트 이름에 "<input>"을 입력하면
    Then 검증 결과가 "<result>"이고
    And 남은 글자 수 "<remaining>"가 표시된다

    Examples:
      | input                          | result | remaining |
      | 브랜드 홍보                      | valid  | 90/100   |
      | A                              | error  | 1/100    |
      | (100자 초과 텍스트)              | error  | 150/100  |
      | <script>alert('xss')</script>  | error  | 특수문자 제한 |
```

## 7. 협업 시나리오

### Feature: 실시간 협업
```gherkin
Feature: 다중 사용자 실시간 협업
  As a 팀원
  I want to 실시간으로 다른 사용자와 협업할 수 있어야
  So that 효율적으로 함께 작업할 수 있다

  Scenario: 동시 편집 감지
    Given 두 명의 사용자가 같은 프로젝트를 보고 있을 때
    When 사용자 A가 제목을 수정하면
    Then 사용자 B의 화면에 "사용자 A가 편집 중" 표시가 나타나고
    And 수정사항이 실시간으로 반영된다

  Scenario: 충돌 해결
    Given 두 사용자가 같은 필드를 동시에 편집할 때
    When 둘 다 저장을 시도하면
    Then 먼저 저장한 사용자의 변경사항이 적용되고
    And 늦게 저장한 사용자에게 충돌 알림이 표시되며
    And "변경사항 병합" 옵션이 제공된다

  Scenario: 실시간 커서 표시
    Given 여러 사용자가 같은 문서를 보고 있을 때
    When 각 사용자가 다른 위치를 선택하면
    Then 각 사용자의 커서가 다른 색상으로 표시되고
    And 사용자 이름이 커서 옆에 표시된다
```

---

이 E2E 테스트 시나리오는 VideoPlanet의 주요 사용자 여정을 포괄적으로 다루며, 각 시나리오는 실제 구현 시 자동화 테스트로 변환할 수 있습니다. Gherkin 형식을 사용하여 개발자, QA, 제품 관리자 모두가 이해할 수 있는 명확한 사양을 제공합니다.