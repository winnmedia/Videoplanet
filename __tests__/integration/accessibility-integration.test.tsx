/**
 * 접근성 통합 테스트
 * axe-core를 사용한 자동화된 접근성 검사
 */

import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { BrowserRouter } from 'react-router-dom';

// Mock components
import HomePage from '@/app/page';
import LoginPage from '@/app/(auth)/login/page';
import DashboardPage from '@/app/(main)/dashboard/page';
import ProjectsPage from '@/app/(main)/projects/page';

// axe-core matchers 추가
expect.extend(toHaveNoViolations);

const mockStore = configureStore({
  reducer: {
    auth: (state = { isAuthenticated: false, user: null }) => state,
    projects: (state = { items: [], loading: false }) => state,
  },
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={mockStore}>
    <BrowserRouter>
      {children}
    </BrowserRouter>
  </Provider>
);

describe('접근성 통합 테스트', () => {
  describe('자동화된 접근성 검사', () => {
    it('홈페이지가 접근성 기준을 만족해야 한다', async () => {
      const { container } = render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('로그인 페이지가 접근성 기준을 만족해야 한다', async () => {
      const { container } = render(
        <TestWrapper>
          <LoginPage />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('대시보드가 접근성 기준을 만족해야 한다', async () => {
      const { container } = render(
        <TestWrapper>
          <DashboardPage />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('프로젝트 목록 페이지가 접근성 기준을 만족해야 한다', async () => {
      const { container } = render(
        <TestWrapper>
          <ProjectsPage />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('색상 대비 테스트', () => {
    it('기본 텍스트 색상 대비가 WCAG AA 기준을 만족해야 한다', async () => {
      const { container } = render(
        <TestWrapper>
          <HomePage />
        </TestWrapper>
      );

      // 색상 대비 관련 규칙만 실행
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
          'color-contrast-enhanced': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('버튼과 링크 색상 대비가 적절해야 한다', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <button 
              data-testid="primary-button"
              style={{ 
                backgroundColor: '#1631F8', 
                color: '#FFFFFF',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px'
              }}
            >
              기본 버튼
            </button>
            <a 
              href="#"
              data-testid="primary-link"
              style={{ 
                color: '#1631F8',
                textDecoration: 'underline'
              }}
            >
              기본 링크
            </a>
          </div>
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('키보드 네비게이션 테스트', () => {
    it('모든 상호작용 요소가 키보드로 접근 가능해야 한다', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <button data-testid="button1">버튼 1</button>
            <input data-testid="input1" placeholder="입력 필드" />
            <a href="#" data-testid="link1">링크 1</a>
            <select data-testid="select1">
              <option>옵션 1</option>
              <option>옵션 2</option>
            </select>
          </div>
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'keyboard': { enabled: true },
          'focus-order-semantics': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('포커스 순서가 논리적이어야 한다', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <h1>페이지 제목</h1>
            <nav>
              <a href="#main" data-testid="skip-link">본문으로 건너뛰기</a>
              <ul>
                <li><a href="/home">홈</a></li>
                <li><a href="/about">소개</a></li>
                <li><a href="/contact">연락처</a></li>
              </ul>
            </nav>
            <main id="main">
              <h2>메인 콘텐츠</h2>
              <button>액션 버튼</button>
            </main>
          </div>
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'tabindex': { enabled: true },
          'focus-order-semantics': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('의미론적 마크업 테스트', () => {
    it('적절한 헤딩 구조를 가져야 한다', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <h1>메인 제목</h1>
            <section>
              <h2>섹션 제목</h2>
              <h3>하위 제목</h3>
              <p>내용</p>
            </section>
            <section>
              <h2>다른 섹션</h2>
              <h3>하위 제목</h3>
            </section>
          </div>
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'heading-order': { enabled: true },
          'empty-heading': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('랜드마크 요소가 적절히 사용되어야 한다', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <header role="banner">
              <nav role="navigation" aria-label="주 네비게이션">
                <ul>
                  <li><a href="/home">홈</a></li>
                  <li><a href="/about">소개</a></li>
                </ul>
              </nav>
            </header>
            <main role="main">
              <h1>메인 콘텐츠</h1>
              <p>내용</p>
            </main>
            <footer role="contentinfo">
              <p>푸터 내용</p>
            </footer>
          </div>
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'landmark-one-main': { enabled: true },
          'landmark-unique': { enabled: true },
          'landmark-banner-is-top-level': { enabled: true },
          'landmark-contentinfo-is-top-level': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('폼 접근성 테스트', () => {
    it('폼 필드에 적절한 레이블이 있어야 한다', async () => {
      const { container } = render(
        <TestWrapper>
          <form>
            <label htmlFor="email">이메일 주소</label>
            <input 
              id="email" 
              type="email" 
              required 
              aria-describedby="email-help"
            />
            <div id="email-help">유효한 이메일 주소를 입력하세요</div>

            <label htmlFor="password">비밀번호</label>
            <input 
              id="password" 
              type="password" 
              required 
              aria-describedby="password-help"
            />
            <div id="password-help">최소 8자 이상이어야 합니다</div>

            <button type="submit">제출</button>
          </form>
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'label': { enabled: true },
          'label-title-only': { enabled: true },
          'form-field-multiple-labels': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('에러 메시지가 적절히 연결되어야 한다', async () => {
      const { container } = render(
        <TestWrapper>
          <form>
            <label htmlFor="email-error">이메일 주소</label>
            <input 
              id="email-error" 
              type="email" 
              aria-invalid="true"
              aria-describedby="email-error-msg"
            />
            <div 
              id="email-error-msg" 
              role="alert"
              aria-live="assertive"
            >
              올바른 이메일 주소를 입력해주세요
            </div>
          </form>
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'aria-valid-attr-value': { enabled: true },
          'aria-describedby': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('이미지 및 미디어 접근성', () => {
    it('이미지에 적절한 alt 텍스트가 있어야 한다', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <img 
              src="/logo.png" 
              alt="VideoPlanet 로고" 
              data-testid="logo"
            />
            <img 
              src="/decoration.png" 
              alt="" 
              role="presentation"
              data-testid="decoration"
            />
            <img 
              src="/chart.png" 
              alt="2024년 사용자 증가율을 보여주는 차트: 전년 대비 150% 증가"
              data-testid="chart"
            />
          </div>
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'image-alt': { enabled: true },
          'image-redundant-alt': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('비디오에 자막과 설명이 제공되어야 한다', async () => {
      const { container } = render(
        <TestWrapper>
          <video controls data-testid="demo-video">
            <source src="/demo.mp4" type="video/mp4" />
            <track 
              kind="captions" 
              src="/demo-captions.vtt" 
              srcLang="ko" 
              label="한국어 자막"
              default
            />
            <track 
              kind="descriptions" 
              src="/demo-descriptions.vtt" 
              srcLang="ko" 
              label="한국어 화면 해설"
            />
            이 브라우저는 비디오를 지원하지 않습니다.
          </video>
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'video-caption': { enabled: true },
          'video-description': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('동적 콘텐츠 접근성', () => {
    it('라이브 영역이 적절히 설정되어야 한다', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <div 
              aria-live="polite" 
              aria-label="상태 업데이트"
              data-testid="status-updates"
            >
              프로젝트가 저장되었습니다.
            </div>
            <div 
              aria-live="assertive" 
              role="alert"
              data-testid="error-alerts"
            >
              오류가 발생했습니다.
            </div>
          </div>
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'aria-live-region': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('모달 다이얼로그가 적절한 ARIA 속성을 가져야 한다', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <button data-testid="open-modal">모달 열기</button>
            <div 
              role="dialog" 
              aria-modal="true"
              aria-labelledby="modal-title"
              aria-describedby="modal-description"
              data-testid="modal"
            >
              <h2 id="modal-title">모달 제목</h2>
              <p id="modal-description">모달 설명</p>
              <button data-testid="close-modal">닫기</button>
            </div>
          </div>
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'aria-dialog-name': { enabled: true },
          'aria-modal': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('모바일 접근성', () => {
    it('터치 타겟이 충분한 크기를 가져야 한다', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <button 
              style={{ 
                minWidth: '44px', 
                minHeight: '44px',
                padding: '12px',
                margin: '8px'
              }}
              data-testid="touch-button"
            >
              터치 버튼
            </button>
            <a 
              href="#"
              style={{ 
                display: 'inline-block',
                minWidth: '44px', 
                minHeight: '44px',
                padding: '12px',
                margin: '8px'
              }}
              data-testid="touch-link"
            >
              터치 링크
            </a>
          </div>
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'target-size': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('국제화 접근성', () => {
    it('언어 속성이 적절히 설정되어야 한다', async () => {
      const { container } = render(
        <div lang="ko">
          <TestWrapper>
            <div>
              <p>한국어 텍스트입니다.</p>
              <p lang="en">This is English text.</p>
              <p lang="ja">これは日本語のテキストです。</p>
            </div>
          </TestWrapper>
        </div>
      );

      const results = await axe(container, {
        rules: {
          'html-has-lang': { enabled: true },
          'html-lang-valid': { enabled: true },
          'valid-lang': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });

    it('텍스트 방향이 적절히 설정되어야 한다', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <p dir="ltr">Left-to-right text</p>
            <p dir="rtl">نص من اليمين إلى اليسار</p>
          </div>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});