// ***********************************************************
// This example support/component.js is processed and
// loaded automatically before your component test files.
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
import { mount } from 'cypress/react'

// React 컴포넌트 테스트를 위한 전역 명령어 추가
Cypress.Commands.add('mount', mount)

// 컴포넌트 테스트용 전역 설정
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import projectReducer from '../../src/redux/project'

// 테스트용 스토어 생성
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      project: projectReducer,
    },
    preloadedState: initialState,
  })
}

// 컴포넌트 마운트 헬퍼
Cypress.Commands.add('mountWithProviders', (component, options = {}) => {
  const { 
    reduxState = {}, 
    ...mountOptions 
  } = options
  
  const store = createTestStore(reduxState)
  
  const wrapped = (
    <Provider store={store}>
      {component}
    </Provider>
  )
  
  return cy.mount(wrapped, mountOptions)
})

// 스타일 테스트를 위한 헬퍼
Cypress.Commands.add('checkStyles', (selector, expectedStyles) => {
  cy.get(selector).should(($el) => {
    const styles = window.getComputedStyle($el[0])
    Object.keys(expectedStyles).forEach((property) => {
      expect(styles.getPropertyValue(property)).to.equal(expectedStyles[property])
    })
  })
})

// 접근성 테스트를 위한 헬퍼
Cypress.Commands.add('checkA11y', (selector) => {
  cy.get(selector).should('have.attr', 'role')
  cy.get(selector).should('have.attr', 'aria-label')
})

// 컴포넌트 이벤트 테스트 헬퍼
Cypress.Commands.add('triggerEvent', (selector, event, data = {}) => {
  cy.get(selector).trigger(event, data)
})

// 폼 컴포넌트 테스트 헬퍼
Cypress.Commands.add('testFormValidation', (formSelector, testCases) => {
  testCases.forEach(({ input, expectedError }) => {
    cy.get(formSelector).within(() => {
      Object.keys(input).forEach((field) => {
        cy.get(`[name="${field}"]`).clear().type(input[field])
      })
      cy.get('[type="submit"]').click()
      
      if (expectedError) {
        cy.contains(expectedError).should('be.visible')
      }
    })
  })
})