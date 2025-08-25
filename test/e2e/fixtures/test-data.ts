/**
 * VideoPlanet E2E 테스트 데이터 픽스처
 * 
 * 테스트에 사용되는 모든 목업 데이터를 중앙 관리
 */

export const testData = {
  // 사용자 데이터
  users: {
    admin: {
      email: 'admin@videoplanet.com',
      password: 'Admin123!@#',
      name: '관리자',
      role: 'admin',
      company: 'VideoPlanet',
      department: '개발팀'
    },
    projectManager: {
      email: 'pm@videoplanet.com',
      password: 'PM123!@#',
      name: '김프로',
      role: 'project_manager',
      company: 'VideoPlanet',
      department: '기획팀'
    },
    reviewer: {
      email: 'reviewer@videoplanet.com',
      password: 'Review123!@#',
      name: '이리뷰',
      role: 'reviewer',
      company: 'VideoPlanet',
      department: '디자인팀'
    },
    editor: {
      email: 'editor@videoplanet.com',
      password: 'Edit123!@#',
      name: '박편집',
      role: 'editor',
      company: 'VideoPlanet',
      department: '영상팀'
    },
    member: {
      email: 'member@videoplanet.com',
      password: 'Member123!@#',
      name: '최멤버',
      role: 'member',
      company: 'VideoPlanet',
      department: '마케팅팀'
    },
    guest: {
      email: 'guest@external.com',
      password: 'Guest123!@#',
      name: '손님',
      role: 'guest',
      company: 'External Company',
      department: ''
    }
  },

  // 프로젝트 데이터
  projects: {
    existing: {
      id: '1',
      name: '2025 브랜드 캠페인',
      description: '2025년 신규 브랜드 캠페인 영상 프로젝트',
      category: 'marketing',
      status: 'in_progress',
      deadline: '2025-06-30',
      owner: 'pm@videoplanet.com',
      members: [
        { email: 'reviewer@videoplanet.com', role: 'reviewer' },
        { email: 'editor@videoplanet.com', role: 'editor' },
        { email: 'member@videoplanet.com', role: 'viewer' }
      ],
      videoUrl: '/sample-videos/campaign.mp4',
      thumbnailUrl: '/sample-videos/campaign-thumb.jpg',
      duration: 180, // 3분
      feedbackCount: 15,
      resolvedCount: 8,
      pendingCount: 7
    },
    withVideo: {
      id: '2',
      name: '제품 소개 영상',
      description: '신제품 런칭을 위한 소개 영상',
      category: 'product',
      status: 'in_progress',
      deadline: '2025-05-15',
      owner: 'pm@videoplanet.com',
      videoUrl: '/sample-videos/product.mp4',
      duration: 120, // 2분
      feedbackCount: 8,
      resolvedCount: 3,
      pendingCount: 5
    },
    toDelete: {
      id: '3',
      name: '테스트 프로젝트 (삭제용)',
      description: '삭제 테스트를 위한 프로젝트',
      category: 'test',
      status: 'draft',
      deadline: '2025-12-31',
      owner: 'admin@videoplanet.com'
    },
    template: {
      marketing: {
        name: '마케팅 캠페인 템플릿',
        description: '마케팅 캠페인용 표준 템플릿',
        category: 'marketing',
        tasks: [
          '스토리보드 작성',
          '촬영',
          '편집',
          '색보정',
          '사운드 믹싱',
          '최종 검수'
        ]
      },
      training: {
        name: '교육 영상 템플릿',
        description: '교육 콘텐츠용 표준 템플릿',
        category: 'training',
        tasks: [
          '커리큘럼 기획',
          '스크립트 작성',
          '녹화',
          '편집',
          '자막 추가',
          '퀴즈 생성'
        ]
      }
    }
  },

  // 피드백 데이터
  feedbacks: {
    sample: [
      {
        id: 'feedback-1',
        title: '인트로 부분 수정 필요',
        description: '인트로 애니메이션이 너무 빠릅니다. 속도를 조정해주세요.',
        timestamp: 5,
        priority: 'high',
        status: 'pending',
        category: 'visual',
        author: 'reviewer@videoplanet.com',
        createdAt: '2025-01-20T10:00:00Z',
        comments: 3,
        reactions: {
          like: 2,
          dislike: 0,
          question: 1
        }
      },
      {
        id: 'feedback-2',
        title: '배경 음악 볼륨 조절',
        description: '배경 음악이 너무 커서 나레이션이 잘 안들립니다.',
        timestamp: 45,
        priority: 'medium',
        status: 'resolved',
        category: 'audio',
        author: 'member@videoplanet.com',
        createdAt: '2025-01-20T11:30:00Z',
        comments: 2,
        reactions: {
          like: 3,
          dislike: 0,
          question: 0
        }
      },
      {
        id: 'feedback-3',
        title: '자막 오타 수정',
        description: '"제품"이 "재품"으로 잘못 표기되어 있습니다.',
        timestamp: 72,
        priority: 'low',
        status: 'pending',
        category: 'text',
        author: 'editor@videoplanet.com',
        createdAt: '2025-01-20T14:00:00Z',
        comments: 1,
        reactions: {
          like: 1,
          dislike: 0,
          question: 0
        }
      },
      {
        id: 'feedback-4',
        title: '색상 보정 필요',
        description: '전체적으로 색온도가 너무 차갑습니다. 따뜻한 톤으로 조정 부탁드립니다.',
        timestamp: 90,
        priority: 'high',
        status: 'in_progress',
        category: 'visual',
        author: 'reviewer@videoplanet.com',
        createdAt: '2025-01-21T09:00:00Z',
        comments: 5,
        reactions: {
          like: 4,
          dislike: 0,
          question: 2
        }
      },
      {
        id: 'feedback-5',
        title: '전환 효과 개선',
        description: '장면 전환이 너무 급작스럽습니다. 페이드 효과를 추가해주세요.',
        timestamp: 110,
        priority: 'medium',
        status: 'pending',
        category: 'visual',
        author: 'pm@videoplanet.com',
        createdAt: '2025-01-21T10:30:00Z',
        comments: 2,
        reactions: {
          like: 2,
          dislike: 1,
          question: 0
        }
      }
    ]
  },

  // 코멘트 데이터
  comments: {
    sample: [
      {
        id: 'comment-1',
        feedbackId: 'feedback-1',
        text: '저도 같은 생각입니다. 인트로가 너무 빠르게 지나가네요.',
        author: 'editor@videoplanet.com',
        createdAt: '2025-01-20T10:30:00Z',
        isEdited: false,
        reactions: {
          like: 1,
          dislike: 0,
          question: 0
        },
        replies: [
          {
            id: 'reply-1',
            text: '2초 정도 더 길게 유지하면 좋을 것 같습니다.',
            author: 'reviewer@videoplanet.com',
            createdAt: '2025-01-20T10:45:00Z'
          }
        ]
      },
      {
        id: 'comment-2',
        feedbackId: 'feedback-1',
        text: '@editor 님 의견에 동의합니다. 수정하겠습니다.',
        author: 'pm@videoplanet.com',
        createdAt: '2025-01-20T11:00:00Z',
        isEdited: true,
        editedAt: '2025-01-20T11:05:00Z',
        reactions: {
          like: 2,
          dislike: 0,
          question: 0
        }
      }
    ]
  },

  // 초대 데이터
  invitations: {
    pending: [
      {
        id: 'invite-1',
        email: 'newuser1@example.com',
        role: 'reviewer',
        projectId: '1',
        status: 'pending',
        sentAt: '2025-01-20T15:00:00Z',
        expiresAt: '2025-01-27T15:00:00Z'
      },
      {
        id: 'invite-2',
        email: 'newuser2@example.com',
        role: 'viewer',
        projectId: '1',
        status: 'pending',
        sentAt: '2025-01-21T10:00:00Z',
        expiresAt: '2025-01-28T10:00:00Z'
      }
    ],
    accepted: [
      {
        id: 'invite-3',
        email: 'accepted@example.com',
        role: 'editor',
        projectId: '2',
        status: 'accepted',
        sentAt: '2025-01-15T10:00:00Z',
        acceptedAt: '2025-01-15T14:00:00Z'
      }
    ]
  },

  // 알림 데이터
  notifications: {
    unread: [
      {
        id: 'notif-1',
        type: 'feedback',
        title: '새로운 피드백이 추가되었습니다',
        message: '프로젝트 "2025 브랜드 캠페인"에 새로운 피드백이 추가되었습니다.',
        priority: 'high',
        isRead: false,
        createdAt: '2025-01-24T09:00:00Z',
        link: '/projects/1/feedback#feedback-5'
      },
      {
        id: 'notif-2',
        type: 'comment',
        title: '코멘트에 멘션되었습니다',
        message: '@reviewer 님이 코멘트에서 회원님을 멘션했습니다.',
        priority: 'medium',
        isRead: false,
        createdAt: '2025-01-24T10:30:00Z',
        link: '/projects/1/feedback#comment-3'
      },
      {
        id: 'notif-3',
        type: 'project',
        title: '프로젝트 마감일 임박',
        message: '프로젝트 "제품 소개 영상"의 마감일이 3일 남았습니다.',
        priority: 'urgent',
        isRead: false,
        createdAt: '2025-01-24T08:00:00Z',
        link: '/projects/2'
      }
    ],
    read: [
      {
        id: 'notif-4',
        type: 'invitation',
        title: '프로젝트 초대가 수락되었습니다',
        message: 'newuser@example.com 님이 프로젝트 초대를 수락했습니다.',
        priority: 'low',
        isRead: true,
        readAt: '2025-01-23T16:00:00Z',
        createdAt: '2025-01-23T15:30:00Z',
        link: '/projects/1/team'
      }
    ]
  },

  // 파일 경로
  files: {
    videos: {
      sample: './test/fixtures/files/sample-video.mp4',
      large: './test/fixtures/files/large-video.mp4',
      invalid: './test/fixtures/files/invalid-file.txt'
    },
    images: {
      screenshot: './test/fixtures/files/screenshot.png',
      thumbnail: './test/fixtures/files/thumbnail.jpg',
      logo: './test/fixtures/files/logo.svg'
    },
    documents: {
      script: './test/fixtures/files/script.pdf',
      storyboard: './test/fixtures/files/storyboard.pdf'
    }
  },

  // API 엔드포인트
  api: {
    auth: {
      login: '/api/users/login',
      logout: '/api/users/logout',
      register: '/api/users/register',
      resetPassword: '/api/users/reset-password',
      verifyEmail: '/api/users/verify-email'
    },
    projects: {
      list: '/api/projects',
      create: '/api/projects',
      get: (id: string) => `/api/projects/${id}`,
      update: (id: string) => `/api/projects/${id}`,
      delete: (id: string) => `/api/projects/${id}`,
      team: (id: string) => `/api/projects/${id}/team`,
      invite: (id: string) => `/api/projects/${id}/invite`
    },
    feedbacks: {
      list: (projectId: string) => `/api/projects/${projectId}/feedbacks`,
      create: (projectId: string) => `/api/projects/${projectId}/feedbacks`,
      get: (projectId: string, feedbackId: string) => `/api/projects/${projectId}/feedbacks/${feedbackId}`,
      update: (projectId: string, feedbackId: string) => `/api/projects/${projectId}/feedbacks/${feedbackId}`,
      delete: (projectId: string, feedbackId: string) => `/api/projects/${projectId}/feedbacks/${feedbackId}`
    },
    comments: {
      list: (feedbackId: string) => `/api/feedbacks/${feedbackId}/comments`,
      create: (feedbackId: string) => `/api/feedbacks/${feedbackId}/comments`,
      update: (commentId: string) => `/api/comments/${commentId}`,
      delete: (commentId: string) => `/api/comments/${commentId}`,
      react: (commentId: string) => `/api/comments/${commentId}/reactions`
    },
    notifications: {
      list: '/api/notifications',
      markRead: (id: string) => `/api/notifications/${id}/read`,
      markAllRead: '/api/notifications/mark-all-read'
    },
    dashboard: {
      stats: '/api/dashboard/stats',
      activity: '/api/dashboard/activity',
      progress: '/api/dashboard/progress'
    }
  },

  // WebSocket 이벤트
  websocket: {
    events: {
      feedback: {
        new: 'feedback:new',
        update: 'feedback:update',
        delete: 'feedback:delete',
        statusChange: 'feedback:status-change'
      },
      comment: {
        new: 'comment:new',
        update: 'comment:update',
        delete: 'comment:delete',
        reaction: 'comment:reaction'
      },
      project: {
        update: 'project:update',
        memberJoin: 'project:member-join',
        memberLeave: 'project:member-leave'
      },
      user: {
        typing: 'user:typing',
        stoppedTyping: 'user:stopped-typing',
        online: 'user:online',
        offline: 'user:offline'
      }
    }
  },

  // 테스트 설정
  config: {
    timeouts: {
      short: 5000,
      medium: 10000,
      long: 30000,
      upload: 60000
    },
    retries: {
      api: 3,
      ui: 2
    },
    viewport: {
      desktop: { width: 1920, height: 1080 },
      tablet: { width: 768, height: 1024 },
      mobile: { width: 375, height: 667 }
    }
  }
};

// 동적 데이터 생성 함수들
export const generateTestData = {
  // 랜덤 프로젝트 생성
  randomProject: () => ({
    name: `Test Project ${Date.now()}`,
    description: `자동 생성된 테스트 프로젝트입니다. (${new Date().toISOString()})`,
    category: ['marketing', 'product', 'training', 'event'][Math.floor(Math.random() * 4)],
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }),

  // 랜덤 피드백 생성
  randomFeedback: () => ({
    title: `피드백 ${Date.now()}`,
    description: '테스트 피드백 내용입니다.',
    timestamp: Math.floor(Math.random() * 180),
    priority: ['low', 'medium', 'high', 'urgent'][Math.floor(Math.random() * 4)] as any,
    category: ['visual', 'audio', 'text', 'general'][Math.floor(Math.random() * 4)]
  }),

  // 랜덤 사용자 생성
  randomUser: () => ({
    name: `테스트유저${Math.floor(Math.random() * 10000)}`,
    email: `test${Date.now()}@example.com`,
    password: 'Test1234!@#',
    company: 'Test Company',
    role: ['viewer', 'reviewer', 'editor'][Math.floor(Math.random() * 3)]
  }),

  // 벌크 데이터 생성
  bulkEmails: (count: number) => {
    const emails = [];
    for (let i = 0; i < count; i++) {
      emails.push(`user${i + 1}@example.com`);
    }
    return emails;
  }
};