export interface MenuItem {
  id: string
  label: string
  path?: string
  icon?: React.ReactNode
  badge?: number | string
  children?: MenuItem[]
  onClick?: () => void
  ariaLabel?: string
}

export interface Project {
  id: number
  name: string
  status: string
}

export interface BreadcrumbItem {
  label: string
  path?: string
}

export interface EnhancedSideBarProps {
  /** 현재 활성화된 탭 */
  tab?: string
  /** 메뉴 열림 상태 */
  isOpen?: boolean
  /** 프로젝트 목록 */
  projects?: Project[]
  /** 메뉴 클릭 핸들러 */
  onMenuClick?: (menuType: string) => void
  /** 닫기 핸들러 */
  onClose?: () => void
  /** 검색 가능 여부 */
  searchable?: boolean
  /** 검색 플레이스홀더 */
  searchPlaceholder?: string
  /** 브레드크럼 아이템 */
  breadcrumbs?: BreadcrumbItem[]
  /** 커스텀 메뉴 아이템 */
  customMenuItems?: MenuItem[]
  /** 로그아웃 핸들러 */
  onLogout?: () => void
  /** 접근성 라벨 */
  ariaLabel?: string
}

export interface SubMenuProps {
  isOpen: boolean
  title: string
  projects: Project[]
  tabName: string
  onClose: () => void
  onProjectClick: (projectId: number) => void
  onCreateProject: () => void
}

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onClear?: () => void
  ariaLabel?: string
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  onItemClick?: (index: number) => void
  ariaLabel?: string
}