describe('Login Page E2E Tests', () => {
  beforeEach(() => {
    // 로컬 스토리지 초기화
    cy.clearLocalStorage()
    
    // 세션 쿠키 초기화
    cy.clearCookies()
    
    // 로그인 페이지 방문
    cy.visit('/login')
  })

  describe('Page Load and Rendering', () => {
    it('로그인 페이지가 올바르게 로드된다', () => {
      cy.contains('로그인').should('be.visible')
      cy.get('input[name="email"]').should('be.visible')
      cy.get('input[name="password"]').should('be.visible')
      cy.get('button[type="button"]').contains('로그인').should('be.visible')
      cy.contains('비밀번호 찾기').should('be.visible')
      cy.contains('간편 가입하기').should('be.visible')
    })

    it('입력 필드가 올바른 속성을 가진다', () => {
      cy.get('input[name="email"]')
        .should('have.attr', 'type', 'email')
        .should('have.attr', 'placeholder', '이메일')
        .should('have.attr', 'autocomplete', 'email')
      
      cy.get('input[name="password"]')
        .should('have.attr', 'type', 'password')
        .should('have.attr', 'placeholder', '비밀번호')
        .should('have.attr', 'autocomplete', 'current-password')
    })

    it('페이지 제목이 올바르게 설정된다', () => {
      cy.title().should('include', '로그인')
    })
  })

  describe('Form Interaction', () => {
    it('사용자가 이메일과 비밀번호를 입력할 수 있다', () => {
      const testEmail = 'test@example.com'
      const testPassword = 'password123'

      cy.get('input[name="email"]')
        .type(testEmail)
        .should('have.value', testEmail)
      
      cy.get('input[name="password"]')
        .type(testPassword)
        .should('have.value', testPassword)
    })

    it('Enter 키로 폼을 제출할 수 있다', () => {
      cy.intercept('POST', '**/users/login', { 
        fixture: 'auth/login-success.json' 
      }).as('loginRequest')

      cy.get('input[name="email"]').type('test@example.com')
      cy.get('input[name="password"]').type('password123{enter}')

      cy.wait('@loginRequest')
    })

    it('로그인 버튼 클릭으로 폼을 제출할 수 있다', () => {
      cy.intercept('POST', '**/users/login', { 
        fixture: 'auth/login-success.json' 
      }).as('loginRequest')

      cy.get('input[name="email"]').type('test@example.com')
      cy.get('input[name="password"]').type('password123')
      cy.get('button').contains('로그인').click()

      cy.wait('@loginRequest')
    })
  })

  describe('Form Validation', () => {
    it('이메일이 비어있으면 에러 메시지를 표시한다', () => {
      cy.get('button').contains('로그인').click()
      cy.contains('이메일을 입력해주세요.').should('be.visible')
    })

    it('비밀번호가 비어있으면 에러 메시지를 표시한다', () => {
      cy.get('input[name="email"]').type('test@example.com')
      cy.get('button').contains('로그인').click()
      cy.contains('비밀번호를 입력해주세요.').should('be.visible')
    })

    it('공백만 있는 입력은 무효하다', () => {
      cy.get('input[name="email"]').type('   ')
      cy.get('button').contains('로그인').click()
      cy.contains('이메일을 입력해주세요.').should('be.visible')
    })

    it('에러 메시지가 올바른 스타일로 표시된다', () => {
      cy.get('button').contains('로그인').click()
      cy.get('.error')
        .should('be.visible')
        .should('have.css', 'color', 'rgb(220, 53, 69)') // #dc3545
    })
  })

  describe('Successful Login', () => {
    beforeEach(() => {
      // 성공적인 로그인 응답 모킹
      cy.intercept('POST', '**/users/login', { 
        statusCode: 200,
        body: {
          vridge_session: {
            access: 'mock-access-token',
            refresh: 'mock-refresh-token'
          },
          user: {
            id: 1,
            email: 'test@example.com',
            name: 'Test User',
            company: 'Test Company'
          }
        }
      }).as('loginSuccess')
      
      // 프로젝트 데이터 모킹
      cy.intercept('GET', '**/projects/**', {
        statusCode: 200,
        body: { results: [] }
      }).as('fetchProjects')
    })

    it('유효한 자격 증명으로 로그인할 수 있다', () => {
      cy.get('input[name="email"]').type('test@example.com')
      cy.get('input[name="password"]').type('password123')
      cy.get('button').contains('로그인').click()

      cy.wait('@loginSuccess')
      
      // 로컬 스토리지에 토큰이 저장되는지 확인
      cy.window().its('localStorage').invoke('getItem', 'VGID').should('exist')
      
      // 대시보드로 리다이렉트되는지 확인
      cy.url().should('include', '/dashboard')
    })

    it('로그인 성공 후 사용자 정보가 저장된다', () => {
      cy.get('input[name="email"]').type('test@example.com')
      cy.get('input[name="password"]').type('password123')
      cy.get('button').contains('로그인').click()

      cy.wait('@loginSuccess')
      
      cy.window().then((window) => {
        const storedData = JSON.parse(window.localStorage.getItem('VGID'))
        expect(storedData).to.have.property('access')
        expect(storedData).to.have.property('refresh')
      })
    })
  })

  describe('Login Failure', () => {
    it('잘못된 자격 증명으로 로그인 시 에러 메시지를 표시한다', () => {
      cy.intercept('POST', '**/users/login', {
        statusCode: 401,
        body: {
          message: '이메일 또는 비밀번호가 일치하지 않습니다.'
        }
      }).as('loginFailure')

      cy.get('input[name="email"]').type('wrong@example.com')
      cy.get('input[name="password"]').type('wrongpassword')
      cy.get('button').contains('로그인').click()

      cy.wait('@loginFailure')
      cy.contains('이메일 또는 비밀번호가 일치하지 않습니다.').should('be.visible')
    })

    it('서버 에러 시 기본 에러 메시지를 표시한다', () => {
      cy.intercept('POST', '**/users/login', {
        statusCode: 500,
        body: {}
      }).as('serverError')

      cy.get('input[name="email"]').type('test@example.com')
      cy.get('input[name="password"]').type('password123')
      cy.get('button').contains('로그인').click()

      cy.wait('@serverError')
      cy.contains('이메일 또는 비밀번호가 일치하지 않습니다.').should('be.visible')
    })

    it('네트워크 에러 시 에러 메시지를 표시한다', () => {
      cy.intercept('POST', '**/users/login', { forceNetworkError: true }).as('networkError')

      cy.get('input[name="email"]').type('test@example.com')
      cy.get('input[name="password"]').type('password123')
      cy.get('button').contains('로그인').click()

      cy.wait('@networkError')
      cy.contains('이메일 또는 비밀번호가 일치하지 않습니다.').should('be.visible')
    })
  })

  describe('Loading State', () => {
    it('로그인 요청 중 로딩 상태를 표시한다', () => {
      cy.intercept('POST', '**/users/login', (req) => {
        req.reply((res) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(res.send({ 
                statusCode: 200, 
                body: { vridge_session: 'mock-token' } 
              }))
            }, 1000)
          })
        })
      }).as('slowLogin')

      cy.get('input[name="email"]').type('test@example.com')
      cy.get('input[name="password"]').type('password123')
      cy.get('button').contains('로그인').click()

      // 로딩 상태 확인
      cy.contains('로그인 중...').should('be.visible')
      cy.get('button').contains('로그인 중...').should('be.disabled')
      cy.get('input[name="email"]').should('be.disabled')
      cy.get('input[name="password"]').should('be.disabled')

      cy.wait('@slowLogin')
    })
  })

  describe('Navigation', () => {
    it('비밀번호 찾기 링크가 올바르게 작동한다', () => {
      cy.contains('비밀번호 찾기').click()
      cy.url().should('include', '/reset-password')
    })

    it('회원가입 링크가 올바르게 작동한다', () => {
      cy.contains('간편 가입하기').click()
      cy.url().should('include', '/signup')
    })
  })

  describe('Invitation Links', () => {
    it('초대 링크가 있는 상태에서 로그인하면 이메일 체크 페이지로 리다이렉트된다', () => {
      // 초대 파라미터와 함께 로그인 페이지 방문
      cy.visit('/login?uid=test-uid&token=test-token')
      
      cy.intercept('POST', '**/users/login', { 
        statusCode: 200,
        body: {
          vridge_session: {
            access: 'mock-access-token',
            refresh: 'mock-refresh-token'
          }
        }
      }).as('loginWithInvite')

      cy.get('input[name="email"]').type('test@example.com')
      cy.get('input[name="password"]').type('password123')
      cy.get('button').contains('로그인').click()

      cy.wait('@loginWithInvite')
      cy.url().should('include', '/email-check')
      cy.url().should('include', 'uid=test-uid')
      cy.url().should('include', 'token=test-token')
    })
  })

  describe('Already Authenticated', () => {
    it('이미 인증된 사용자는 대시보드로 리다이렉트된다', () => {
      // 로컬 스토리지에 토큰 설정
      cy.window().then((window) => {
        window.localStorage.setItem('VGID', JSON.stringify({
          access: 'valid-token',
          refresh: 'valid-refresh-token'
        }))
      })

      // checkSession이 true를 반환하도록 모킹
      cy.visit('/login')
      
      // 대시보드로 리다이렉트되는지 확인 (실제 구현에 따라 다를 수 있음)
      cy.url().should('include', '/dashboard')
    })
  })

  describe('Accessibility', () => {
    it('키보드로 모든 요소에 접근할 수 있다', () => {
      // Tab으로 모든 입력 요소를 순회
      cy.get('body').tab()
      cy.focused().should('have.attr', 'name', 'email')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'name', 'password')
      
      cy.focused().tab()
      cy.focused().should('contain', '비밀번호 찾기')
      
      cy.focused().tab()
      cy.focused().should('contain', '로그인')
      
      cy.focused().tab()
      cy.focused().should('contain', '간편 가입하기')
    })

    it('스크린 리더를 위한 적절한 라벨이 있다', () => {
      cy.get('input[name="email"]')
        .should('have.attr', 'placeholder', '이메일')
      
      cy.get('input[name="password"]')
        .should('have.attr', 'placeholder', '비밀번호')
    })

    it('에러 메시지가 접근성 속성을 가진다', () => {
      cy.get('button').contains('로그인').click()
      
      cy.get('[role="alert"]')
        .should('be.visible')
        .should('have.attr', 'aria-live', 'polite')
    })
  })

  describe('Responsive Design', () => {
    const viewports = ['iphone-6', 'ipad-2', [1920, 1080]]

    viewports.forEach((viewport) => {
      it(`${viewport}에서 올바르게 표시된다`, () => {
        if (Array.isArray(viewport)) {
          cy.viewport(viewport[0], viewport[1])
        } else {
          cy.viewport(viewport)
        }

        cy.visit('/login')
        
        cy.contains('로그인').should('be.visible')
        cy.get('input[name="email"]').should('be.visible')
        cy.get('input[name="password"]').should('be.visible')
        cy.get('button').contains('로그인').should('be.visible')
      })
    })
  })

  describe('Performance', () => {
    it('페이지 로드 시간이 합리적이다', () => {
      const startTime = Date.now()
      
      cy.visit('/login').then(() => {
        const loadTime = Date.now() - startTime
        expect(loadTime).to.be.lessThan(3000) // 3초 이하
      })
    })

    it('로그인 요청이 합리적인 시간 내에 완료된다', () => {
      cy.intercept('POST', '**/users/login', { 
        fixture: 'auth/login-success.json',
        delay: 500 // 0.5초 지연
      }).as('loginRequest')

      cy.get('input[name="email"]').type('test@example.com')
      cy.get('input[name="password"]').type('password123')
      
      const startTime = Date.now()
      cy.get('button').contains('로그인').click()

      cy.wait('@loginRequest').then(() => {
        const requestTime = Date.now() - startTime
        expect(requestTime).to.be.lessThan(2000) // 2초 이하
      })
    })
  })
})