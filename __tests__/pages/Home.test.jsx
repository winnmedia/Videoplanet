import React from 'react'
import { render, screen, fireEvent, waitFor } from '../../src/utils/test-utils'
import { createSnapshot, createLoadingSnapshots } from '../../src/utils/snapshot-utils'
import Home from '../../src/pages/Home'

// Home 페이지 컴포넌트 테스트 스위트
describe('Home Page', () => {
  // Mock data
  const mockProjects = [
    { id: 1, title: 'Project 1', description: 'Description 1', status: 'active' },
    { id: 2, title: 'Project 2', description: 'Description 2', status: 'completed' },
  ]

  // 각 테스트 전에 fetch mock 설정
  beforeEach(() => {
    global.fetch = jest.fn()
    jest.clearAllMocks()
  })

  // 테스트 후 정리
  afterEach(() => {
    global.fetch.mockRestore()
  })

  // 렌더링 테스트
  describe('Rendering', () => {
    it('renders home page correctly', () => {
      render(<Home />)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('displays page title', () => {
      render(<Home />)
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      expect(screen.getByText(/videoPlanet/i)).toBeInTheDocument()
    })

    it('shows hero section', () => {
      render(<Home />)
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByText(/영상 피드백 플랫폼/i)).toBeInTheDocument()
    })

    it('displays features section', () => {
      render(<Home />)
      expect(screen.getByText(/주요 기능/i)).toBeInTheDocument()
      expect(screen.getByText(/실시간 협업/i)).toBeInTheDocument()
      expect(screen.getByText(/피드백 관리/i)).toBeInTheDocument()
    })
  })

  // 데이터 로딩 테스트
  describe('Data Loading', () => {
    it('displays loading state initially', () => {
      render(<Home />)
      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('loads and displays recent projects', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })

      render(<Home />)
      
      await waitFor(() => {
        expect(screen.getByText('Project 1')).toBeInTheDocument()
        expect(screen.getByText('Project 2')).toBeInTheDocument()
      })
    })

    it('handles API error gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API Error'))

      render(<Home />)
      
      await waitFor(() => {
        expect(screen.getByText(/오류가 발생했습니다/i)).toBeInTheDocument()
      })
    })

    it('displays empty state when no projects', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: [] }),
      })

      render(<Home />)
      
      await waitFor(() => {
        expect(screen.getByText(/프로젝트가 없습니다/i)).toBeInTheDocument()
      })
    })
  })

  // 사용자 상호작용 테스트
  describe('User Interactions', () => {
    it('navigates to signup on CTA button click', () => {
      const mockPush = jest.fn()
      // Next.js router mock
      jest.doMock('next/router', () => ({
        useRouter: () => ({
          push: mockPush,
          pathname: '/',
        }),
      }))

      render(<Home />)
      
      const ctaButton = screen.getByRole('button', { name: /시작하기/i })
      fireEvent.click(ctaButton)
      
      expect(mockPush).toHaveBeenCalledWith('/signup')
    })

    it('opens project detail modal', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })

      render(<Home />)
      
      await waitFor(() => {
        const projectCard = screen.getByText('Project 1')
        fireEvent.click(projectCard)
      })
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Project 1')).toBeInTheDocument()
    })

    it('filters projects by status', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })

      render(<Home />)
      
      await waitFor(() => {
        const activeFilter = screen.getByRole('button', { name: /진행중/i })
        fireEvent.click(activeFilter)
      })
      
      expect(screen.getByText('Project 1')).toBeInTheDocument()
      expect(screen.queryByText('Project 2')).not.toBeInTheDocument()
    })
  })

  // 검색 기능 테스트
  describe('Search Functionality', () => {
    beforeEach(async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ projects: mockProjects }),
      })

      render(<Home />)
      
      await waitFor(() => {
        expect(screen.getByText('Project 1')).toBeInTheDocument()
      })
    })

    it('filters projects by search term', async () => {
      const searchInput = screen.getByPlaceholderText(/프로젝트 검색/i)
      fireEvent.change(searchInput, { target: { value: 'Project 1' } })
      
      await waitFor(() => {
        expect(screen.getByText('Project 1')).toBeInTheDocument()
        expect(screen.queryByText('Project 2')).not.toBeInTheDocument()
      })
    })

    it('shows no results message for invalid search', async () => {
      const searchInput = screen.getByPlaceholderText(/프로젝트 검색/i)
      fireEvent.change(searchInput, { target: { value: 'Nonexistent Project' } })
      
      await waitFor(() => {
        expect(screen.getByText(/검색 결과가 없습니다/i)).toBeInTheDocument()
      })
    })

    it('clears search results when input is cleared', async () => {
      const searchInput = screen.getByPlaceholderText(/프로젝트 검색/i)
      
      // 검색어 입력
      fireEvent.change(searchInput, { target: { value: 'Project 1' } })
      await waitFor(() => {
        expect(screen.queryByText('Project 2')).not.toBeInTheDocument()
      })
      
      // 검색어 지우기
      fireEvent.change(searchInput, { target: { value: '' } })
      await waitFor(() => {
        expect(screen.getByText('Project 1')).toBeInTheDocument()
        expect(screen.getByText('Project 2')).toBeInTheDocument()
      })
    })
  })

  // SEO 및 메타데이터 테스트
  describe('SEO and Metadata', () => {
    it('sets correct page title', () => {
      render(<Home />)
      expect(document.title).toContain('VideoPlanet')
    })

    it('sets meta description', () => {
      render(<Home />)
      const metaDescription = document.querySelector('meta[name="description"]')
      expect(metaDescription).toHaveAttribute('content')
    })
  })

  // 성능 테스트
  describe('Performance', () => {
    it('implements lazy loading for images', () => {
      render(<Home />)
      const images = screen.getAllByRole('img')
      images.forEach(img => {
        expect(img).toHaveAttribute('loading', 'lazy')
      })
    })

    it('debounces search input', async () => {
      jest.useFakeTimers()
      
      render(<Home />)
      const searchInput = screen.getByPlaceholderText(/프로젝트 검색/i)
      
      // 빠르게 여러 번 입력
      fireEvent.change(searchInput, { target: { value: 'P' } })
      fireEvent.change(searchInput, { target: { value: 'Pr' } })
      fireEvent.change(searchInput, { target: { value: 'Pro' } })
      
      // 300ms 후에 검색이 실행되어야 함
      jest.advanceTimersByTime(300)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1) // 초기 로딩만
      })
      
      jest.useRealTimers()
    })
  })

  // 접근성 테스트
  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<Home />)
      
      const h1 = screen.getByRole('heading', { level: 1 })
      const h2s = screen.getAllByRole('heading', { level: 2 })
      
      expect(h1).toBeInTheDocument()
      expect(h2s.length).toBeGreaterThan(0)
    })

    it('has alt text for images', () => {
      render(<Home />)
      const images = screen.getAllByRole('img')
      images.forEach(img => {
        expect(img).toHaveAttribute('alt')
        expect(img.getAttribute('alt')).not.toBe('')
      })
    })

    it('supports keyboard navigation', () => {
      render(<Home />)
      
      const ctaButton = screen.getByRole('button', { name: /시작하기/i })
      ctaButton.focus()
      expect(ctaButton).toHaveFocus()
      
      fireEvent.keyDown(ctaButton, { key: 'Enter' })
      // 버튼 클릭과 동일한 동작이 실행되어야 함
    })
  })

  // 스냅샷 테스트
  describe('Snapshots', () => {
    it('matches snapshot in default state', () => {
      createSnapshot(Home)
    })

    // 로딩 상태별 스냅샷
    createLoadingSnapshots(Home, {})
  })

  // 에러 경계 테스트
  describe('Error Boundary', () => {
    it('catches and displays error when component throws', () => {
      // 에러를 발생시키는 컴포넌트로 테스트
      const ThrowError = () => {
        throw new Error('Test error')
      }
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => render(<ThrowError />)).not.toThrow()
      
      consoleSpy.mockRestore()
    })
  })
})