import type { Meta, StoryObj } from '@storybook/react';
import Avatar from './Avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Atoms/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
사용자 아바타를 표시하는 컴포넌트입니다.

- 이미지가 있으면 이미지를 표시
- 이미지가 없으면 이름의 첫 글자를 이니셜로 표시
- 클릭 가능한 버전 지원
- 다양한 크기 지원 (sm, md, lg)
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'text',
      description: '사용자 이름 (이니셜 생성용)',
    },
    src: {
      control: 'text',
      description: '아바타 이미지 URL',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: '아바타 크기',
    },
    backgroundColor: {
      control: 'color',
      description: '배경색 (이미지가 없을 때)',
    },
    textColor: {
      control: 'color',
      description: '텍스트 색상',
    },
    onClick: {
      action: 'clicked',
      description: '클릭 핸들러',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

// 기본 스토리
export const Default: Story = {
  args: {
    name: 'John Doe',
  },
};

// 이미지가 있는 아바타
export const WithImage: Story = {
  args: {
    name: 'Jane Smith',
    src: 'https://images.unsplash.com/photo-1494790108755-2616b2ce1d3e?w=100&h=100&fit=crop&crop=face',
  },
};

// 다양한 크기
export const Small: Story = {
  args: {
    name: 'Small User',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    name: 'Medium User',
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    name: 'Large User',
    size: 'lg',
  },
};

// 클릭 가능한 아바타
export const Clickable: Story = {
  args: {
    name: 'Clickable User',
    onClick: () => alert('아바타가 클릭되었습니다!'),
  },
};

// 커스텀 색상
export const CustomColors: Story = {
  args: {
    name: 'Custom User',
    backgroundColor: '#ff6b6b',
    textColor: '#ffffff',
  },
};

// 한글 이름
export const Korean: Story = {
  args: {
    name: '김철수',
    backgroundColor: '#1631F8',
  },
};

// 긴 이름 (이니셜 확인)
export const LongName: Story = {
  args: {
    name: 'Very Long Name User',
    backgroundColor: '#28a745',
  },
};

// 모든 크기 비교
export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Avatar name="Small" size="sm" />
        <p style={{ marginTop: '8px', fontSize: '12px' }}>Small</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Avatar name="Medium" size="md" />
        <p style={{ marginTop: '8px', fontSize: '12px' }}>Medium</p>
      </div>
      <div style={{ textAlign: 'center' }}>
        <Avatar name="Large" size="lg" />
        <p style={{ marginTop: '8px', fontSize: '12px' }}>Large</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '모든 크기를 한 번에 비교할 수 있습니다.',
      },
    },
  },
};

// 이미지 로드 실패 시나리오
export const ImageLoadError: Story = {
  args: {
    name: 'Error User',
    src: 'https://invalid-image-url.com/image.jpg', // 존재하지 않는 이미지
  },
  parameters: {
    docs: {
      description: {
        story: '이미지 로드에 실패하면 자동으로 이니셜로 대체됩니다.',
      },
    },
  },
};

// 접근성 테스트용
export const Accessibility: Story = {
  args: {
    name: 'Accessible User',
    alt: '사용자 프로필 이미지',
    onClick: () => console.log('접근성 테스트'),
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'keyboard-navigation',
            enabled: true,
          },
        ],
      },
    },
    docs: {
      description: {
        story: '키보드 네비게이션과 스크린 리더를 지원합니다.',
      },
    },
  },
};

// 다크 모드
export const DarkMode: Story = {
  args: {
    name: 'Dark User',
    backgroundColor: '#ffffff',
    textColor: '#000000',
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: '다크 모드에서의 아바타 표시입니다.',
      },
    },
  },
};