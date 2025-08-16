// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// -- 사용자 인증 관련 명령어 --

Cypress.Commands.add('loginWithAPI', (credentials) => {
  const { email, password } = credentials || Cypress.env('testUser')
  
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login/`,
    body: { email, password },
    failOnStatusCode: false,
  }).then((response) => {
    if (response.status === 200) {
      // 토큰을 로컬 스토리지에 저장
      window.localStorage.setItem('access_token', response.body.access_token)
      if (response.body.refresh_token) {
        window.localStorage.setItem('refresh_token', response.body.refresh_token)
      }
    }
  })
})

Cypress.Commands.add('loginWithUI', (credentials) => {
  const { email, password } = credentials || Cypress.env('testUser')
  
  cy.visit('/login')
  cy.get('[data-testid="email-input"]', { timeout: 10000 }).should('be.visible').type(email)
  cy.get('[data-testid="password-input"]').should('be.visible').type(password)
  cy.get('[data-testid="login-submit"]').click()
  
  // 로그인 성공 확인
  cy.url().should('not.include', '/login')
  cy.get('[data-testid="user-profile"]', { timeout: 10000 }).should('be.visible')
})

// -- 프로젝트 관련 명령어 --

Cypress.Commands.add('createProjectWithAPI', (projectData) => {
  cy.window().then((win) => {
    const token = win.localStorage.getItem('access_token')
    
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/projects/`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: projectData,
    }).then((response) => {
      expect(response.status).to.eq(201)
      return response.body
    })
  })
})

Cypress.Commands.add('deleteProjectWithAPI', (projectId) => {
  cy.window().then((win) => {
    const token = win.localStorage.getItem('access_token')
    
    cy.request({
      method: 'DELETE',
      url: `${Cypress.env('apiUrl')}/projects/${projectId}/`,
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      failOnStatusCode: false,
    })
  })
})

// -- 폼 관련 명령어 --

Cypress.Commands.add('fillForm', (formData) => {
  Object.keys(formData).forEach((field) => {
    cy.get(`[data-testid="${field}"]`).clear().type(formData[field])
  })
})

Cypress.Commands.add('submitForm', (buttonTestId = 'submit-button') => {
  cy.get(`[data-testid="${buttonTestId}"]`).click()
})

// -- 파일 업로드 명령어 --

Cypress.Commands.add('uploadFile', (selector, fileName, fileType = 'image/png') => {
  cy.get(selector).then(subject => {
    const blob = Cypress.Blob.base64StringToBlob(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      fileType
    )
    
    const file = new File([blob], fileName, { type: fileType })
    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(file)
    
    const input = subject[0]
    input.files = dataTransfer.files
    
    cy.wrap(subject).trigger('change', { force: true })
  })
})

// -- 대기 및 검증 명령어 --

Cypress.Commands.add('waitForAPI', (url, timeout = 10000) => {
  cy.intercept('GET', url).as('apiCall')
  cy.wait('@apiCall', { timeout })
})

Cypress.Commands.add('waitForElement', (selector, timeout = 10000) => {
  cy.get(selector, { timeout }).should('be.visible')
})

Cypress.Commands.add('waitForText', (text, timeout = 10000) => {
  cy.contains(text, { timeout }).should('be.visible')
})

// -- 반응형 테스트 명령어 --

Cypress.Commands.add('testResponsive', (callback) => {
  const viewports = [
    { width: 320, height: 568, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1280, height: 720, name: 'desktop' },
  ]
  
  viewports.forEach((viewport) => {
    cy.viewport(viewport.width, viewport.height)
    cy.log(`Testing on ${viewport.name} (${viewport.width}x${viewport.height})`)
    callback(viewport)
  })
})

// -- 스크롤 관련 명령어 --

Cypress.Commands.add('scrollToElement', (selector) => {
  cy.get(selector).scrollIntoView({ duration: 500 })
})

Cypress.Commands.add('scrollToBottom', () => {
  cy.scrollTo('bottom', { duration: 500 })
})

Cypress.Commands.add('scrollToTop', () => {
  cy.scrollTo('top', { duration: 500 })
})

// -- 알림 및 모달 관련 명령어 --

Cypress.Commands.add('dismissAlert', () => {
  cy.get('[data-testid="alert-dismiss"]').click()
})

Cypress.Commands.add('confirmModal', () => {
  cy.get('[data-testid="modal-confirm"]').click()
})

Cypress.Commands.add('cancelModal', () => {
  cy.get('[data-testid="modal-cancel"]').click()
})

// -- 데이터 검증 명령어 --

Cypress.Commands.add('verifyTableData', (tableSelector, expectedData) => {
  cy.get(tableSelector).within(() => {
    expectedData.forEach((rowData, index) => {
      cy.get('tbody tr').eq(index).within(() => {
        Object.values(rowData).forEach((cellValue, cellIndex) => {
          cy.get('td').eq(cellIndex).should('contain', cellValue)
        })
      })
    })
  })
})

Cypress.Commands.add('verifyListItems', (listSelector, expectedItems) => {
  cy.get(listSelector).within(() => {
    expectedItems.forEach((item, index) => {
      cy.get('li').eq(index).should('contain', item)
    })
  })
})