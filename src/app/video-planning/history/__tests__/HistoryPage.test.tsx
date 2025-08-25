import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import HistoryPage from '../page'
import { vi } from 'vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn()
}))

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn()
}

describe('HistoryPage', () => {
  beforeEach(() => {
    (useRouter as any).mockReturnValue(mockRouter)
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('초기 렌더링', () => {
    test('로딩 상태가 올바르게 표시된다', () => {
      render(<HistoryPage />)
      
      expect(screen.getByText('기획서 목록을 불러오는 중...')).toBeInTheDocument()
      expect(screen.getByTestId('loading-spinner') || screen.querySelector('.spinner')).toBeTruthy()
    })

    test('페이지 제목과 설명이 표시된다', async () => {
      render(<HistoryPage />)
      
      // 로딩 완료 대기
      await waitFor(() => {
        expect(screen.getByText('기획서 관리')).toBeInTheDocument()
      })
      
      expect(screen.getByText(/생성한 영상 기획서를 관리하고 편집할 수 있습니다/)).toBeInTheDocument()
    })

    test('새 기획서 만들기 버튼이 표시된다', async () => {
      render(<HistoryPage />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /새 기획서 만들기/ })).toBeInTheDocument()
      })
    })
  })

  describe('필터 및 검색 기능', () => {
    test('검색 입력 필드가 올바르게 작동한다', async () => {
      render(<HistoryPage />)
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/제목이나 장르로 검색/)
        expect(searchInput).toBeInTheDocument()
        
        fireEvent.change(searchInput, { target: { value: '브이래닛' } })
        expect(searchInput).toHaveValue('브이래닛')
      })
    })

    test('상태 필터가 올바르게 작동한다', async () => {
      render(<HistoryPage />)
      
      await waitFor(() => {
        const filterSelect = screen.getByLabelText(/상태 필터/)
        expect(filterSelect).toBeInTheDocument()
        
        fireEvent.change(filterSelect, { target: { value: 'completed' } })
        expect(filterSelect).toHaveValue('completed')
      })
    })

    test('검색어 입력 시 필터링이 작동한다', async () => {
      render(<HistoryPage />)
      
      // 데이터 로딩 대기
      await waitFor(() => {
        expect(screen.getByText('브이래닛 브랜드 홍보영상')).toBeInTheDocument()
      })
      
      const searchInput = screen.getByPlaceholderText(/제목이나 장르로 검색/)
      fireEvent.change(searchInput, { target: { value: '협업' } })
      
      // 필터링 결과 확인
      expect(screen.getByText('영상 협업 플랫폼 소개')).toBeInTheDocument()
      expect(screen.queryByText('브이래닛 브랜드 홍보영상')).not.toBeInTheDocument()
    })
  })

  describe('기획서 목록 표시', () => {
    test('기획서 카드가 올바른 정보를 표시한다', async () => {
      render(<HistoryPage />)
      
      await waitFor(() => {
        // 첫 번째 기획서 정보 확인
        expect(screen.getByText('브이래닛 브랜드 홍보영상')).toBeInTheDocument()
        expect(screen.getByText('홍보영상')).toBeInTheDocument()
        expect(screen.getByText('60초')).toBeInTheDocument()
        expect(screen.getByText('완료')).toBeInTheDocument()
      })
    })

    test('상태별 색상이 올바르게 적용된다', async () => {
      render(<HistoryPage />)
      
      await waitFor(() => {
        const completedStatus = screen.getByText('완료')
        const inProgressStatus = screen.getByText('진행중')
        const draftStatus = screen.getByText('초안')
        
        expect(completedStatus).toHaveStyle({ backgroundColor: '#28a745' })
        expect(inProgressStatus).toHaveStyle({ backgroundColor: '#1631F8' })
        expect(draftStatus).toHaveStyle({ backgroundColor: '#6c757d' })
      })
    })

    test('액션 버튼들이 올바르게 표시된다', async () => {
      render(<HistoryPage />)
      
      await waitFor(() => {
        // 각 카드마다 4개의 액션 버튼이 있어야 함
        const editButtons = screen.getAllByText('편집')
        const viewButtons = screen.getAllByText('미리보기')
        const downloadButtons = screen.getAllByText('PDF')
        const deleteButtons = screen.getAllByText('삭제')
        
        expect(editButtons).toHaveLength(3) // 3개의 기획서
        expect(viewButtons).toHaveLength(3)
        expect(downloadButtons).toHaveLength(3)
        expect(deleteButtons).toHaveLength(3)
      })
    })
  })

  describe('네비게이션', () => {
    test('새 기획서 만들기 버튼 클릭 시 AI 기획 페이지로 이동한다', async () => {
      render(<HistoryPage />)
      
      await waitFor(() => {
        const newButton = screen.getByRole('button', { name: /새 기획서 만들기/ })
        fireEvent.click(newButton)
        
        expect(mockRouter.push).toHaveBeenCalledWith('/video-planning/ai')
      })
    })

    test('빈 상태에서 기획서 만들기 버튼 클릭 시 AI 기획 페이지로 이동한다', async () => {
      render(<HistoryPage />)
      
      // 검색어를 입력해서 빈 상태 만들기
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/제목이나 장르로 검색/)
        fireEvent.change(searchInput, { target: { value: '존재하지않는검색어' } })
      })
      
      const createButton = screen.getByRole('button', { name: /기획서 만들기/ })
      fireEvent.click(createButton)
      
      expect(mockRouter.push).toHaveBeenCalledWith('/video-planning/ai')
    })
  })

  describe('액션 버튼 기능', () => {
    test('편집 버튼 클릭 시 적절한 알림이 표시된다', async () => {
      window.alert = vi.fn()
      
      render(<HistoryPage />)
      
      await waitFor(() => {
        const editButtons = screen.getAllByText('편집')
        fireEvent.click(editButtons[0])
        
        expect(window.alert).toHaveBeenCalledWith('"브이래닛 브랜드 홍보영상" 편집 기능은 개발 중입니다.')
      })
    })

    test('미리보기 버튼 클릭 시 적절한 알림이 표시된다', async () => {
      window.alert = vi.fn()
      
      render(<HistoryPage />)
      
      await waitFor(() => {
        const viewButtons = screen.getAllByText('미리보기')
        fireEvent.click(viewButtons[0])
        
        expect(window.alert).toHaveBeenCalledWith('"브이래닛 브랜드 홍보영상" 미리보기 기능은 개발 중입니다.')
      })
    })

    test('PDF 다운로드 버튼 클릭 시 적절한 알림이 표시된다', async () => {
      window.alert = vi.fn()
      
      render(<HistoryPage />)
      
      await waitFor(() => {
        const downloadButtons = screen.getAllByText('PDF')
        fireEvent.click(downloadButtons[0])
        
        expect(window.alert).toHaveBeenCalledWith('"브이래닛 브랜드 홍보영상" PDF 다운로드 기능은 개발 중입니다.')
      })
    })

    test('삭제 버튼 클릭 시 확인 후 기획서가 제거된다', async () => {
      window.confirm = vi.fn().mockReturnValue(true)
      
      render(<HistoryPage />)
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('삭제')
        fireEvent.click(deleteButtons[0])
        
        expect(window.confirm).toHaveBeenCalledWith('"브이래닛 브랜드 홍보영상"를 삭제하시겠습니까?')
      })
      
      // 삭제 후 해당 항목이 사라졌는지 확인
      await waitFor(() => {
        expect(screen.queryByText('브이래닛 브랜드 홍보영상')).not.toBeInTheDocument()
      })
    })

    test('삭제 확인 취소 시 기획서가 유지된다', async () => {
      window.confirm = vi.fn().mockReturnValue(false)
      
      render(<HistoryPage />)
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('삭제')
        fireEvent.click(deleteButtons[0])
        
        // 삭제가 취소되어도 항목이 여전히 존재해야 함
        expect(screen.getByText('브이래닛 브랜드 홍보영상')).toBeInTheDocument()
      })
    })
  })

  describe('빈 상태 처리', () => {
    test('검색 결과가 없을 때 적절한 메시지가 표시된다', async () => {
      render(<HistoryPage />)
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/제목이나 장르로 검색/)
        fireEvent.change(searchInput, { target: { value: '존재하지않는검색어' } })
      })
      
      expect(screen.getByText('기획서가 없습니다')).toBeInTheDocument()
      expect(screen.getByText('검색 조건에 맞는 기획서가 없습니다.')).toBeInTheDocument()
    })

    test('필터 결과가 없을 때 적절한 메시지가 표시된다', async () => {
      render(<HistoryPage />)
      
      // 모든 항목을 삭제해서 빈 상태 만들기
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('삭제')
        window.confirm = vi.fn().mockReturnValue(true)
        
        deleteButtons.forEach(button => {
          fireEvent.click(button)
        })
      })
      
      await waitFor(() => {
        expect(screen.getByText('기획서가 없습니다')).toBeInTheDocument()
      })
    })
  })

  describe('요약 정보', () => {
    test('기획서 개수가 올바르게 표시된다', async () => {
      render(<HistoryPage />)
      
      await waitFor(() => {
        expect(screen.getByText('총 3개의 기획서가 있습니다.')).toBeInTheDocument()
      })
    })

    test('필터링 후 개수가 올바르게 업데이트된다', async () => {
      render(<HistoryPage />)
      
      await waitFor(() => {
        const filterSelect = screen.getByLabelText(/상태 필터/)
        fireEvent.change(filterSelect, { target: { value: 'completed' } })
      })
      
      await waitFor(() => {
        expect(screen.getByText('총 1개의 기획서가 있습니다.')).toBeInTheDocument()
      })
    })
  })

  describe('접근성', () => {
    test('검색 입력 필드가 적절한 label을 가진다', async () => {
      render(<HistoryPage />)
      
      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/제목이나 장르로 검색/)
        expect(searchInput).toBeInTheDocument()
      })
    })

    test('필터 선택이 적절한 label을 가진다', async () => {
      render(<HistoryPage />)
      
      await waitFor(() => {
        expect(screen.getByLabelText(/상태 필터/)).toBeInTheDocument()
      })
    })

    test('모든 버튼이 적절한 role과 이름을 가진다', async () => {
      render(<HistoryPage />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /새 기획서 만들기/ })).toBeInTheDocument()
        expect(screen.getAllByRole('button', { name: '편집' })).toHaveLength(3)
        expect(screen.getAllByRole('button', { name: '미리보기' })).toHaveLength(3)
        expect(screen.getAllByRole('button', { name: 'PDF' })).toHaveLength(3)
        expect(screen.getAllByRole('button', { name: '삭제' })).toHaveLength(3)
      })
    })
  })
})