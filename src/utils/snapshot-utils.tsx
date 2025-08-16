import React from 'react'
import { render } from './test-utils'

// Jest 스냅샷 매처 확장 (빌드시 제외)
if (typeof expect !== 'undefined') {
  const { toMatchSnapshot } = require('jest-snapshot')
  expect.extend({ toMatchSnapshot } as any)
}

/**
 * 컴포넌트 스냅샷 테스트 헬퍼
 * @param Component - 테스트할 React 컴포넌트
 * @param props - 컴포넌트에 전달할 props
 * @param options - 추가 렌더링 옵션
 * @returns 스냅샷 테스트 결과
 */
export const createSnapshot = (
  Component: React.ComponentType<any>,
  props: any = {},
  options: any = {}
) => {
  const { container } = render(<Component {...props} />, options)
  expect(container.firstChild).toMatchSnapshot()
  return container
}

/**
 * 여러 상태의 컴포넌트 스냅샷을 생성
 * @param Component - 테스트할 React 컴포넌트
 * @param states - 테스트할 상태들의 배열
 */
export const createMultipleSnapshots = (
  Component: React.ComponentType<any>,
  states: Array<{ name: string; props: any; options?: any }>
) => {
  states.forEach(({ name, props, options = {} }) => {
    it(`renders correctly: ${name}`, () => {
      createSnapshot(Component, props, options)
    })
  })
}

/**
 * 반응형 스냅샷 테스트
 * @param Component - 테스트할 React 컴포넌트
 * @param props - 컴포넌트 props
 */
export const createResponsiveSnapshots = (
  Component: React.ComponentType<any>,
  props: any = {}
) => {
  const viewports = [
    { name: 'mobile', width: 375 },
    { name: 'tablet', width: 768 },
    { name: 'desktop', width: 1280 },
  ]

  viewports.forEach(({ name, width }) => {
    it(`renders correctly on ${name} (${width}px)`, () => {
      // 뷰포트 크기 시뮬레이션
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: width,
      })
      
      // matchMedia 모킹
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: width >= parseInt(query.match(/\d+/)?.[0] || '0'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
      }))

      createSnapshot(Component, props)
    })
  })
}

/**
 * 테마별 스냅샷 테스트
 * @param Component - 테스트할 React 컴포넌트
 * @param props - 컴포넌트 props
 */
export const createThemedSnapshots = (
  Component: React.ComponentType<any>,
  props: any = {}
) => {
  const themes = ['light', 'dark']

  themes.forEach((theme) => {
    it(`renders correctly with ${theme} theme`, () => {
      // 테마 관련 클래스나 속성 추가
      document.body.className = `theme-${theme}`
      
      createSnapshot(Component, {
        ...props,
        theme,
      })
      
      // 정리
      document.body.className = ''
    })
  })
}

/**
 * 로딩 상태 스냅샷 테스트
 * @param Component - 테스트할 React 컴포넌트
 * @param props - 컴포넌트 props
 */
export const createLoadingSnapshots = (
  Component: React.ComponentType<any>,
  props: any = {}
) => {
  const loadingStates = [
    { name: 'loading', isLoading: true },
    { name: 'loaded', isLoading: false },
    { name: 'error', isLoading: false, error: 'Test error' },
  ]

  loadingStates.forEach(({ name, ...stateProps }) => {
    it(`renders correctly when ${name}`, () => {
      createSnapshot(Component, {
        ...props,
        ...stateProps,
      })
    })
  })
}

/**
 * 폼 상태별 스냅샷 테스트
 * @param Component - 테스트할 폼 컴포넌트
 * @param baseProps - 기본 props
 */
export const createFormSnapshots = (
  Component: React.ComponentType<any>,
  baseProps: any = {}
) => {
  const formStates = [
    { name: 'empty', values: {} },
    { name: 'filled', values: { title: 'Test Title', description: 'Test Description' } },
    { name: 'with errors', values: {}, errors: { title: 'Title is required' } },
    { name: 'submitting', values: { title: 'Test' }, isSubmitting: true },
  ]

  formStates.forEach(({ name, ...stateProps }) => {
    it(`renders form correctly when ${name}`, () => {
      createSnapshot(Component, {
        ...baseProps,
        ...stateProps,
      })
    })
  })
}

/**
 * 데이터 상태별 스냅샷 테스트 (빈 상태, 로딩, 데이터 있음)
 * @param Component - 테스트할 컴포넌트
 * @param baseProps - 기본 props
 */
export const createDataStateSnapshots = (
  Component: React.ComponentType<any>,
  baseProps: any = {}
) => {
  const dataStates = [
    { name: 'empty state', data: [], isLoading: false },
    { name: 'loading state', data: [], isLoading: true },
    { name: 'with data', data: [{ id: 1, title: 'Test Item' }], isLoading: false },
    { name: 'error state', data: [], isLoading: false, error: 'Failed to load data' },
  ]

  dataStates.forEach(({ name, ...stateProps }) => {
    it(`renders correctly in ${name}`, () => {
      createSnapshot(Component, {
        ...baseProps,
        ...stateProps,
      })
    })
  })
}

/**
 * 접근성 속성이 포함된 스냅샷 테스트
 * @param Component - 테스트할 컴포넌트
 * @param props - 컴포넌트 props
 */
export const createA11ySnapshots = (
  Component: React.ComponentType<any>,
  props: any = {}
) => {
  it('renders with accessibility attributes', () => {
    const { container } = render(<Component {...props} />)
    
    // 접근성 속성 확인
    const elements = container.querySelectorAll('[role], [aria-label], [aria-describedby]')
    expect(elements.length).toBeGreaterThan(0)
    
    // 스냅샷 생성
    expect(container.firstChild).toMatchSnapshot()
  })
}

/**
 * 상호작용 후 스냅샷 테스트
 * @param Component - 테스트할 컴포넌트
 * @param props - 컴포넌트 props
 * @param interactions - 실행할 상호작용들
 */
export const createInteractionSnapshots = (
  Component: React.ComponentType<any>,
  props: any = {},
  interactions: Array<{ name: string; action: (container: HTMLElement) => void }>
) => {
  interactions.forEach(({ name, action }) => {
    it(`renders correctly after ${name}`, () => {
      const { container } = render(<Component {...props} />)
      action(container)
      expect(container.firstChild).toMatchSnapshot()
    })
  })
}