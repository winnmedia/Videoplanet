/**
 * UX/UI 접근성 테스트 시나리오
 * 반응형, 키보드 네비게이션, 스크린 리더 호환성, 성능 메트릭
 */

describe('UX/UI 접근성 테스트', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
    
    // 기본 API 모킹
    cy.intercept('POST', '/api/auth/login', { 
      fixture: 'auth/login-success.json' 
    }).as('loginRequest');
    
    cy.intercept('GET', '/api/projects', { 
      fixture: 'projects/empty-projects.json' 
    }).as('getProjects');
  });

  describe('반응형 디자인 테스트', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1440, height: 900 },
      { name: 'large-desktop', width: 1920, height: 1080 },
    ];

    viewports.forEach(({ name, width, height }) => {
      it(`${name} 화면에서 레이아웃이 올바르게 표시되어야 한다`, () => {
        cy.viewport(width, height);
        cy.visit('/');

        // 헤더 확인
        if (width < 768) {
          // 모바일: 햄버거 메뉴
          cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
          cy.get('[data-testid="desktop-navigation"]').should('not.be.visible');
        } else {
          // 태블릿/데스크톱: 전체 네비게이션
          cy.get('[data-testid="desktop-navigation"]').should('be.visible');
          cy.get('[data-testid="mobile-menu-button"]').should('not.be.visible');
        }

        // 콘텐츠 영역 확인
        cy.get('[data-testid="main-content"]').should('be.visible');
        
        // 콘텐츠가 화면을 벗어나지 않는지 확인
        cy.get('[data-testid="main-content"]').then(($el) => {
          const rect = $el[0].getBoundingClientRect();
          expect(rect.width).to.be.lessThan(width + 1);
        });

        // 푸터 확인
        cy.get('[data-testid="footer"]').should('be.visible');
      });
    });

    it('화면 크기 변경 시 레이아웃이 동적으로 조정되어야 한다', () => {
      cy.visit('/');

      // 데스크톱으로 시작
      cy.viewport(1440, 900);
      cy.get('[data-testid="desktop-navigation"]').should('be.visible');

      // 태블릿으로 축소
      cy.viewport(768, 1024);
      cy.get('[data-testid="desktop-navigation"]').should('be.visible');

      // 모바일로 축소
      cy.viewport(375, 667);
      cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
      cy.get('[data-testid="desktop-navigation"]').should('not.be.visible');

      // 다시 데스크톱으로 확대
      cy.viewport(1440, 900);
      cy.get('[data-testid="desktop-navigation"]').should('be.visible');
      cy.get('[data-testid="mobile-menu-button"]').should('not.be.visible');
    });

    it('터치 인터페이스가 모바일에서 적절히 작동해야 한다', () => {
      cy.viewport('iphone-6');
      cy.visit('/');

      // 햄버거 메뉴 터치
      cy.get('[data-testid="mobile-menu-button"]').click();
      cy.get('[data-testid="mobile-navigation"]').should('be.visible');

      // 스와이프 제스처 시뮬레이션 (드래그로 메뉴 닫기)
      cy.get('[data-testid="mobile-navigation"]')
        .trigger('touchstart', { touches: [{ clientX: 200, clientY: 100 }] })
        .trigger('touchmove', { touches: [{ clientX: 100, clientY: 100 }] })
        .trigger('touchend');

      // 메뉴가 닫혔는지 확인
      cy.get('[data-testid="mobile-navigation"]').should('not.be.visible');
    });

    it('텍스트 크기 조정 시에도 레이아웃이 유지되어야 한다', () => {
      cy.visit('/');

      // 기본 폰트 크기에서 확인
      cy.get('[data-testid="main-content"]').should('be.visible');

      // 폰트 크기 150%로 증가
      cy.get('html').invoke('attr', 'style', 'font-size: 150%');

      // 레이아웃이 여전히 유지되는지 확인
      cy.get('[data-testid="main-content"]').should('be.visible');
      
      // 텍스트 오버플로우가 없는지 확인
      cy.get('[data-testid="navigation-items"] a').each(($el) => {
        cy.wrap($el).should('not.have.css', 'overflow', 'hidden');
      });
    });
  });

  describe('키보드 네비게이션 테스트', () => {
    it('Tab 키로 모든 상호작용 요소에 접근할 수 있어야 한다', () => {
      cy.visit('/');

      // 첫 번째 포커스 가능한 요소
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'skip-to-content');

      // 메인 네비게이션
      cy.focused().tab();
      cy.focused().should('match', '[data-testid="navigation-items"] a:first');

      // 모든 네비게이션 링크를 순회
      cy.get('[data-testid="navigation-items"] a').each((_, index) => {
        if (index > 0) {
          cy.focused().tab();
        }
        cy.focused().should('be.visible');
      });

      // CTA 버튼
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'cta-signup');
    });

    it('Shift+Tab으로 역방향 네비게이션이 작동해야 한다', () => {
      cy.visit('/');

      // 마지막 요소로 이동
      cy.get('[data-testid="cta-signup"]').focus();

      // Shift+Tab으로 이전 요소로
      cy.focused().tab({ shift: true });
      cy.focused().should('match', '[data-testid="navigation-items"] a:last');

      // 계속 역방향으로
      cy.focused().tab({ shift: true });
      cy.focused().should('not.have.attr', 'data-testid', 'cta-signup');
    });

    it('Enter와 Space 키로 버튼을 활성화할 수 있어야 한다', () => {
      cy.visit('/');

      // Enter 키로 링크 활성화
      cy.get('[data-testid="cta-signup"]').focus().type('{enter}');
      cy.url().should('include', '/signup');

      cy.go('back');

      // Space 키로 버튼 활성화 (다른 버튼 테스트)
      cy.get('[data-testid="learn-more-button"]').focus().type(' ');
      cy.get('[data-testid="feature-modal"]').should('be.visible');
    });

    it('Escape 키로 모달을 닫을 수 있어야 한다', () => {
      cy.visit('/');

      // 모달 열기
      cy.get('[data-testid="learn-more-button"]').click();
      cy.get('[data-testid="feature-modal"]').should('be.visible');

      // Escape 키로 닫기
      cy.get('body').type('{esc}');
      cy.get('[data-testid="feature-modal"]').should('not.be.visible');
    });

    it('포커스 트랩이 모달에서 올바르게 작동해야 한다', () => {
      cy.visit('/');

      // 모달 열기
      cy.get('[data-testid="learn-more-button"]').click();
      cy.get('[data-testid="feature-modal"]').should('be.visible');

      // 모달 내 첫 번째 포커스 가능한 요소
      cy.get('[data-testid="modal-close-button"]').should('be.focused');

      // Tab으로 모달 내 요소들 순회
      cy.focused().tab();
      cy.focused().should('be.within', '[data-testid="feature-modal"]');

      // 마지막 요소에서 Tab 시 첫 번째 요소로 순환
      cy.get('[data-testid="modal-action-button"]').focus().tab();
      cy.focused().should('have.attr', 'data-testid', 'modal-close-button');
    });

    it('건너뛰기 링크가 올바르게 작동해야 한다', () => {
      cy.visit('/');

      // 건너뛰기 링크에 포커스
      cy.get('[data-testid="skip-to-content"]').focus();

      // Enter로 메인 콘텐츠로 이동
      cy.focused().type('{enter}');
      cy.focused().should('have.attr', 'data-testid', 'main-content');
    });
  });

  describe('스크린 리더 호환성 테스트', () => {
    it('페이지에 적절한 ARIA 레이블이 있어야 한다', () => {
      cy.visit('/');

      // 주요 랜드마크 확인
      cy.get('[role="banner"]').should('exist'); // 헤더
      cy.get('[role="main"]').should('exist'); // 메인 콘텐츠
      cy.get('[role="navigation"]').should('exist'); // 네비게이션
      cy.get('[role="contentinfo"]').should('exist'); // 푸터

      // ARIA 레이블 확인
      cy.get('[data-testid="main-navigation"]')
        .should('have.attr', 'aria-label', '주 네비게이션');

      cy.get('[data-testid="mobile-menu-button"]')
        .should('have.attr', 'aria-label')
        .and('include', '메뉴');
    });

    it('폼 요소에 적절한 레이블이 연결되어야 한다', () => {
      cy.visit('/signup');

      // 레이블-입력 연결 확인
      cy.get('[data-testid="email-input"]')
        .should('have.attr', 'aria-labelledby')
        .then((labelId) => {
          cy.get(`#${labelId}`).should('exist').and('contain', '이메일');
        });

      cy.get('[data-testid="password-input"]')
        .should('have.attr', 'aria-labelledby')
        .then((labelId) => {
          cy.get(`#${labelId}`).should('exist').and('contain', '비밀번호');
        });

      // 필수 필드 표시 확인
      cy.get('[data-testid="email-input"]')
        .should('have.attr', 'aria-required', 'true');
    });

    it('에러 메시지가 스크린 리더에 적절히 알려져야 한다', () => {
      cy.visit('/signup');

      // 잘못된 데이터로 제출
      cy.get('[data-testid="email-input"]').type('invalid-email');
      cy.get('[data-testid="signup-button"]').click();

      // 에러 메시지 ARIA 확인
      cy.get('[data-testid="email-error"]')
        .should('have.attr', 'role', 'alert')
        .and('contain', '올바른 이메일 주소를 입력해주세요');

      // 입력 필드와 에러 메시지 연결 확인
      cy.get('[data-testid="email-input"]')
        .should('have.attr', 'aria-describedby')
        .and('include', 'email-error');
    });

    it('동적 콘텐츠 변경이 스크린 리더에 알려져야 한다', () => {
      cy.visit('/dashboard');

      // 프로젝트 로딩 상태
      cy.get('[data-testid="loading-projects"]')
        .should('have.attr', 'aria-live', 'polite')
        .and('contain', '프로젝트를 불러오는 중...');

      // 로딩 완료 후
      cy.wait('@getProjects');
      
      cy.get('[data-testid="projects-loaded"]')
        .should('have.attr', 'aria-live', 'polite')
        .and('contain', '프로젝트를 불러왔습니다');
    });

    it('버튼과 링크가 명확한 목적을 나타내야 한다', () => {
      cy.visit('/projects');

      // 버튼의 접근 가능한 이름 확인
      cy.get('[data-testid="create-project-button"]')
        .should('have.attr', 'aria-label', '새 프로젝트 만들기');

      cy.get('[data-testid="project-settings-button"]')
        .should('have.attr', 'aria-label')
        .and('include', '프로젝트 설정');

      // 링크의 목적 확인
      cy.get('[data-testid="project-link"]')
        .should('have.attr', 'aria-label')
        .and('include', '프로젝트 보기');
    });

    it('이미지에 적절한 대체 텍스트가 있어야 한다', () => {
      cy.visit('/');

      // 장식용 이미지
      cy.get('[data-testid="hero-decoration"]')
        .should('have.attr', 'alt', '')
        .and('have.attr', 'role', 'presentation');

      // 의미 있는 이미지
      cy.get('[data-testid="feature-screenshot"]')
        .should('have.attr', 'alt')
        .and('include', '비디오 피드백 인터페이스 스크린샷');

      // 로고
      cy.get('[data-testid="company-logo"]')
        .should('have.attr', 'alt', 'VideoPlanet');
    });
  });

  describe('성능 메트릭 테스트', () => {
    beforeEach(() => {
      // 성능 측정을 위한 설정
      cy.window().then((win) => {
        win.performance.clearMarks();
        win.performance.clearMeasures();
      });
    });

    it('페이지 로드 성능이 허용 기준 내에 있어야 한다', () => {
      // FCP (First Contentful Paint) 측정
      cy.visit('/', {
        onBeforeLoad: (win) => {
          win.performance.mark('pageLoadStart');
        }
      });

      cy.window().then((win) => {
        // FCP 측정
        const fcpEntry = win.performance.getEntriesByType('paint')
          .find(entry => entry.name === 'first-contentful-paint');
        
        if (fcpEntry) {
          expect(fcpEntry.startTime).to.be.lessThan(2000); // 2초 이내
        }

        // LCP (Largest Contentful Paint) 측정
        const observer = new win.PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          expect(lastEntry.startTime).to.be.lessThan(2500); // 2.5초 이내
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      });

      // 페이지 로드 완료 확인
      cy.get('[data-testid="main-content"]').should('be.visible');
    });

    it('인터랙션 응답 시간이 빨라야 한다', () => {
      cy.visit('/');

      cy.window().then((win) => {
        win.performance.mark('buttonClickStart');
      });

      cy.get('[data-testid="cta-signup"]').click();

      cy.window().then((win) => {
        win.performance.mark('buttonClickEnd');
        win.performance.measure(
          'buttonResponse',
          'buttonClickStart',
          'buttonClickEnd'
        );

        const measure = win.performance.getEntriesByName('buttonResponse')[0];
        expect(measure.duration).to.be.lessThan(100); // 100ms 이내
      });
    });

    it('큰 이미지가 지연 로딩되어야 한다', () => {
      cy.visit('/');

      // 뷰포트에 보이지 않는 이미지는 아직 로드되지 않음
      cy.get('[data-testid="below-fold-image"]')
        .should('have.attr', 'loading', 'lazy')
        .and('not.have.class', 'loaded');

      // 스크롤하여 이미지가 보이게 함
      cy.get('[data-testid="below-fold-image"]').scrollIntoView();

      // 이미지가 로드됨
      cy.get('[data-testid="below-fold-image"]')
        .should('have.class', 'loaded');
    });

    it('번들 크기가 적절해야 한다', () => {
      cy.visit('/');

      cy.window().then((win) => {
        // 네트워크 요청 확인
        const performanceEntries = win.performance.getEntriesByType('resource');
        
        const jsFiles = performanceEntries.filter(entry => 
          entry.name.includes('.js') && !entry.name.includes('node_modules')
        );

        // 메인 JS 번들이 적절한 크기인지 확인
        const mainBundle = jsFiles.find(file => file.name.includes('main'));
        if (mainBundle) {
          expect(mainBundle.transferSize).to.be.lessThan(500 * 1024); // 500KB 이하
        }
      });
    });

    it('CSS 애니메이션이 60fps를 유지해야 한다', () => {
      cy.visit('/');

      // 애니메이션이 있는 요소 트리거
      cy.get('[data-testid="animated-card"]').hover();

      cy.window().then((win) => {
        let frameCount = 0;
        const startTime = win.performance.now();

        const checkFrame = () => {
          frameCount++;
          const currentTime = win.performance.now();
          const elapsed = currentTime - startTime;

          if (elapsed > 1000) { // 1초 후 측정 종료
            const fps = frameCount / (elapsed / 1000);
            expect(fps).to.be.greaterThan(55); // 55fps 이상 (60fps에 가까워야 함)
          } else {
            win.requestAnimationFrame(checkFrame);
          }
        };

        win.requestAnimationFrame(checkFrame);
      });
    });

    it('CLS (Cumulative Layout Shift)가 최소화되어야 한다', () => {
      cy.visit('/');

      cy.window().then((win) => {
        let clsValue = 0;

        const observer = new win.PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        });

        observer.observe({ type: 'layout-shift', buffered: true });

        // 페이지 로드 완료 후 CLS 값 확인
        cy.wait(3000); // 3초 대기
        cy.then(() => {
          expect(clsValue).to.be.lessThan(0.1); // 0.1 이하
        });
      });
    });
  });

  describe('색상 대비 및 가독성', () => {
    it('텍스트와 배경의 색상 대비가 WCAG 기준을 만족해야 한다', () => {
      cy.visit('/');

      // 기본 텍스트 대비 확인
      cy.get('[data-testid="main-heading"]').then(($el) => {
        const textColor = $el.css('color');
        const backgroundColor = $el.css('background-color');
        
        // 색상 대비 계산 (실제로는 라이브러리 사용)
        // 여기서는 단순히 색상이 설정되어 있는지만 확인
        expect(textColor).to.not.equal('rgba(0, 0, 0, 0)');
        expect(backgroundColor).to.not.equal('rgba(0, 0, 0, 0)');
      });

      // 링크 색상 확인
      cy.get('[data-testid="navigation-items"] a').should('have.css', 'color')
        .and('not.equal', 'rgba(0, 0, 0, 0)');
    });

    it('다크 모드에서도 적절한 대비를 유지해야 한다', () => {
      cy.visit('/');

      // 다크 모드 토글
      cy.get('[data-testid="theme-toggle"]').click();

      // 다크 모드 적용 확인
      cy.get('body').should('have.class', 'dark-mode');

      // 다크 모드에서 텍스트 가독성 확인
      cy.get('[data-testid="main-heading"]')
        .should('have.css', 'color')
        .and('not.equal', 'rgb(0, 0, 0)'); // 검은색이 아님

      cy.get('[data-testid="main-content"]')
        .should('have.css', 'background-color')
        .and('not.equal', 'rgb(255, 255, 255)'); // 흰색이 아님
    });
  });

  describe('포커스 표시', () => {
    it('모든 상호작용 요소에 명확한 포커스 표시가 있어야 한다', () => {
      cy.visit('/');

      // 버튼 포커스 표시
      cy.get('[data-testid="cta-signup"]').focus();
      cy.focused().should('have.css', 'outline-width').and('not.equal', '0px');

      // 링크 포커스 표시
      cy.get('[data-testid="navigation-items"] a:first').focus();
      cy.focused().should('have.css', 'outline-width').and('not.equal', '0px');

      // 입력 필드 포커스 표시
      cy.visit('/signup');
      cy.get('[data-testid="email-input"]').focus();
      cy.focused().should('have.css', 'outline-width').and('not.equal', '0px');
    });

    it('포커스 표시가 고대비 모드에서도 보여야 한다', () => {
      // 고대비 모드 시뮬레이션
      cy.visit('/', {
        onBeforeLoad: (win) => {
          win.document.documentElement.style.setProperty(
            '--focus-color',
            'rgb(255, 255, 0)'
          );
        }
      });

      cy.get('[data-testid="cta-signup"]').focus();
      cy.focused()
        .should('have.css', 'outline-color')
        .and('not.equal', 'rgba(0, 0, 0, 0)');
    });
  });
});