# VideoPlanet 서브메뉴 개선 명세서

## 개요
EnhancedSideBar 컴포넌트의 서브메뉴 UX를 개선하여 시각적 일관성, 인터랙션 명확성, 접근성을 향상시킵니다.

## 1. View-Model 정의

### 1.1 서브메뉴 상태 모델
```typescript
interface SubmenuState {
  // 기본 상태
  isOpen: boolean;
  activeTab: 'project' | 'video-planning' | 'feedback' | null;
  
  // 데이터 상태
  items: SubmenuItem[];
  isLoading: boolean;
  error: string | null;
  
  // UI 상태
  searchQuery: string;
  focusedItemId: string | null;
  animationState: 'entering' | 'entered' | 'exiting' | 'exited';
  
  // 모바일 상태
  isMobile: boolean;
  swipeProgress: number; // 0-100 for swipe gesture
}

interface SubmenuItem {
  id: string;
  label: string;
  path?: string;
  icon?: ReactNode;
  badge?: number;
  description?: string;
  isActive?: boolean;
  isDisabled?: boolean;
}
```

### 1.2 초기값 및 기본값
```typescript
const INITIAL_SUBMENU_STATE: SubmenuState = {
  isOpen: false,
  activeTab: null,
  items: [],
  isLoading: false,
  error: null,
  searchQuery: '',
  focusedItemId: null,
  animationState: 'exited',
  isMobile: false,
  swipeProgress: 0
};

const ANIMATION_DURATION = 300; // ms
const SWIPE_THRESHOLD = 50; // px
const FOCUS_DELAY = 100; // ms
```

## 2. 컴포넌트 구조 개선

### 2.1 파일 구조
```
src/shared/ui/EnhancedSideBar/
├── EnhancedSideBar.tsx       # 메인 컴포넌트
├── EnhancedSideBar.module.scss
├── components/
│   ├── Submenu/
│   │   ├── Submenu.tsx       # 서브메뉴 컴포넌트
│   │   ├── Submenu.module.scss
│   │   └── Submenu.test.tsx
│   ├── SubmenuItem/
│   │   ├── SubmenuItem.tsx
│   │   └── SubmenuItem.module.scss
│   └── SubmenuHeader/
│       ├── SubmenuHeader.tsx
│       └── SubmenuHeader.module.scss
├── hooks/
│   ├── useSubmenuState.ts
│   ├── useFocusManagement.ts
│   └── useSwipeGesture.ts
├── utils/
│   └── submenu.utils.ts
└── types.ts
```

### 2.2 개선된 Submenu 컴포넌트
```tsx
interface SubmenuProps {
  isOpen: boolean;
  activeTab: string | null;
  items: SubmenuItem[];
  onClose: () => void;
  onItemClick: (item: SubmenuItem) => void;
  className?: string;
  'aria-label'?: string;
}

export function Submenu({
  isOpen,
  activeTab,
  items,
  onClose,
  onItemClick,
  className,
  'aria-label': ariaLabel
}: SubmenuProps) {
  const submenuRef = useRef<HTMLDivElement>(null);
  const { focusedId, handleKeyDown } = useFocusManagement(items, isOpen);
  const { swipeProgress, handleTouchStart, handleTouchMove, handleTouchEnd } = 
    useSwipeGesture(onClose);
  
  // 포커스 관리
  useEffect(() => {
    if (isOpen && items.length > 0) {
      setTimeout(() => {
        const firstItem = submenuRef.current?.querySelector('[role="menuitem"]');
        (firstItem as HTMLElement)?.focus();
      }, FOCUS_DELAY);
    }
  }, [isOpen, items]);
  
  // ESC 키 처리
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  return (
    <>
      {/* 모바일 오버레이 */}
      <div 
        className={styles.overlay}
        onClick={onClose}
        aria-hidden="true"
        data-visible={isOpen}
      />
      
      {/* 서브메뉴 본체 */}
      <div
        ref={submenuRef}
        className={cn(styles.submenu, className)}
        role="navigation"
        aria-label={ariaLabel || `${activeTab} 서브메뉴`}
        aria-expanded={isOpen}
        data-state={isOpen ? 'open' : 'closed'}
        data-swipe-progress={swipeProgress}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
      >
        <SubmenuHeader 
          title={getTabTitle(activeTab)}
          onClose={onClose}
          onAdd={activeTab === 'project' ? handleAddProject : undefined}
        />
        
        <div className={styles.content}>
          {items.length > 0 ? (
            <ul role="menu" className={styles.itemList}>
              {items.map((item) => (
                <SubmenuItem
                  key={item.id}
                  item={item}
                  isFocused={focusedId === item.id}
                  onClick={() => onItemClick(item)}
                />
              ))}
            </ul>
          ) : (
            <EmptyState 
              type={activeTab}
              onAction={handleEmptyAction}
            />
          )}
        </div>
      </div>
    </>
  );
}
```

## 3. 스타일 개선

### 3.1 시각적 연속성 강화
```scss
// Submenu.module.scss
.submenu {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 330px;
  background: linear-gradient(
    90deg,
    $color-white 0%,
    $color-gray-50 10%,
    $color-gray-50 100%
  );
  border-left: 1px solid $color-gray-200;
  box-shadow: inset -2px 0 8px rgba(0, 0, 0, 0.03);
  transition: transform $animation-duration ease-out;
  z-index: 998;
  
  // 데스크톱: 슬라이드 인
  @include desktop-up {
    left: 300px;
    transform: translateX(-100%);
    
    &[data-state="open"] {
      transform: translateX(0);
    }
  }
  
  // 태블릿: 오버레이
  @include tablet-only {
    left: 0;
    transform: translateX(-100%);
    
    &[data-state="open"] {
      transform: translateX(300px);
    }
  }
  
  // 모바일: 바텀 시트
  @include mobile-only {
    left: 0;
    right: 0;
    top: auto;
    bottom: 0;
    width: 100%;
    height: 70vh;
    max-height: 600px;
    border-radius: $radius-xl $radius-xl 0 0;
    border-left: none;
    border-top: 1px solid $color-gray-200;
    transform: translateY(100%);
    
    &[data-state="open"] {
      transform: translateY(0);
    }
    
    // 스와이프 진행도
    &[data-swipe-progress] {
      transform: translateY(calc(var(--swipe-progress) * 1%));
    }
  }
}

// 오버레이
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  opacity: 0;
  visibility: hidden;
  transition: opacity $animation-duration ease-out;
  z-index: 997;
  
  &[data-visible="true"] {
    opacity: 1;
    visibility: visible;
  }
  
  @include desktop-up {
    display: none;
  }
}
```

### 3.2 서브메뉴 아이템 스타일
```scss
.itemList {
  list-style: none;
  padding: $spacing-md;
  margin: 0;
}

.item {
  position: relative;
  margin-bottom: $spacing-xs;
  
  button {
    width: 100%;
    min-height: 48px;
    padding: $spacing-sm $spacing-md;
    display: flex;
    align-items: center;
    gap: $spacing-sm;
    background: transparent;
    border: 2px solid transparent;
    border-radius: $radius-md;
    font-size: $font-size-base;
    color: $color-gray-700;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
    
    // 호버 상태
    &:hover {
      background: $color-white;
      border-color: $color-gray-200;
      transform: translateX(4px);
      box-shadow: $shadow-sm;
    }
    
    // 포커스 상태
    &:focus-visible {
      outline: none;
      border-color: $color-primary;
      box-shadow: 0 0 0 3px rgba($color-primary, 0.1);
    }
    
    // 활성 상태
    &[aria-current="page"] {
      background: $color-white;
      color: $color-primary;
      font-weight: $font-weight-semibold;
      border-color: $color-primary;
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 3px;
        height: 24px;
        background: $color-primary;
        border-radius: 0 2px 2px 0;
      }
    }
    
    // 비활성 상태
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      
      &:hover {
        background: transparent;
        transform: none;
      }
    }
  }
  
  // 아이콘
  .icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: $color-gray-500;
  }
  
  // 배지
  .badge {
    margin-left: auto;
    padding: 2px 8px;
    background: $color-primary;
    color: $color-white;
    border-radius: $radius-full;
    font-size: $font-size-xs;
    font-weight: $font-weight-semibold;
    min-width: 20px;
    text-align: center;
  }
}
```

## 4. 인터랙션 개선

### 4.1 포커스 관리 Hook
```typescript
// hooks/useFocusManagement.ts
export function useFocusManagement(
  items: SubmenuItem[],
  isOpen: boolean
) {
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const focusedIndex = items.findIndex(item => item.id === focusedId);
  
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || items.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = (focusedIndex + 1) % items.length;
        setFocusedId(items[nextIndex].id);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = focusedIndex <= 0 ? items.length - 1 : focusedIndex - 1;
        setFocusedId(items[prevIndex].id);
        break;
        
      case 'Home':
        e.preventDefault();
        setFocusedId(items[0].id);
        break;
        
      case 'End':
        e.preventDefault();
        setFocusedId(items[items.length - 1].id);
        break;
    }
  }, [items, focusedIndex, isOpen]);
  
  // 포커스 초기화
  useEffect(() => {
    if (isOpen && items.length > 0 && !focusedId) {
      setFocusedId(items[0].id);
    }
  }, [isOpen, items, focusedId]);
  
  return { focusedId, handleKeyDown };
}
```

### 4.2 스와이프 제스처 Hook (모바일)
```typescript
// hooks/useSwipeGesture.ts
export function useSwipeGesture(onClose: () => void) {
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const swipeProgress = isDragging 
    ? Math.max(0, Math.min(100, ((currentY - startY) / window.innerHeight) * 100))
    : 0;
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  }, []);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  }, [isDragging]);
  
  const handleTouchEnd = useCallback(() => {
    if (swipeProgress > SWIPE_THRESHOLD) {
      onClose();
    }
    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  }, [swipeProgress, onClose]);
  
  return {
    swipeProgress,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  };
}
```

## 5. 테스트 시나리오

### 5.1 E2E 테스트
```typescript
// e2e/submenu.spec.ts
describe('서브메뉴 인터랙션', () => {
  it('프로젝트 관리 서브메뉴 열기/닫기', async ({ page }) => {
    await page.goto('/dashboard');
    
    // 서브메뉴 열기
    await page.click('[aria-label="프로젝트 관리"]');
    await expect(page.locator('[role="navigation"][aria-label="project 서브메뉴"]'))
      .toHaveAttribute('aria-expanded', 'true');
    
    // 첫 번째 아이템으로 포커스 이동 확인
    await expect(page.locator('[role="menuitem"]:first-child'))
      .toBeFocused();
    
    // ESC로 닫기
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="navigation"][aria-label="project 서브메뉴"]'))
      .toHaveAttribute('aria-expanded', 'false');
  });
  
  it('키보드 네비게이션', async ({ page }) => {
    await page.goto('/dashboard');
    await page.click('[aria-label="프로젝트 관리"]');
    
    // 화살표 키로 이동
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('[role="menuitem"]:nth-child(2)'))
      .toBeFocused();
    
    // Home/End 키
    await page.keyboard.press('End');
    await expect(page.locator('[role="menuitem"]:last-child'))
      .toBeFocused();
  });
  
  it('모바일 스와이프 제스처', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.click('[aria-label="프로젝트 관리"]');
    
    const submenu = page.locator('[role="navigation"][aria-label="project 서브메뉴"]');
    
    // 스와이프 다운으로 닫기
    await submenu.dispatchEvent('touchstart', { touches: [{ clientY: 200 }] });
    await submenu.dispatchEvent('touchmove', { touches: [{ clientY: 400 }] });
    await submenu.dispatchEvent('touchend');
    
    await expect(submenu).toHaveAttribute('data-state', 'closed');
  });
});
```

### 5.2 단위 테스트
```typescript
// Submenu.test.tsx
describe('Submenu Component', () => {
  it('올바른 ARIA 속성 렌더링', () => {
    const { getByRole } = render(
      <Submenu
        isOpen={true}
        activeTab="project"
        items={mockItems}
        onClose={jest.fn()}
        onItemClick={jest.fn()}
      />
    );
    
    const nav = getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'project 서브메뉴');
    expect(nav).toHaveAttribute('aria-expanded', 'true');
  });
  
  it('빈 상태 메시지 표시', () => {
    const { getByText } = render(
      <Submenu
        isOpen={true}
        activeTab="project"
        items={[]}
        onClose={jest.fn()}
        onItemClick={jest.fn()}
      />
    );
    
    expect(getByText('등록된 프로젝트가 없습니다')).toBeInTheDocument();
  });
});
```

## 6. 성능 최적화

### 6.1 애니메이션 최적화
```scss
// GPU 가속 사용
.submenu {
  will-change: transform;
  transform: translateZ(0); // 레이어 생성
  
  // 애니메이션 중 백페이스 숨기기
  backface-visibility: hidden;
  
  // 부드러운 글꼴 렌더링
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

// Reduced Motion 지원
@media (prefers-reduced-motion: reduce) {
  .submenu {
    transition-duration: 0.01ms !important;
  }
}
```

### 6.2 메모이제이션
```typescript
// 서브메뉴 아이템 메모이제이션
const SubmenuItem = React.memo(({ 
  item, 
  isFocused, 
  onClick 
}: SubmenuItemProps) => {
  return (
    <li className={styles.item}>
      <button
        role="menuitem"
        aria-current={item.isActive ? 'page' : undefined}
        aria-describedby={item.description ? `desc-${item.id}` : undefined}
        data-focused={isFocused}
        onClick={onClick}
        disabled={item.isDisabled}
      >
        {item.icon && <span className={styles.icon}>{item.icon}</span>}
        <span>{item.label}</span>
        {item.badge && <span className={styles.badge}>{item.badge}</span>}
      </button>
    </li>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.isActive === nextProps.item.isActive &&
    prevProps.isFocused === nextProps.isFocused
  );
});
```

## 7. 마이크로카피

### 7.1 상태별 메시지
```typescript
const MESSAGES = {
  empty: {
    project: {
      title: '등록된 프로젝트가 없습니다',
      action: '프로젝트 등록'
    },
    'video-planning': {
      title: 'AI 영상 기획으로\n빠르게 시작하세요',
      action: 'AI 기획 시작'
    },
    feedback: {
      title: '피드백을 시작할\n프로젝트를 선택하세요',
      action: '프로젝트 보기'
    }
  },
  loading: '불러오는 중...',
  error: {
    default: '일시적인 오류가 발생했습니다',
    network: '네트워크 연결을 확인해주세요',
    permission: '접근 권한이 없습니다'
  }
};
```

### 7.2 접근성 레이블
```typescript
const A11Y_LABELS = {
  close: '서브메뉴 닫기',
  add: '새 항목 추가',
  search: '항목 검색',
  clearSearch: '검색어 지우기',
  menuItem: (label: string, isActive: boolean) => 
    `${label}${isActive ? ' (현재 페이지)' : ''}`,
  badge: (count: number) => `${count}개`
};
```

## 8. 구현 체크리스트

### Phase 1: 기본 개선 (1주차)
- [ ] 시각적 연속성 스타일 적용
- [ ] 포커스 관리 구현
- [ ] ARIA 속성 추가
- [ ] ESC 키 닫기 구현

### Phase 2: 인터랙션 개선 (2주차)
- [ ] 스마트 토글 로직 구현
- [ ] 외부 클릭 닫기 구현
- [ ] 키보드 네비게이션 완성
- [ ] 애니메이션 최적화

### Phase 3: 모바일 최적화 (3주차)
- [ ] 바텀 시트 레이아웃 구현
- [ ] 스와이프 제스처 추가
- [ ] 터치 타겟 크기 최적화
- [ ] 반응형 브레이크포인트 조정

### Phase 4: 품질 보증 (4주차)
- [ ] E2E 테스트 작성
- [ ] 단위 테스트 작성
- [ ] 접근성 검증 (axe-core)
- [ ] 성능 프로파일링

## 9. 예상 결과

### 정량적 지표
- 서브메뉴 열기 시간: 500ms → 300ms (40% 개선)
- 태스크 완료율: 85% → 95% (10% 향상)
- 키보드 네비게이션 성공률: 70% → 100% (30% 향상)
- 모바일 사용성 점수: 75 → 90 (20% 개선)

### 정성적 개선
- 시각적 일관성 향상으로 브랜드 신뢰도 증가
- 직관적인 인터랙션으로 학습 곡선 감소
- 접근성 개선으로 사용자 기반 확대
- 모바일 경험 개선으로 이탈률 감소

## 10. 위험 요소 및 완화 방안

| 위험 요소 | 영향도 | 완화 방안 |
|----------|--------|-----------|
| 기존 사용자 혼란 | 중 | 점진적 롤아웃, A/B 테스트 |
| 성능 저하 | 높 | 프로파일링, 코드 스플리팅 |
| 브라우저 호환성 | 중 | 폴리필, 점진적 향상 |
| 접근성 규정 미준수 | 높 | 자동화 테스트, 수동 검증 |