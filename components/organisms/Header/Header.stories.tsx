import type { Meta, StoryObj } from '@storybook/react';
import Header from './Header';
import { User } from '../../../types/layout';

// Mock user data
const mockUser: User = {
  id: '1',
  email: 'user@example.com',
  nickname: 'TestUser',
  name: 'Test User',
};

const meta: Meta<typeof Header> = {
  title: 'Organisms/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
페이지 상단 헤더 컴포넌트입니다.

주요 기능:
- 브랜드 로고 표시
- 사용자 프로필 정보 표시
- 좌측/우측 커스텀 아이템 지원
- 고정 위치 지원
- 그림자 효과 지원

Atomic Design의 Organism 단계로, Logo(Atom)와 UserProfile(Molecule)을 조합합니다.
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    leftItems: {
      description: '헤더 좌측에 표시할 아이템들',
    },
    rightItems: {
      description: '헤더 우측에 표시할 아이템들',
    },
    isFixed: {
      control: 'boolean',
      description: '고정 위치 여부',
    },
    showShadow: {
      control: 'boolean',
      description: '그림자 표시 여부',
    },
    onLogoClick: {
      action: 'logo-clicked',
      description: '로고 클릭 핸들러',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh' }}>
        <Story />
        <div style={{ padding: '20px', paddingTop: '100px' }}>
          <h1>페이지 콘텐츠</h1>
          <p>헤더 아래 콘텐츠입니다. 스크롤하여 고정 헤더의 동작을 확인하세요.</p>
          {Array.from({ length: 50 }, (_, i) => (
            <p key={i}>스크롤 테스트를 위한 더미 콘텐츠 {i + 1}</p>
          ))}
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Header>;

// 기본 헤더
export const Default: Story = {
  args: {},
};

// 사용자 프로필이 있는 헤더
export const WithUserProfile: Story = {
  args: {
    rightItems: Header.createUserProfileItems(mockUser),
  },
};

// 고정 헤더
export const Fixed: Story = {
  args: {
    isFixed: true,
    showShadow: true,
    rightItems: Header.createUserProfileItems(mockUser),
  },
  parameters: {
    docs: {
      description: {
        story: '페이지 스크롤 시에도 상단에 고정되는 헤더입니다.',
      },
    },
  },
};

// 그림자 없는 헤더
export const WithoutShadow: Story = {
  args: {
    showShadow: false,
    rightItems: Header.createUserProfileItems(mockUser),
  },
};

// 커스텀 아이템들
export const WithCustomItems: Story = {
  args: {
    leftItems: [
      Header.createLogoItem(() => console.log('Logo clicked!')),
      {
        type: 'string',
        text: 'Dashboard',
        className: 'nav-title',
      },
    ],
    rightItems: [
      {
        type: 'string',
        text: '알림',
        className: 'nav-item',
        onClick: () => console.log('Notifications clicked'),
      },
      {
        type: 'string',
        text: '설정',
        className: 'nav-item',
        onClick: () => console.log('Settings clicked'),
      },
      ...Header.createUserProfileItems(mockUser),
    ],
  },
};

// 이미지 아이템이 있는 헤더
export const WithImageItems: Story = {
  args: {
    leftItems: [
      {
        type: 'img',
        src: '/images/Common/logo.svg',
        alt: 'Logo',
        className: 'logo',
        onClick: () => console.log('Logo image clicked'),
      },
    ],
    rightItems: [
      {
        type: 'img',
        src: '/images/Cms/profie_sample.png',
        alt: 'Profile',
        className: 'profile-image',
        onClick: () => console.log('Profile image clicked'),
      },
    ],
  },
};

// 중앙 콘텐츠가 있는 헤더
export const WithCenterContent: Story = {
  args: {
    rightItems: Header.createUserProfileItems(mockUser),
    children: (
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        alignItems: 'center',
        color: '#666',
        fontSize: '14px' 
      }}>
        <span>프로젝트: 비디오 플래닛</span>
        <span>•</span>
        <span>진행률: 75%</span>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story: '헤더 중앙에 추가 정보를 표시할 수 있습니다.',
      },
    },
  },
};

// 반응형 테스트
export const Mobile: Story = {
  args: {
    rightItems: Header.createUserProfileItems(mockUser),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story: '모바일 화면에서의 헤더 표시입니다.',
      },
    },
  },
};

export const Tablet: Story = {
  args: {
    rightItems: Header.createUserProfileItems(mockUser),
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: '태블릿 화면에서의 헤더 표시입니다.',
      },
    },
  },
};

// 다크 모드
export const DarkMode: Story = {
  args: {
    rightItems: Header.createUserProfileItems(mockUser),
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: '다크 모드에서의 헤더 표시입니다.',
      },
    },
  },
};

// 접근성 테스트
export const Accessibility: Story = {
  args: {
    rightItems: Header.createUserProfileItems(mockUser),
    onLogoClick: () => console.log('Logo clicked - 접근성 테스트'),
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'landmark-banner-is-top-level',
            enabled: true,
          },
          {
            id: 'landmark-no-duplicate-banner',
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
        story: 'WAI-ARIA 접근성 표준을 준수하는 헤더입니다. 스크린 리더와 키보드 네비게이션을 지원합니다.',
      },
    },
  },
};

// 성능 테스트용 (많은 아이템)
export const WithManyItems: Story = {
  args: {
    leftItems: [
      Header.createLogoItem(),
      ...Array.from({ length: 5 }, (_, i) => ({
        type: 'string' as const,
        text: `메뉴 ${i + 1}`,
        className: 'nav-item',
        onClick: () => console.log(`메뉴 ${i + 1} clicked`),
      })),
    ],
    rightItems: [
      ...Array.from({ length: 3 }, (_, i) => ({
        type: 'string' as const,
        text: `도구 ${i + 1}`,
        className: 'nav-item',
        onClick: () => console.log(`도구 ${i + 1} clicked`),
      })),
      ...Header.createUserProfileItems(mockUser),
    ],
  },
  parameters: {
    docs: {
      description: {
        story: '많은 네비게이션 아이템이 있는 경우의 레이아웃입니다.',
      },
    },
  },
};

// 로딩 상태 (사용자 정보 없음)
export const Loading: Story = {
  args: {
    rightItems: [],
  },
  parameters: {
    docs: {
      description: {
        story: '사용자 정보를 로딩 중인 상태입니다.',
      },
    },
  },
};

// 에러 상태 시뮬레이션
export const ErrorState: Story = {
  args: {
    rightItems: [
      {
        type: 'string',
        text: '오류 발생',
        className: 'error-indicator',
        onClick: () => alert('에러 상세 정보'),
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: '에러 상태를 표시하는 헤더입니다.',
      },
    },
  },
};