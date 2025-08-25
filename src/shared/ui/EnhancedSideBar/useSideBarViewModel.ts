import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { MenuItem, Project } from './types'

// ============================================
// SideBar ViewModel Hook
// 비즈니스 로직과 상태 관리를 View에서 분리
// ============================================

export interface SideBarViewModel {
  // State
  isOpen: boolean
  isMobile: boolean
  subMenuOpen: boolean
  activeTab: string
  searchQuery: string
  filteredMenuItems: MenuItem[]
  sortedProjects: Project[]
  
  // Actions
  openSideBar: () => void
  closeSideBar: () => void
  toggleSideBar: () => void
  openSubMenu: (tab: string) => void
  closeSubMenu: () => void
  setSearchQuery: (query: string) => void
  clearSearch: () => void
  navigateTo: (path: string) => void
  handleMenuClick: (menuType: string) => void
  handleLogout: () => void
  
  // Computed
  isPathActive: (path?: string) => boolean
  isVideoPlanningActive: () => boolean
  currentSubMenuTitle: string
  showEmptyState: boolean
}

interface UseSideBarViewModelProps {
  isOpenProp?: boolean
  tab?: string
  projects?: Project[]
  onMenuClick?: (menuType: string) => void
  onClose?: () => void
  onLogout?: () => void
  customMenuItems?: MenuItem[]
}

export function useSideBarViewModel({
  isOpenProp = false,
  tab = '',
  projects = [],
  onMenuClick,
  onClose,
  onLogout,
  customMenuItems
}: UseSideBarViewModelProps = {}): SideBarViewModel {
  const router = useRouter()
  const pathname = usePathname()
  
  // ============================================
  // State Management
  // ============================================
  
  const [isOpen, setIsOpen] = useState(isOpenProp)
  const [subMenuOpen, setSubMenuOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(tab)
  const [searchQuery, setSearchQuery] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  
  // ============================================
  // Default Menu Items
  // ============================================
  
  const defaultMenuItems: MenuItem[] = useMemo(() => [
    {
      id: 'home',
      label: '홈',
      path: '/dashboard',
      ariaLabel: '홈으로 이동',
    },
    {
      id: 'planning',
      label: '전체 일정',
      path: '/planning',
      ariaLabel: '전체 일정 페이지로 이동',
    },
    {
      id: 'project',
      label: '프로젝트 관리',
      badge: projects.length,
      ariaLabel: `프로젝트 관리 (${projects.length}개)`,
    },
    {
      id: 'video-planning',
      label: '영상 기획',
      ariaLabel: '영상 기획 메뉴 열기',
    },
    {
      id: 'feedback',
      label: '영상 피드백',
      ariaLabel: '영상 피드백 메뉴 열기',
    },
  ], [projects.length])
  
  const menuItems = customMenuItems || defaultMenuItems
  
  // ============================================
  // Sorted Projects (메모이제이션)
  // ============================================
  
  const sortedProjects = useMemo(() => {
    if (!projects || projects.length === 0) return []
    
    return [...projects].sort((a, b) => {
      return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1
    })
  }, [projects])
  
  // ============================================
  // Filtered Menu Items (검색)
  // ============================================
  
  const filteredMenuItems = useMemo(() => {
    if (!searchQuery) return menuItems
    
    return menuItems.filter(item =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [menuItems, searchQuery])
  
  // ============================================
  // Effects
  // ============================================
  
  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  // Props 동기화
  useEffect(() => {
    setIsOpen(isOpenProp)
  }, [isOpenProp])
  
  useEffect(() => {
    setActiveTab(tab || '')
    if (isOpenProp) {
      setSubMenuOpen(true)
    }
  }, [isOpenProp, tab])
  
  // ============================================
  // Actions
  // ============================================
  
  const openSideBar = useCallback(() => {
    setIsOpen(true)
  }, [])
  
  const closeSideBar = useCallback(() => {
    setIsOpen(false)
  }, [])
  
  const toggleSideBar = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])
  
  const openSubMenu = useCallback((tab: string) => {
    setSubMenuOpen(true)
    setActiveTab(tab)
    onMenuClick?.(tab)
  }, [onMenuClick])
  
  const closeSubMenu = useCallback(() => {
    setSubMenuOpen(false)
    onClose?.()
  }, [onClose])
  
  const clearSearch = useCallback(() => {
    setSearchQuery('')
  }, [])
  
  const navigateTo = useCallback((path: string) => {
    router.push(path)
    setSubMenuOpen(false)
    
    if (isMobile) {
      setIsOpen(false)
    }
  }, [router, isMobile])
  
  const handleMenuClick = useCallback((menuType: string) => {
    // 탭 전환 로직 (초기 디자인과 동일)
    if (activeTab === 'feedback' && menuType === 'project') {
      setSubMenuOpen(true)
    } else if (activeTab === 'project' && menuType === 'feedback') {
      setSubMenuOpen(true)
    } else {
      setSubMenuOpen(!subMenuOpen)
    }
    
    setActiveTab(menuType)
    onMenuClick?.(menuType)
  }, [activeTab, subMenuOpen, onMenuClick])
  
  const handleLogout = useCallback(() => {
    // 로그아웃 로직을 외부로 위임
    onLogout?.()
    
    // 기본 동작 (외부 핸들러가 없을 경우)
    if (!onLogout) {
      localStorage.removeItem('isAuthenticated')
      localStorage.removeItem('user')
      router.push('/login')
    }
  }, [onLogout, router])
  
  // ============================================
  // Computed Properties
  // ============================================
  
  const isPathActive = useCallback((path?: string) => {
    return !!(path && pathname === path && !subMenuOpen)
  }, [pathname, subMenuOpen])
  
  const isVideoPlanningActive = useCallback(() => {
    return pathname.startsWith('/video-planning')
  }, [pathname])
  
  const currentSubMenuTitle = useMemo(() => {
    switch (activeTab) {
      case 'feedback':
        return '영상 피드백'
      case 'video-planning':
        return '영상 기획'
      case 'project':
        return '프로젝트 관리'
      default:
        return ''
    }
  }, [activeTab])
  
  const showEmptyState = useMemo(() => {
    if (activeTab === 'video-planning') return false
    return sortedProjects.length === 0
  }, [activeTab, sortedProjects.length])
  
  // ============================================
  // Return ViewModel
  // ============================================
  
  return {
    // State
    isOpen,
    isMobile,
    subMenuOpen,
    activeTab,
    searchQuery,
    filteredMenuItems,
    sortedProjects,
    
    // Actions
    openSideBar,
    closeSideBar,
    toggleSideBar,
    openSubMenu,
    closeSubMenu,
    setSearchQuery,
    clearSearch,
    navigateTo,
    handleMenuClick,
    handleLogout,
    
    // Computed
    isPathActive,
    isVideoPlanningActive,
    currentSubMenuTitle,
    showEmptyState,
  }
}