import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { Provider } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import projectReducer from '../redux/project'

// 테스트용 스토어 생성 함수
const createTestStore = (preloadedState = {}): any => {
  return configureStore({
    reducer: {
      project: projectReducer,
    },
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  })
}

// 모든 Provider로 감싸진 커스텀 render 함수
interface AllTheProvidersProps {
  children: React.ReactNode
  store?: any
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ 
  children, 
  store = createTestStore() 
}) => {
  return (
    <Provider store={store}>
      {children}
    </Provider>
  )
}

// 커스텀 render 함수
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: any
  store?: any
}

const customRender = (
  ui: ReactElement,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    ...renderOptions
  }: CustomRenderOptions = {}
): any => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AllTheProviders store={store}>{children}</AllTheProviders>
  )
  
  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

// 테스트용 헬퍼 함수들
export const createMockUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  isAuthenticated: true,
  ...overrides,
})

export const createMockProject = (overrides = {}) => ({
  id: 1,
  title: 'Test Project',
  description: 'Test Description',
  status: 'active',
  createdAt: '2023-01-01',
  ...overrides,
})

export const createMockFeedback = (overrides = {}) => ({
  id: 1,
  content: 'Test feedback',
  projectId: 1,
  userId: 1,
  createdAt: '2023-01-01',
  ...overrides,
})

// 비동기 테스트를 위한 헬퍼
export const waitForLoadingToFinish = () => {
  return new Promise((resolve) => {
    setTimeout(resolve, 0)
  })
}

// DOM 이벤트 헬퍼
export const createMockEvent = (overrides = {}) => ({
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  target: { value: '' },
  ...overrides,
})

// API 응답 모킹 헬퍼
export const createMockApiResponse = (data: any, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
})

// 에러 모킹 헬퍼
export const createMockError = (message = 'Test error', status = 500) => ({
  message,
  status,
  response: {
    status,
    data: { message },
  },
})

// 로컬스토리지 모킹 헬퍼
export const mockLocalStorage = () => {
  const store: { [key: string]: string } = {}
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
  }
}

// re-export everything
export * from '@testing-library/react'

// override render method
export { customRender as render, createTestStore }