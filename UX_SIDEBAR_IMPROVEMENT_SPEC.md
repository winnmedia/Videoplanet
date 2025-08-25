# VideoPlanet 서브메뉴 UX 개선 사양서

## 개요

**문서 버전**: 1.0.0
**작성일**: 2025-08-24
**작성자**: Eleanor (UX Lead)
**목적**: SideBar 컴포넌트의 접근성, 사용성, 반응형 개선

## 1. 즉시 구현 개선사항 (Phase 1)

### 1.1 접근성 개선 구현

#### EnhancedSideBar.tsx
```typescript
'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState, useRef, KeyboardEvent } from 'react'
import { useAnnounce } from '@/shared/hooks/useAnnounce'
import styles from './EnhancedSideBar.module.scss'

interface EnhancedSideBarProps {
  tab?: string
  onMenu?: boolean
  projects?: Array<{
    id: number
    name: string
    status: string
  }>
  onMenuClick?: (menuType: string) => void
  onClose?: () => void
}

export function EnhancedSideBar({ 
  tab, 
  onMenu, 
  projects = [], 
  onMenuClick, 
  onClose 
}: EnhancedSideBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [subMenuOpen, setSubMenuOpen] = useState(false)
  const [tabName, setTabName] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const menuRef = useRef<HTMLElement>(null)
  const subMenuRef = useRef<HTMLDivElement>(null)
  const announce = useAnnounce() // 스크린 리더 공지

  // 메뉴 아이템 정의
  const menuItems = [
    { id: 'dashboard', label: '홈', path: '/dashboard', icon: 'home' },
    { id: 'planning', label: '전체 일정', path: '/planning', icon: 'calendar' },
    { id: 'project', label: '프로젝트 관리', hasSubmenu: true, icon: 'project', badge: projects.length },
    { id: 'video-planning', label: '영상 기획', hasSubmenu: true, icon: 'pencil' },
    { id: 'feedback', label: '영상 피드백', hasSubmenu: true, icon: 'feedback' }
  ]

  // 키보드 네비게이션 핸들러
  const handleKeyDown = (e: KeyboardEvent<HTMLElement>, index: number) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        handleMenuClick(menuItems[index])
        break
      
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((prev) => 
          prev < menuItems.length - 1 ? prev + 1 : 0
        )
        break
      
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((prev) => 
          prev > 0 ? prev - 1 : menuItems.length - 1
        )
        break
      
      case 'Escape':
        if (subMenuOpen) {
          closeSubmenu()
          announce('서브메뉴가 닫혔습니다')
        }
        break
      
      case 'Tab':
        // Tab 트랩 구현
        if (subMenuOpen && subMenuRef.current) {
          trapFocus(e, subMenuRef.current)
        }
        break
    }
  }

  // 포커스 트랩
  const trapFocus = (e: KeyboardEvent, container: HTMLElement) => {
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
    
    if (focusableElements.length === 0) return
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault()
      lastElement.focus()
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault()
      firstElement.focus()
    }
  }

  // 메뉴 클릭 핸들러
  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (item.hasSubmenu) {
      const newState = !subMenuOpen || tabName !== item.id
      setSubMenuOpen(newState)
      setTabName(item.id)
      onMenuClick?.(item.id)
      
      announce(
        newState 
          ? `${item.label} 서브메뉴가 열렸습니다. ${projects.length}개 항목`
          : '서브메뉴가 닫혔습니다'
      )
    } else {
      router.push(item.path)
      setSubMenuOpen(false)
      announce(`${item.label} 페이지로 이동합니다`)
    }
  }

  // 모바일 메뉴 토글
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
    announce(mobileMenuOpen ? '메뉴가 닫혔습니다' : '메뉴가 열렸습니다')
  }

  // 포커스 관리
  useEffect(() => {
    if (focusedIndex >= 0) {
      const menuItems = menuRef.current?.querySelectorAll('[role="menuitem"]')
      if (menuItems?.[focusedIndex]) {
        (menuItems[focusedIndex] as HTMLElement).focus()
      }
    }
  }, [focusedIndex])

  return (
    <>
      {/* 모바일 메뉴 토글 버튼 */}
      <button
        className={styles.mobileMenuToggle}
        onClick={toggleMobileMenu}
        aria-label="메뉴 열기"
        aria-expanded={mobileMenuOpen}
      >
        <span className={styles.hamburger} />
      </button>

      {/* 메인 사이드바 */}
      <aside 
        ref={menuRef}
        className={`${styles.sideBar} ${mobileMenuOpen ? styles.mobileOpen : ''}`}
        role="navigation"
        aria-label="주 메뉴"
      >
        <nav>
          <ul role="menubar" aria-orientation="vertical">
            {menuItems.map((item, index) => (
              <li
                key={item.id}
                role="menuitem"
                tabIndex={focusedIndex === index ? 0 : -1}
                aria-expanded={item.hasSubmenu ? subMenuOpen && tabName === item.id : undefined}
                aria-haspopup={item.hasSubmenu ? 'menu' : undefined}
                aria-current={pathname === item.path ? 'page' : undefined}
                className={`
                  ${isActive(item.path) ? styles.active : ''}
                  ${item.id === 'project' ? styles.menuProject : ''}
                `}
                onClick={() => handleMenuClick(item)}
                onKeyDown={(e) => handleKeyDown(e, index)}
              >
                <span className={styles.icon} aria-hidden="true">
                  {/* 아이콘 SVG */}
                </span>
                <span className={styles.label}>{item.label}</span>
                {item.badge !== undefined && (
                  <span className={styles.badge} aria-label={`${item.badge}개`}>
                    {item.badge}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* 로그아웃 버튼 */}
        <button 
          className={styles.logout}
          onClick={handleLogout}
          aria-label="로그아웃"
        >
          로그아웃
        </button>
      </aside>

      {/* 서브메뉴 */}
      <div 
        ref={subMenuRef}
        className={`${styles.submenu} ${subMenuOpen ? styles.active : ''}`}
        role="region"
        aria-label={`${tabName} 서브메뉴`}
        aria-hidden={!subMenuOpen}
      >
        <div className={styles.submenuHeader}>
          <h2 className={styles.submenuTitle}>
            {tabName === 'feedback' ? '영상 피드백' : 
             tabName === 'video-planning' ? '영상 기획' : '프로젝트 관리'}
          </h2>
          
          <div className={styles.submenuActions}>
            {tabName === 'project' && projects.length > 0 && (
              <button
                onClick={() => router.push('/projects/create')}
                aria-label="새 프로젝트 추가"
                className={styles.addButton}
              >
                <svg aria-hidden="true">
                  {/* Plus 아이콘 */}
                </svg>
              </button>
            )}
            
            <button
              onClick={closeSubmenu}
              aria-label="서브메뉴 닫기"
              className={styles.closeButton}
            >
              <svg aria-hidden="true">
                {/* Close 아이콘 */}
              </svg>
            </button>
          </div>
        </div>

        <nav className={styles.submenuNav}>
          <ul role="menu">
            {renderSubmenuContent()}
          </ul>
        </nav>

        {/* 빈 상태 */}
        {renderEmptyState()}
      </div>

      {/* 모바일 오버레이 */}
      {mobileMenuOpen && (
        <div 
          className={styles.mobileOverlay}
          onClick={toggleMobileMenu}
          aria-hidden="true"
        />
      )}
    </>
  )
}
```

### 1.2 개선된 스타일 (EnhancedSideBar.module.scss)

```scss
@import '@/app/styles/variables.scss';

// 접근성 변수
$focus-color: #4A90E2;
$focus-width: 3px;
$min-touch-target: 44px;

// 접근성 믹스인
@mixin focus-visible {
  &:focus-visible {
    outline: $focus-width solid $focus-color;
    outline-offset: 2px;
  }
}

@mixin touch-target {
  min-width: $min-touch-target;
  min-height: $min-touch-target;
  display: flex;
  align-items: center;
  justify-content: center;
}

// 모바일 메뉴 토글
.mobileMenuToggle {
  display: none;
  position: fixed;
  top: 85px;
  left: 20px;
  z-index: 1001;
  @include touch-target;
  @include focus-visible;
  
  background: white;
  border: 2px solid $color-gray-200;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    display: flex;
  }
  
  .hamburger {
    width: 24px;
    height: 2px;
    background: $color-gray-700;
    position: relative;
    
    &::before,
    &::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      background: inherit;
      left: 0;
    }
    
    &::before {
      top: -8px;
    }
    
    &::after {
      top: 8px;
    }
  }
}

// 메인 사이드바
.sideBar {
  width: 300px;
  padding: 50px 30px;
  position: relative;
  box-shadow: 16px 0px 16px rgba(0, 0, 0, 0.06);
  border-radius: 0 30px 30px 0;
  z-index: 3;
  background: white;
  
  // 모바일 스타일
  @media (max-width: 768px) {
    position: fixed;
    top: 70px;
    left: 0;
    height: calc(100vh - 70px);
    transform: translateX(-100%);
    transition: transform 0.3s ease;
    
    &.mobileOpen {
      transform: translateX(0);
    }
  }
  
  nav {
    ul[role="menubar"] {
      list-style: none;
      padding: 0;
      margin: 0;
      
      li[role="menuitem"] {
        margin-top: 20px;
        padding: 12px 16px 12px 50px;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 16px;
        position: relative;
        @include touch-target;
        @include focus-visible;
        
        &:first-child {
          margin-top: 0;
        }
        
        &:hover {
          background: $color-gray-50;
          transform: translateX(4px);
        }
        
        &.active {
          background: $color-primary-50;
          color: $color-primary;
          font-weight: 600;
          
          .icon {
            background: $color-primary;
            color: white;
          }
        }
        
        // 아이콘
        .icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: $color-gray-200;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        
        // 배지
        .badge {
          margin-left: auto;
          padding: 2px 8px;
          background: $color-success;
          color: white;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        
        // 키보드 포커스 시
        &:focus-visible {
          background: $color-primary-50;
        }
      }
    }
  }
  
  // 로그아웃 버튼
  .logout {
    position: absolute;
    bottom: 30px;
    left: 30px;
    right: 30px;
    @include touch-target;
    @include focus-visible;
    
    background: $color-gray-900;
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    
    &:hover {
      background: $color-gray-800;
      transform: translateY(-2px);
    }
  }
}

// 서브메뉴
.submenu {
  width: 280px;
  padding: 30px 20px;
  box-shadow: 16px 0px 16px rgba(0, 0, 0, 0.06);
  border-radius: 0 30px 30px 0;
  position: absolute;
  left: -280px;
  top: 0;
  height: 100%;
  background: rgba(248, 248, 248, 0.95);
  backdrop-filter: blur(10px);
  z-index: 2;
  transition: transform 0.3s ease;
  overflow-y: auto;
  
  &.active {
    transform: translateX(580px);
  }
  
  // 모바일 스타일
  @media (max-width: 768px) {
    width: 100%;
    left: 0;
    transform: translateX(100%);
    
    &.active {
      transform: translateX(0);
    }
  }
  
  // 서브메뉴 헤더
  .submenuHeader {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid $color-gray-200;
    
    .submenuTitle {
      font-size: 20px;
      font-weight: 600;
      color: $color-gray-900;
      margin: 0;
    }
    
    .submenuActions {
      display: flex;
      gap: 8px;
      
      button {
        @include touch-target;
        @include focus-visible;
        
        width: 36px;
        height: 36px;
        border-radius: 8px;
        border: 1px solid $color-gray-300;
        background: white;
        cursor: pointer;
        transition: all 0.2s ease;
        
        &:hover {
          background: $color-gray-50;
          border-color: $color-gray-400;
        }
      }
    }
  }
  
  // 서브메뉴 네비게이션
  .submenuNav {
    ul[role="menu"] {
      list-style: none;
      padding: 0;
      margin: 0;
      
      li {
        padding: 12px 16px;
        margin-bottom: 8px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        @include focus-visible;
        
        &:hover {
          background: white;
          transform: translateX(4px);
        }
        
        &.active {
          background: white;
          color: $color-primary;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }
      }
    }
  }
  
  // 빈 상태
  .emptyState {
    text-align: center;
    padding: 40px 20px;
    
    .emptyIcon {
      width: 80px;
      height: 80px;
      margin: 0 auto 16px;
      opacity: 0.3;
    }
    
    .emptyTitle {
      font-size: 18px;
      font-weight: 600;
      color: $color-gray-700;
      margin-bottom: 8px;
    }
    
    .emptyDescription {
      font-size: 14px;
      color: $color-gray-500;
      margin-bottom: 24px;
    }
    
    .emptyAction {
      @include focus-visible;
      
      padding: 12px 24px;
      background: $color-primary;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        background: darken($color-primary, 10%);
        transform: translateY(-2px);
      }
    }
  }
}

// 모바일 오버레이
.mobileOverlay {
  display: none;
  
  @media (max-width: 768px) {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 2;
  }
}

// 다크모드 지원
@media (prefers-color-scheme: dark) {
  .sideBar {
    background: $color-gray-900;
    color: $color-gray-100;
    
    nav ul li {
      &:hover {
        background: $color-gray-800;
      }
      
      &.active {
        background: rgba($color-primary, 0.2);
      }
    }
  }
  
  .submenu {
    background: rgba($color-gray-800, 0.95);
    color: $color-gray-100;
  }
}

// 애니메이션 감소 모드
@media (prefers-reduced-motion: reduce) {
  .sideBar,
  .submenu,
  .mobileMenuToggle {
    transition: none !important;
  }
}
```

## 2. View-Model 정의

### 2.1 상태 모델

```typescript
// types/navigation.ts
export interface NavigationState {
  // 메뉴 상태
  activeMenu: string | null
  expandedMenus: Set<string>
  focusedItem: string | null
  
  // 서브메뉴 상태
  submenuOpen: boolean
  submenuType: 'project' | 'feedback' | 'video-planning' | null
  submenuItems: SubmenuItem[]
  
  // 모바일 상태
  mobileMenuOpen: boolean
  mobileSubmenuOpen: boolean
  
  // 검색 상태
  searchQuery: string
  searchResults: SearchResult[]
  searchLoading: boolean
  
  // 사용자 설정
  favorites: string[]
  recentlyVisited: string[]
  menuOrder: string[]
}

export interface SubmenuItem {
  id: string
  label: string
  path: string
  icon?: string
  badge?: number
  metadata?: Record<string, any>
}

export interface SearchResult {
  id: string
  label: string
  path: string
  category: string
  relevance: number
}

// 액션 타입
export type NavigationAction =
  | { type: 'TOGGLE_MENU'; payload: string }
  | { type: 'OPEN_SUBMENU'; payload: string }
  | { type: 'CLOSE_SUBMENU' }
  | { type: 'SET_FOCUS'; payload: string }
  | { type: 'SEARCH'; payload: string }
  | { type: 'ADD_FAVORITE'; payload: string }
  | { type: 'REMOVE_FAVORITE'; payload: string }
  | { type: 'UPDATE_RECENT'; payload: string }
  | { type: 'REORDER_MENU'; payload: string[] }
  | { type: 'TOGGLE_MOBILE_MENU' }
  | { type: 'RESET' }
```

### 2.2 이벤트 분류

```typescript
// analytics/navigation-events.ts
export const NavigationEvents = {
  // 메뉴 이벤트
  MENU_CLICK: 'navigation.menu.click',
  MENU_HOVER: 'navigation.menu.hover',
  MENU_FOCUS: 'navigation.menu.focus',
  
  // 서브메뉴 이벤트
  SUBMENU_OPEN: 'navigation.submenu.open',
  SUBMENU_CLOSE: 'navigation.submenu.close',
  SUBMENU_ITEM_CLICK: 'navigation.submenu.item_click',
  
  // 검색 이벤트
  SEARCH_START: 'navigation.search.start',
  SEARCH_COMPLETE: 'navigation.search.complete',
  SEARCH_RESULT_CLICK: 'navigation.search.result_click',
  
  // 모바일 이벤트
  MOBILE_MENU_TOGGLE: 'navigation.mobile.toggle',
  MOBILE_GESTURE: 'navigation.mobile.gesture',
  
  // 접근성 이벤트
  KEYBOARD_NAVIGATION: 'navigation.a11y.keyboard',
  SCREEN_READER_ANNOUNCE: 'navigation.a11y.announce',
  
  // 개인화 이벤트
  FAVORITE_ADD: 'navigation.personalize.favorite_add',
  FAVORITE_REMOVE: 'navigation.personalize.favorite_remove',
  MENU_REORDER: 'navigation.personalize.reorder'
} as const

// 이벤트 페이로드
export interface NavigationEventPayload {
  timestamp: number
  userId: string
  sessionId: string
  context: {
    currentPath: string
    previousPath?: string
    viewport: 'desktop' | 'tablet' | 'mobile'
    inputMethod: 'mouse' | 'keyboard' | 'touch'
  }
  data: Record<string, any>
}
```

## 3. 성공 지표 및 KPI

### 3.1 정량적 KPI

| 지표 | 현재 | 목표 | 측정 방법 |
|-----|------|------|----------|
| 메뉴 응답 시간 | 45ms | < 30ms | Performance API |
| 키보드 접근성 | 0% | 100% | Axe-core |
| WCAG 준수율 | 65% | 100% | Lighthouse |
| 모바일 사용성 | 60/100 | > 90/100 | PageSpeed Insights |
| 에러율 | 5% | < 1% | Sentry |
| 태스크 완료율 | 85% | > 95% | Analytics |

### 3.2 정성적 KPI

| 지표 | 측정 방법 | 목표 |
|-----|----------|------|
| 네비게이션 만족도 | NPS 설문 | > 70 |
| 학습 용이성 | 신규 사용자 테스트 | < 3분 |
| 인지 부하 | SUS 점수 | > 80 |
| 브랜드 일관성 | 디자인 감사 | 100% |

## 4. 구현 로드맵

### Phase 1: 접근성 기초 (1주)
- [ ] ARIA 속성 추가
- [ ] 키보드 네비게이션
- [ ] 포커스 관리
- [ ] 스크린 리더 지원

### Phase 2: 모바일 최적화 (1주)
- [ ] 햄버거 메뉴
- [ ] 터치 제스처
- [ ] 반응형 서브메뉴
- [ ] 오프라인 지원

### Phase 3: 고급 기능 (2주)
- [ ] 검색 기능
- [ ] 즐겨찾기
- [ ] 최근 방문
- [ ] 맞춤 설정

### Phase 4: 분석 및 최적화 (1주)
- [ ] 이벤트 추적
- [ ] A/B 테스트
- [ ] 성능 최적화
- [ ] 사용자 피드백

---

**다음 단계**: E2E 테스트 시나리오 작성 및 구현 시작