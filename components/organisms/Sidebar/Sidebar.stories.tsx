import type { Meta, StoryObj } from '@storybook/react';
import Sidebar from './Sidebar';
import { User, Project } from '../../../types/layout';

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
    name: 'VideoPlanet 웹사이트 리뉴얼',
    created: '2024-01-01',
    status: 'active',
  },
  {
    id: '2',
    name: '모바일 앱 개발 프로젝트',
    created: '2024-01-02',
    status: 'completed',
  },
  {
    id: '3',
    name: '브랜드 비디오 제작',
    created: '2024-01-03',
    status: 'paused',
  },
  {
    id: '4',
    name: '온라인 교육 플랫폼',
    created: '2024-01-04',
    status: 'active',
  },
];

const meta: Meta<typeof Sidebar> = {
  title: 'Organisms/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
메인 네비게이션 사이드바 컴포넌트입니다.

주요 기능:
- 메인 네비게이션 메뉴
- 프로젝트/피드백 서브메뉴
- 프로젝트 목록 표시 및 관리
- 로그아웃 기능
- 반응형 디자인 지원

Atomic Design의 Organism 단계로, NavItem(Molecule)과 Submenu를 조합합니다.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    tab: {
      control: 'select',
      options: ['', 'home', 'calendar', 'project', 'feedback', 'elearning'],
      description: '현재 활성 탭',
    },
    onMenu: {
      control: 'boolean',
      description: '서브메뉴 열림 상태',
    },
    projects: {
      description: '프로젝트 목록',
    },
    user: {
      description: '사용자 정보',
    },
    collapsed: {
      control: 'boolean',
      description: '사이드바 축소 상태',
    },
    showProjects: {
      control: 'boolean',
      description: '프로젝트 서브메뉴 표시 여부',
    },
    onNavigate: {
      action: 'navigate',
      description: '네비게이션 핸들러',
    },
    onLogout: {
      action: 'logout',
      description: '로그아웃 핸들러',
    },
    onTabChange: {
      action: 'tab-change',
      description: '탭 변경 핸들러',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', height: '100vh' }}>
        <Story />
        <div style={{ flex: 1, padding: '20px', paddingLeft: '340px', background: '#f5f5f5' }}>
          <h1>메인 콘텐츠</h1>
          <p>사이드바 옆의 메인 콘텐츠 영역입니다.</p>
          <p>사이드바의 메뉴를 클릭하여 네비게이션을 테스트하세요.</p>
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

// 기본 사이드바
export const Default: Story = {
  args: {
    user: mockUser,
    projects: mockProjects,
  },
};

// 프로젝트 서브메뉴가 열린 상태
export const WithProjectSubmenu: Story = {
  args: {
    user: mockUser,
    projects: mockProjects,
    tab: 'project',
    onMenu: true,
  },
  parameters: {
    docs: {
      description: {
        story: '프로젝트 관리 서브메뉴가 열린 상태입니다.',
      },
    },
  },
};

// 피드백 서브메뉴가 열린 상태
export const WithFeedbackSubmenu: Story = {
  args: {
    user: mockUser,
    projects: mockProjects,
    tab: 'feedback',
    onMenu: true,
  },
  parameters: {
    docs: {
      description: {
        story: '영상 피드백 서브메뉴가 열린 상태입니다.',
      },
    },
  },
};

// 프로젝트가 없는 상태
export const WithoutProjects: Story = {
  args: {
    user: mockUser,
    projects: [],
    tab: 'project',
    onMenu: true,
  },
  parameters: {
    docs: {
      description: {
        story: '등록된 프로젝트가 없을 때의 빈 상태입니다.',
      },
    },
  },
};

// 축소된 사이드바
export const Collapsed: Story = {
  args: {
    user: mockUser,
    projects: mockProjects,
    collapsed: true,
  },
  parameters: {
    docs: {
      description: {
        story: '공간 절약을 위해 축소된 사이드바입니다.',
      },
    },
  },
};

// 많은 프로젝트가 있는 경우
export const WithManyProjects: Story = {
  args: {
    user: mockUser,
    projects: [
      ...mockProjects,
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `${i + 5}`,
        name: `추가 프로젝트 ${i + 1}`,
        created: `2024-02-${String(i + 1).padStart(2, '0')}`,
        status: 'active' as const,
      })),
    ],
    tab: 'project',
    onMenu: true,
  },
  parameters: {
    docs: {
      description: {
        story: '많은 프로젝트가 있을 때 스크롤 가능한 목록을 보여줍니다.',
      },
    },
  },
};

// 활성 상태 테스트
export const ActiveStates: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '20px' }}>
      <div>
        <h3>홈 활성</h3>
        <Sidebar
          user={mockUser}
          projects={mockProjects}
          currentPath="/CmsHome"
        />
      </div>
      <div>
        <h3>캘린더 활성</h3>
        <Sidebar
          user={mockUser}
          projects={mockProjects}
          currentPath="/Calendar"
        />
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story: '현재 경로에 따른 활성 메뉴 상태를 보여줍니다.',
      },
    },
  },
};

// 반응형 - 모바일
export const Mobile: Story = {
  args: {
    user: mockUser,
    projects: mockProjects,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story: '모바일 화면에서의 사이드바 표시입니다.',
      },
    },
  },
};

// 반응형 - 태블릿
export const Tablet: Story = {
  args: {
    user: mockUser,
    projects: mockProjects,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: '태블릿 화면에서의 사이드바 표시입니다.',
      },
    },
  },
};

// 다크 모드
export const DarkMode: Story = {
  args: {
    user: mockUser,
    projects: mockProjects,
    tab: 'project',
    onMenu: true,
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: '다크 모드에서의 사이드바 표시입니다.',
      },
    },
  },
};

// 접근성 테스트
export const Accessibility: Story = {
  args: {
    user: mockUser,
    projects: mockProjects,
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'landmark-navigation-is-top-level',
            enabled: true,
          },
          {
            id: 'keyboard-navigation',
            enabled: true,
          },
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
    docs: {
      description: {
        story: '키보드 네비게이션과 스크린 리더를 지원하는 접근성 표준 사이드바입니다.',
      },
    },
  },
};

// 인터랙션 테스트
export const Interactive: Story = {
  args: {
    user: mockUser,
    projects: mockProjects,
    onNavigate: (path: string) => {
      console.log('Navigation to:', path);
    },
    onTabChange: (tab: string) => {
      console.log('Tab changed to:', tab);
    },
    onLogout: () => {
      console.log('Logout clicked');
    },
  },
  parameters: {
    docs: {
      description: {
        story: '모든 인터랙션을 콘솔에서 확인할 수 있는 테스트용 스토리입니다.',
      },
    },
  },
};

// 로딩 상태
export const Loading: Story = {
  args: {
    user: mockUser,
    projects: [],
  },
  parameters: {
    docs: {
      description: {
        story: '프로젝트 정보를 로딩 중인 상태입니다.',
      },
    },
  },
};

// 에러 상태
export const ErrorState: Story = {
  args: {
    user: mockUser,
    projects: mockProjects,
  },
  render: (args) => (
    <div>
      <div style={{ 
        background: '#ff6b6b', 
        color: 'white', 
        padding: '10px', 
        marginBottom: '10px',
        borderRadius: '4px'
      }}>
        ⚠️ 프로젝트 로딩에 실패했습니다.
      </div>
      <Sidebar {...args} />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '데이터 로딩 실패 시의 에러 상태입니다.',
      },
    },
  },
};

// 사용자 권한별 표시
export const AdminUser: Story = {
  args: {
    user: { ...mockUser, role: 'admin' },
    projects: mockProjects,
    tab: 'project',
    onMenu: true,
  },
  parameters: {
    docs: {
      description: {
        story: '관리자 권한 사용자의 사이드바입니다.',
      },
    },
  },
};

// 프로젝트 상태별 표시
export const ProjectStatuses: Story = {
  args: {
    user: mockUser,
    projects: [
      { id: '1', name: '진행중 프로젝트', created: '2024-01-01', status: 'active' },
      { id: '2', name: '완료된 프로젝트', created: '2024-01-02', status: 'completed' },
      { id: '3', name: '일시정지 프로젝트', created: '2024-01-03', status: 'paused' },
    ],
    tab: 'project',
    onMenu: true,
  },
  parameters: {
    docs: {
      description: {
        story: '다양한 상태의 프로젝트들을 표시하는 서브메뉴입니다.',
      },
    },
  },
};

// 성능 테스트 (매우 긴 프로젝트명)
export const LongProjectNames: Story = {
  args: {
    user: mockUser,
    projects: [
      {
        id: '1',
        name: '매우 긴 프로젝트 이름으로 텍스트 오버플로우와 말줄임 처리를 테스트하기 위한 프로젝트',
        created: '2024-01-01',
        status: 'active',
      },
      {
        id: '2',
        name: 'Another Very Long Project Name to Test Text Overflow and Ellipsis Handling',
        created: '2024-01-02',
        status: 'active',
      },
    ],
    tab: 'project',
    onMenu: true,
  },
  parameters: {
    docs: {
      description: {
        story: '긴 프로젝트명의 말줄임 처리를 테스트합니다.',
      },
    },
  },
};