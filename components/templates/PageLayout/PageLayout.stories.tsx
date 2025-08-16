import type { Meta, StoryObj } from '@storybook/react';
import PageLayout from './PageLayout';
import { User, Project, BreadcrumbItem } from '../../../types/layout';

// Mock data
const mockUser: User = {
  id: '1',
  email: 'user@example.com',
  nickname: 'TestUser',
  name: 'Test User',
};

const mockProjects: Project[] = [
  {
    id: '1',
    name: '웹사이트 리뉴얼 프로젝트',
    created: '2024-01-01',
    status: 'active',
  },
  {
    id: '2',
    name: '모바일 앱 개발',
    created: '2024-01-02',
    status: 'completed',
  },
  {
    id: '3',
    name: '브랜딩 비디오 제작',
    created: '2024-01-03',
    status: 'paused',
  },
];

const mockBreadcrumbs: BreadcrumbItem[] = [
  { label: '홈', path: '/home' },
  { label: '프로젝트', path: '/projects' },
  { label: '프로젝트 상세', isActive: true },
];

const meta: Meta<typeof PageLayout> = {
  title: 'Templates/PageLayout',
  component: PageLayout,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
전체 페이지 레이아웃을 담당하는 템플릿 컴포넌트입니다.

주요 기능:
- Header와 Sidebar를 포함한 전체 레이아웃
- 페이지 제목, 설명, 브레드크럼
- 액션 버튼 영역
- 로딩 및 에러 상태 처리
- 인증/비인증 레이아웃 지원
- 반응형 디자인

Atomic Design의 Template 단계로, Header(Organism)와 Sidebar(Organism)를 조합합니다.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    header: {
      control: 'boolean',
      description: '헤더 표시 여부',
    },
    sidebar: {
      control: 'boolean',
      description: '사이드바 표시 여부',
    },
    navigation: {
      control: 'boolean',
      description: '네비게이션 표시 여부',
    },
    auth: {
      control: 'boolean',
      description: '인증 페이지 레이아웃 여부',
    },
    title: {
      control: 'text',
      description: '페이지 제목',
    },
    description: {
      control: 'text',
      description: '페이지 설명',
    },
    showBreadcrumb: {
      control: 'boolean',
      description: '브레드크럼 표시 여부',
    },
    loading: {
      control: 'boolean',
      description: '로딩 상태',
    },
    error: {
      control: 'text',
      description: '에러 메시지',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', background: '#f5f5f5' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PageLayout>;

// 기본 레이아웃
export const Default: Story = {
  args: {
    user: mockUser,
    projects: mockProjects,
    children: (
      <div style={{ padding: '20px' }}>
        <h2>페이지 콘텐츠</h2>
        <p>여기에 실제 페이지 콘텐츠가 들어갑니다.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3>카드 1</h3>
            <p>카드 콘텐츠입니다.</p>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3>카드 2</h3>
            <p>카드 콘텐츠입니다.</p>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3>카드 3</h3>
            <p>카드 콘텐츠입니다.</p>
          </div>
        </div>
      </div>
    ),
  },
};

// 제목과 설명이 있는 레이아웃
export const WithTitleAndDescription: Story = {
  args: {
    user: mockUser,
    projects: mockProjects,
    title: '프로젝트 대시보드',
    description: '현재 진행중인 모든 프로젝트를 한눈에 확인하고 관리할 수 있습니다.',
    children: (
      <div style={{ padding: '20px' }}>
        <div style={{ background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2>대시보드 콘텐츠</h2>
          <p>프로젝트 현황과 통계를 여기에 표시합니다.</p>
        </div>
      </div>
    ),
  },
};

// 브레드크럼이 있는 레이아웃
export const WithBreadcrumb: Story = {
  args: {
    user: mockUser,
    projects: mockProjects,
    title: '프로젝트 상세 정보',
    description: '웹사이트 리뉴얼 프로젝트의 상세 정보입니다.',
    showBreadcrumb: true,
    breadcrumbItems: mockBreadcrumbs,
    children: (
      <div style={{ padding: '20px' }}>
        <div style={{ background: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <h2>프로젝트 정보</h2>
          <p><strong>프로젝트명:</strong> 웹사이트 리뉴얼</p>
          <p><strong>상태:</strong> 진행중</p>
          <p><strong>진행률:</strong> 75%</p>
          <p><strong>마감일:</strong> 2024-03-01</p>
        </div>
      </div>
    ),
  },
};

// 액션 버튼이 있는 레이아웃
export const WithActions: Story = {
  args: {
    user: mockUser,
    projects: mockProjects,
    title: '프로젝트 관리',
    description: '프로젝트를 생성하고 관리할 수 있습니다.',
    actions: (
      <div style={{ display: 'flex', gap: '12px' }}>
        <button 
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#1631F8', 
            color: 'white', 
            border: 'none', 
            borderRadius: '6px',
            cursor: 'pointer'
          }}
          onClick={() => console.log('새 프로젝트 생성')}
        >
          새 프로젝트
        </button>
        <button 
          style={{ 
            padding: '8px 16px', 
            backgroundColor: 'white', 
            color: '#666', 
            border: '1px solid #ddd', 
            borderRadius: '6px',
            cursor: 'pointer'
          }}
          onClick={() => console.log('프로젝트 가져오기')}
        >
          가져오기
        </button>
      </div>
    ),
    children: (
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          {mockProjects.map(project => (
            <div key={project.id} style={{ 
              background: 'white', 
              padding: '20px', 
              borderRadius: '8px', 
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
            }}>
              <h3>{project.name}</h3>
              <p>상태: {project.status}</p>
              <p>생성일: {project.created}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
};

// 인증 레이아웃
export const AuthLayout: Story = {
  args: {
    auth: true,
    children: (
      <div style={{ 
        background: 'white', 
        padding: '40px', 
        borderRadius: '8px', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>로그인</h1>
        <form>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>이메일</label>
            <input 
              type="email" 
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #ddd', 
                borderRadius: '6px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px' }}>비밀번호</label>
            <input 
              type="password" 
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #ddd', 
                borderRadius: '6px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <button 
            type="submit"
            style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: '#1631F8', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            로그인
          </button>
        </form>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: '로그인, 회원가입 등 인증 페이지용 레이아웃입니다.',
      },
    },
  },
};

// 사이드바 없는 레이아웃
export const WithoutSidebar: Story = {
  args: {
    user: mockUser,
    projects: mockProjects,
    sidebar: false,
    title: '전체 화면 페이지',
    description: '사이드바가 없는 전체 화면 레이아웃입니다.',
    children: (
      <div style={{ padding: '20px' }}>
        <div style={{ 
          background: 'white', 
          padding: '40px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2>전체 화면 콘텐츠</h2>
          <p>사이드바 없이 더 넓은 공간을 활용할 수 있습니다.</p>
        </div>
      </div>
    ),
  },
};

// 헤더 없는 레이아웃
export const WithoutHeader: Story = {
  args: {
    user: mockUser,
    projects: mockProjects,
    header: false,
    title: '헤더 없는 페이지',
    children: (
      <div style={{ padding: '20px' }}>
        <div style={{ 
          background: 'white', 
          padding: '40px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2>헤더 없는 콘텐츠</h2>
          <p>특별한 경우에 헤더 없이 표시할 수 있습니다.</p>
        </div>
      </div>
    ),
  },
};

// 로딩 상태
export const Loading: Story = {
  args: {
    user: mockUser,
    projects: mockProjects,
    title: '데이터 로딩 중',
    description: '프로젝트 데이터를 불러오고 있습니다.',
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: '데이터 로딩 중일 때 표시되는 스피너와 메시지입니다.',
      },
    },
  },
};

// 에러 상태
export const ErrorState: Story = {
  args: {
    user: mockUser,
    projects: mockProjects,
    title: '오류 발생',
    description: '페이지를 불러오는 중 문제가 발생했습니다.',
    error: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
    children: (
      <div style={{ padding: '20px' }}>
        <div style={{ 
          background: 'white', 
          padding: '40px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2>페이지 콘텐츠</h2>
          <p>에러가 표시되어도 나머지 콘텐츠는 정상 표시됩니다.</p>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: '에러 발생 시 사용자에게 친화적인 메시지를 표시합니다.',
      },
    },
  },
};

// 반응형 - 모바일
export const Mobile: Story = {
  args: {
    user: mockUser,
    projects: mockProjects,
    title: '모바일 레이아웃',
    description: '모바일 디바이스에 최적화된 레이아웃입니다.',
    children: (
      <div style={{ padding: '16px' }}>
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2>모바일 콘텐츠</h2>
          <p>모바일에서 최적화된 레이아웃을 확인하세요.</p>
        </div>
      </div>
    ),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story: '모바일 화면에서의 레이아웃입니다.',
      },
    },
  },
};

// 반응형 - 태블릿
export const Tablet: Story = {
  args: {
    user: mockUser,
    projects: mockProjects,
    title: '태블릿 레이아웃',
    description: '태블릿 디바이스에 최적화된 레이아웃입니다.',
    children: (
      <div style={{ padding: '20px' }}>
        <div style={{ 
          background: 'white', 
          padding: '30px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2>태블릿 콘텐츠</h2>
          <p>태블릿에서 최적화된 레이아웃을 확인하세요.</p>
        </div>
      </div>
    ),
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: '태블릿 화면에서의 레이아웃입니다.',
      },
    },
  },
};

// 다크 모드
export const DarkMode: Story = {
  args: {
    user: mockUser,
    projects: mockProjects,
    title: '다크 모드 레이아웃',
    description: '다크 테마가 적용된 레이아웃입니다.',
    children: (
      <div style={{ padding: '20px' }}>
        <div style={{ 
          background: '#2a2a2a', 
          color: 'white',
          padding: '30px', 
          borderRadius: '8px', 
          border: '1px solid #444'
        }}>
          <h2>다크 모드 콘텐츠</h2>
          <p>다크 테마에서의 콘텐츠 표시입니다.</p>
        </div>
      </div>
    ),
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: '다크 모드에서의 레이아웃입니다.',
      },
    },
  },
};

// 복합 기능 테스트
export const FullFeatured: Story = {
  args: {
    user: mockUser,
    projects: mockProjects,
    title: '완전한 기능의 페이지',
    description: '모든 기능을 포함한 완전한 레이아웃 예시입니다.',
    showBreadcrumb: true,
    breadcrumbItems: [
      { label: '홈', path: '/' },
      { label: '프로젝트', path: '/projects' },
      { label: '대시보드', isActive: true },
    ],
    actions: (
      <div style={{ display: 'flex', gap: '12px' }}>
        <button style={{ 
          padding: '8px 16px', 
          backgroundColor: '#1631F8', 
          color: 'white', 
          border: 'none', 
          borderRadius: '6px' 
        }}>
          새로 만들기
        </button>
        <button style={{ 
          padding: '8px 16px', 
          backgroundColor: 'white', 
          color: '#666', 
          border: '1px solid #ddd', 
          borderRadius: '6px' 
        }}>
          내보내기
        </button>
        <button style={{ 
          padding: '8px 16px', 
          backgroundColor: 'white', 
          color: '#666', 
          border: '1px solid #ddd', 
          borderRadius: '6px' 
        }}>
          설정
        </button>
      </div>
    ),
    children: (
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3>통계</h3>
            <p>활성 프로젝트: {mockProjects.filter(p => p.status === 'active').length}</p>
            <p>완료된 프로젝트: {mockProjects.filter(p => p.status === 'completed').length}</p>
            <p>일시정지: {mockProjects.filter(p => p.status === 'paused').length}</p>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3>최근 활동</h3>
            <p>프로젝트 업데이트 알림</p>
            <p>새로운 피드백 도착</p>
            <p>파일 업로드 완료</p>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3>빠른 액세스</h3>
            <p>자주 사용하는 기능</p>
            <p>즐겨찾기 프로젝트</p>
            <p>최근 파일</p>
          </div>
        </div>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: '실제 프로덕션 환경에서 사용될 수 있는 모든 기능을 포함한 완전한 레이아웃 예시입니다.',
      },
    },
  },
};