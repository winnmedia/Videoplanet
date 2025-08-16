// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// 전역 설정
Cypress.on('uncaught:exception', (err, runnable) => {
  // React의 개발 모드 오류나 기타 예상된 오류를 무시
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  
  if (err.message.includes('Script error')) {
    return false
  }
  
  // 다른 오류는 그대로 진행
  return true
})

// 테스트 시작 전 실행
beforeEach(() => {
  // 로컬 스토리지 초기화
  cy.clearLocalStorage()
  
  // 쿠키 초기화 (로그인 관련 제외)
  cy.clearCookies()
  
  // 세션 스토리지 초기화
  cy.window().then((win) => {
    win.sessionStorage.clear()
  })
})

// 전역 명령어 등록
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login')
  cy.get('[data-testid="email-input"]').type(email)
  cy.get('[data-testid="password-input"]').type(password)
  cy.get('[data-testid="login-button"]').click()
  cy.url().should('not.include', '/login')
})

Cypress.Commands.add('logout', () => {
  cy.get('[data-testid="user-menu"]').click()
  cy.get('[data-testid="logout-button"]').click()
  cy.url().should('include', '/login')
})

// API 테스트를 위한 명령어
Cypress.Commands.add('apiLogin', (email, password) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login/`,
    body: {
      email,
      password,
    },
  }).then((response) => {
    window.localStorage.setItem('token', response.body.token)
  })
})

// 프로젝트 생성 명령어
Cypress.Commands.add('createProject', (projectData) => {
  cy.visit('/project/create')
  cy.get('[data-testid="project-title"]').type(projectData.title)
  cy.get('[data-testid="project-description"]').type(projectData.description)
  cy.get('[data-testid="create-button"]').click()
  cy.url().should('include', '/project/view/')
})

// 스크린샷 및 비디오 최적화
Cypress.Commands.add('takeScreenshot', (name) => {
  cy.screenshot(name, { 
    capture: 'viewport',
    overwrite: true 
  })
})

// 로딩 대기 명령어
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('[data-testid="loading"]').should('not.exist')
  cy.get('body').should('be.visible')
})

// 모바일 테스트용 명령어
Cypress.Commands.add('setMobileViewport', () => {
  cy.viewport(375, 667) // iPhone SE 크기
})

Cypress.Commands.add('setTabletViewport', () => {
  cy.viewport(768, 1024) // iPad 크기
})

Cypress.Commands.add('setDesktopViewport', () => {
  cy.viewport(1280, 720) // 기본 데스크톱 크기
})