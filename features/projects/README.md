# 프로젝트 관리 모듈

VideoPlanet의 프로젝트 관리 기능을 Next.js 14 App Router와 TypeScript로 통합한 모듈입니다.

## 구조

```
features/projects/
├── api/                    # API 로직
│   └── projectsApi.ts     # 프로젝트 관련 API 함수들
├── components/            # 재사용 가능한 컴포넌트들
│   ├── ProjectInput.tsx   # 프로젝트 기본 정보 입력
│   ├── ProcessDate.tsx    # 프로젝트 일정 관리
│   ├── ProjectList.tsx    # 프로젝트 목록 (Swiper)
│   ├── ProjectInfo.tsx    # 프로젝트 상세 정보
│   ├── InviteInput.tsx    # 멤버 초대
│   └── index.ts          # 컴포넌트 인덱스
├── hooks/                 # 커스텀 훅
│   └── useProjects.ts    # 프로젝트 관리 훅들
├── types/                 # TypeScript 타입 정의
│   └── index.ts          # 모든 프로젝트 관련 타입
├── index.ts              # 모듈 메인 인덱스
└── README.md             # 이 문서
```

## 주요 기능

### 1. 프로젝트 CRUD
- [DONE] 프로젝트 생성, 조회, 수정, 삭제
- [DONE] 파일 업로드/다운로드
- [DONE] 프로젝트 검색 및 필터링

### 2. 멤버 관리
- [DONE] 멤버 초대 (이메일 기반)
- [DONE] 권한 관리 (관리자/일반)
- [DONE] 초대 취소

### 3. 일정 관리
- [DONE] 8단계 프로젝트 생명주기
- [DONE] 단계별 시작/종료 날짜
- [DONE] 캘린더 뷰 (월/주/일)

### 4. 파일 관리
- [DONE] 프로젝트 파일 업로드
- [DONE] 샘플 파일 다운로드
- [DONE] 파일 삭제

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **언어**: TypeScript
- **상태 관리**: Redux + 커스텀 훅
- **스타일링**: SCSS
- **UI 라이브러리**: Ant Design (select), Swiper
- **날짜 처리**: React DatePicker, Moment.js
- **API**: Axios
- **테스트**: Jest, React Testing Library, Cypress

## App Router 구조

```
app/(main)/projects/
├── page.tsx              # 프로젝트 목록 (/projects)
├── create/
│   └── page.tsx         # 프로젝트 생성 (/projects/create)
└── [id]/
    ├── view/
    │   └── page.tsx     # 프로젝트 상세 (/projects/[id]/view)
    └── edit/
        └── page.tsx     # 프로젝트 편집 (/projects/[id]/edit)
```

## UI/UX 특징

### 기존 UI 100% 유지
- 기존 CMS 스타일 완전 보존
- 그라데이션 버튼 (#1631F8)
- 8단계 프로젝트 진행 상태 색상
- 반응형 디자인 지원

### 접근성 개선
- ARIA 라벨 및 역할 정의
- 키보드 네비게이션 지원
- 스크린 리더 호환
- 색상 대비 최적화

### 다크 모드 지원
- 시스템 설정 기반 자동 전환
- 모든 컴포넌트 다크 모드 대응

## 사용법

### 1. 컴포넌트 사용

```tsx
import { ProjectInput, ProcessDate } from '@/features/projects/components';
import { useProjectForm } from '@/features/projects/hooks/useProjects';

function ProjectCreatePage() {
  const { inputs, onChange, process, setProcess } = useProjectForm();
  
  return (
    <form>
      <ProjectInput inputs={inputs} onChange={onChange} />
      <ProcessDate process={process} set_process={setProcess} />
    </form>
  );
}
```

### 2. API 사용

```tsx
import { projectsApi } from '@/features/projects/api/projectsApi';

// 프로젝트 목록 조회
const projects = await projectsApi.fetchProjectList();

// 프로젝트 생성
const formData = new FormData();
formData.append('inputs', JSON.stringify(projectData));
const newProject = await projectsApi.createProject(formData);
```

### 3. 훅 사용

```tsx
import { useProjects } from '@/features/projects/hooks/useProjects';

function ProjectComponent() {
  const {
    projects,
    loading,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject
  } = useProjects();
  
  useEffect(() => {
    fetchProjects();
  }, []);
  
  return (
    <div>
      {loading ? <div>로딩중...</div> : <ProjectList projects={projects} />}
    </div>
  );
}
```

## 🧪 테스트

### 단위 테스트 실행
```bash
npm run test:unit
npm run test:unit:projects  # 프로젝트 모듈만
```

### E2E 테스트 실행
```bash
npm run test:e2e
npm run test:e2e:projects  # 프로젝트 관련만
```

### 커버리지 확인
```bash
npm run test:coverage
```

## 권한 관리

### 역할별 권한

| 기능 | 프로젝트 소유자 | 관리자 | 일반 멤버 |
|------|:-------------:|:------:|:---------:|
| 프로젝트 보기 | [YES] | [YES] | [YES] |
| 프로젝트 수정 | [YES] | [YES] | [NO] |
| 프로젝트 삭제 | [YES] | [NO] | [NO] |
| 멤버 초대 | [YES] | [YES] | [NO] |
| 멤버 권한 변경 | [YES] | [YES] | [NO] |
| 파일 업로드 | [YES] | [YES] | [NO] |
| 파일 삭제 | [YES] | [YES] | [NO] |

## 성능 최적화

### 적용된 최적화
- React.memo를 통한 컴포넌트 메모이제이션
- useCallback/useMemo를 통한 함수/값 메모이제이션
- 가상화된 목록 렌더링 (Swiper)
- 이미지 레이지 로딩
- API 응답 캐싱

### 성능 목표
- 초기 로딩: 3초 이내
- 상호작용 응답: 100ms 이내
- API 응답: 200ms 이내

## 국제화 준비

현재는 한국어만 지원하지만, 다국어 지원을 위한 구조가 준비되어 있습니다.

```tsx
// 향후 i18n 적용 예시
const t = useTranslation();
<div className="s_title">{t('projects.form.name')}</div>
```

## 향후 개선 계획

### 단기 (1-2개월)
- [ ] 실시간 협업 기능 (WebSocket)
- [ ] 프로젝트 템플릿 기능
- [ ] 고급 검색 필터

### 중기 (3-6개월)
- [ ] 프로젝트 대시보드 차트
- [ ] 알림 시스템
- [ ] 모바일 앱 지원

### 장기 (6개월+)
- [ ] AI 기반 프로젝트 추천
- [ ] 타임 트래킹 통합
- [ ] 외부 도구 연동 (Slack, Teams)

## 문제 해결

### 자주 발생하는 문제

#### 1. 날짜 선택이 동작하지 않음
```tsx
// 해결: DatePicker가 제대로 import되었는지 확인
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
```

#### 2. 파일 업로드 실패
```tsx
// 해결: FormData 설정 확인
const formData = new FormData();
formData.append('files', file); // 's' 주의
```

#### 3. 권한 에러
```tsx
// 해결: 사용자 권한 확인
const permissions = useProjectPermissions(project);
if (!permissions.canEdit) {
  router.push('/projects');
}
```

## 기여하기

1. 기능 추가/버그 수정 시 테스트 코드 필수
2. TypeScript 타입 정의 업데이트
3. 스타일 가이드 준수 (기존 UI/UX 유지)
4. 접근성 표준 준수

## 라이선스

이 프로젝트는 VideoPlanet의 일부로, 회사 내부 라이선스를 따릅니다.

---

**최종 업데이트**: 2025-08-15  
**버전**: 1.0.0  
**개발자**: Claude AI Assistant