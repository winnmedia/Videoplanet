// =============================================================================
// FeedbackFilter Component - 피드백 필터링 컴포넌트
// =============================================================================

'use client';

import React, { memo, useState, useCallback, useEffect } from 'react';
import type { Feedback, FeedbackFilterOptions, FeedbackSortBy, SortOrder } from '../types';

interface FeedbackFilterProps {
  feedbacks: Feedback[];
  onFilterChange: (filteredFeedbacks: Feedback[]) => void;
  onSortChange?: (sortBy: FeedbackSortBy, order: SortOrder) => void;
  className?: string;
  showAdvancedFilters?: boolean; // 고급 필터 표시 여부
}

interface FilterState extends FeedbackFilterOptions {
  searchText: string;
  sortBy: FeedbackSortBy;
  sortOrder: SortOrder;
  showOnlyWithTimestamp: boolean;
  showOnlySecret: boolean;
  selectedAuthors: string[];
}

/**
 * 피드백 필터링 컴포넌트
 * - 텍스트 검색
 * - 날짜 범위 필터
 * - 작성자 필터
 * - 익명/일반 필터
 * - 타임스탬프 유무 필터
 * - 정렬 옵션
 */
const FeedbackFilter: React.FC<FeedbackFilterProps> = memo(({
  feedbacks,
  onFilterChange,
  onSortChange,
  className = '',
  showAdvancedFilters = true,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [filterState, setFilterState] = useState<FilterState>({
    searchText: '',
    sortBy: 'created',
    sortOrder: 'desc',
    showOnlyWithTimestamp: false,
    showOnlySecret: false,
    selectedAuthors: [],
  });

  // 고유한 작성자 목록 생성
  const uniqueAuthors = React.useMemo(() => {
    const authors = new Set<string>();
    feedbacks.forEach(feedback => {
      if (!feedback.secret && feedback.nickname) {
        authors.add(feedback.nickname);
      }
    });
    return Array.from(authors).sort();
  }, [feedbacks]);

  // 날짜 범위 옵션
  const dateRangeOptions = [
    { value: '', label: '전체 기간' },
    { value: 'today', label: '오늘' },
    { value: 'week', label: '이번 주' },
    { value: 'month', label: '이번 달' },
    { value: 'custom', label: '직접 선택' },
  ];

  // 정렬 옵션
  const sortOptions = [
    { value: 'created', label: '작성 시간' },
    { value: 'updated', label: '수정 시간' },
    { value: 'section', label: '타임스탬프' },
    { value: 'author', label: '작성자' },
  ];

  // 필터 상태 업데이트
  const updateFilter = useCallback((updates: Partial<FilterState>) => {
    setFilterState(prev => ({ ...prev, ...updates }));
  }, []);

  // 날짜 범위 계산
  const calculateDateRange = useCallback((range: string): { start: Date; end: Date } | null => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (range) {
      case 'today':
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        };
      
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return {
          start: weekStart,
          end: new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000),
        };
      
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        return {
          start: monthStart,
          end: monthEnd,
        };
      
      default:
        return null;
    }
  }, []);

  // 텍스트 검색 필터
  const filterByText = useCallback((feedback: Feedback, searchText: string): boolean => {
    if (!searchText.trim()) return true;
    
    const text = searchText.toLowerCase();
    return (
      feedback.contents.toLowerCase().includes(text) ||
      feedback.section.toLowerCase().includes(text) ||
      (!feedback.secret && feedback.nickname.toLowerCase().includes(text))
    );
  }, []);

  // 날짜 필터
  const filterByDate = useCallback((feedback: Feedback, dateRange?: { start: Date; end: Date }): boolean => {
    if (!dateRange) return true;
    
    const feedbackDate = new Date(feedback.created);
    return feedbackDate >= dateRange.start && feedbackDate < dateRange.end;
  }, []);

  // 작성자 필터
  const filterByAuthor = useCallback((feedback: Feedback, selectedAuthors: string[]): boolean => {
    if (selectedAuthors.length === 0) return true;
    
    return !feedback.secret && selectedAuthors.includes(feedback.nickname);
  }, []);

  // 타임스탬프 필터
  const filterByTimestamp = useCallback((feedback: Feedback, showOnlyWithTimestamp: boolean): boolean => {
    if (!showOnlyWithTimestamp) return true;
    
    return Boolean(feedback.section && feedback.section.trim());
  }, []);

  // 익명 필터
  const filterBySecret = useCallback((feedback: Feedback, showOnlySecret: boolean): boolean => {
    if (!showOnlySecret) return true;
    
    return feedback.secret === true;
  }, []);

  // 피드백 정렬
  const sortFeedbacks = useCallback((feedbacks: Feedback[], sortBy: FeedbackSortBy, order: SortOrder): Feedback[] => {
    return [...feedbacks].sort((a, b) => {
      let compareValue = 0;

      switch (sortBy) {
        case 'created':
          compareValue = new Date(a.created).getTime() - new Date(b.created).getTime();
          break;
        
        case 'updated':
          const aUpdated = a.updated ? new Date(a.updated).getTime() : new Date(a.created).getTime();
          const bUpdated = b.updated ? new Date(b.updated).getTime() : new Date(b.created).getTime();
          compareValue = aUpdated - bUpdated;
          break;
        
        case 'section':
          // 타임스탬프를 초로 변환하여 비교
          const parseTime = (timestamp: string): number => {
            if (!timestamp) return 0;
            const parts = timestamp.split(':').map(Number);
            if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
            if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
            return 0;
          };
          compareValue = parseTime(a.section) - parseTime(b.section);
          break;
        
        case 'author':
          const aAuthor = a.secret ? '익명' : a.nickname;
          const bAuthor = b.secret ? '익명' : b.nickname;
          compareValue = aAuthor.localeCompare(bAuthor);
          break;
        
        default:
          return 0;
      }

      return order === 'asc' ? compareValue : -compareValue;
    });
  }, []);

  // 필터 적용
  const applyFilters = useCallback(() => {
    let filtered = [...feedbacks];

    // 텍스트 검색
    if (filterState.searchText) {
      filtered = filtered.filter(feedback => filterByText(feedback, filterState.searchText));
    }

    // 날짜 범위
    if (filterState.dateRange) {
      filtered = filtered.filter(feedback => filterByDate(feedback, filterState.dateRange));
    }

    // 작성자
    if (filterState.selectedAuthors.length > 0) {
      filtered = filtered.filter(feedback => filterByAuthor(feedback, filterState.selectedAuthors));
    }

    // 타임스탬프
    if (filterState.showOnlyWithTimestamp) {
      filtered = filtered.filter(feedback => filterByTimestamp(feedback, filterState.showOnlyWithTimestamp));
    }

    // 익명
    if (filterState.showOnlySecret) {
      filtered = filtered.filter(feedback => filterBySecret(feedback, filterState.showOnlySecret));
    }

    // 정렬
    const sorted = sortFeedbacks(filtered, filterState.sortBy, filterState.sortOrder);

    onFilterChange(sorted);
    
    if (onSortChange) {
      onSortChange(filterState.sortBy, filterState.sortOrder);
    }
  }, [
    feedbacks,
    filterState,
    filterByText,
    filterByDate,
    filterByAuthor,
    filterByTimestamp,
    filterBySecret,
    sortFeedbacks,
    onFilterChange,
    onSortChange,
  ]);

  // 필터 상태 변경시 자동 적용
  useEffect(() => {
    applyFilters();
  }, [filterState, applyFilters]);

  // 필터 초기화
  const resetFilters = useCallback(() => {
    setFilterState(prev => ({
      ...prev,
      searchText: '',
      sortBy: 'created',
      sortOrder: 'desc',
      showOnlyWithTimestamp: false,
      showOnlySecret: false,
      selectedAuthors: [],
    }));
  }, []);

  // 작성자 선택 토글
  const toggleAuthor = useCallback((author: string) => {
    updateFilter({
      selectedAuthors: filterState.selectedAuthors.includes(author)
        ? filterState.selectedAuthors.filter(a => a !== author)
        : [...filterState.selectedAuthors, author],
    });
  }, [filterState.selectedAuthors, updateFilter]);

  // 날짜 범위 변경
  const handleDateRangeChange = useCallback((value: string) => {
    if (value === '' || value === 'custom') {
      setFilterState(prev => {
        const newState = { ...prev };
        delete newState.dateRange;
        return newState;
      });
    } else {
      const range = calculateDateRange(value);
      if (range) {
        setFilterState(prev => ({ ...prev, dateRange: range }));
      }
    }
  }, [calculateDateRange]);

  // 활성 필터 개수 계산
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (filterState.searchText) count++;
    if (filterState.dateRange) count++;
    if (filterState.selectedAuthors.length > 0) count++;
    if (filterState.showOnlyWithTimestamp) count++;
    if (filterState.showOnlySecret) count++;
    return count;
  }, [filterState]);

  return (
    <div className={`feedback-filter ${className}`}>
      {/* 기본 필터 컨트롤 */}
      <div className="filter-main">
        {/* 검색 입력 */}
        <div className="search-container">
          <input
            type="text"
            value={filterState.searchText}
            onChange={(e) => updateFilter({ searchText: e.target.value })}
            placeholder="피드백 내용, 시점, 작성자 검색..."
            className="search-input"
            aria-label="피드백 검색"
          />
          <span className="search-icon">[검색]</span>
        </div>

        {/* 정렬 옵션 */}
        <div className="sort-container">
          <select
            value={filterState.sortBy}
            onChange={(e) => updateFilter({ sortBy: e.target.value as FeedbackSortBy })}
            className="sort-select"
            aria-label="정렬 기준"
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={() => updateFilter({ sortOrder: filterState.sortOrder === 'asc' ? 'desc' : 'asc' })}
            className="sort-order-btn"
            aria-label={`정렬 순서: ${filterState.sortOrder === 'asc' ? '오름차순' : '내림차순'}`}
            title={filterState.sortOrder === 'asc' ? '오름차순' : '내림차순'}
          >
            {filterState.sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        {/* 고급 필터 토글 */}
        {showAdvancedFilters && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`advanced-toggle ${activeFilterCount > 0 ? 'has-filters' : ''}`}
            aria-label="고급 필터 토글"
          >
            🔧 필터
            {activeFilterCount > 0 && (
              <span className="filter-count">{activeFilterCount}</span>
            )}
          </button>
        )}

        {/* 필터 초기화 */}
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="reset-btn"
            aria-label="필터 초기화"
            title="모든 필터 초기화"
          >
            ✕ 초기화
          </button>
        )}
      </div>

      {/* 고급 필터 패널 */}
      {showAdvancedFilters && isExpanded && (
        <div className="filter-advanced">
          {/* 날짜 범위 */}
          <div className="filter-group">
            <label className="filter-label">기간</label>
            <select
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="filter-select"
              aria-label="날짜 범위 선택"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 작성자 필터 */}
          {uniqueAuthors.length > 0 && (
            <div className="filter-group">
              <label className="filter-label">작성자</label>
              <div className="author-chips">
                {uniqueAuthors.map(author => (
                  <button
                    key={author}
                    onClick={() => toggleAuthor(author)}
                    className={`author-chip ${filterState.selectedAuthors.includes(author) ? 'selected' : ''}`}
                    aria-label={`작성자 ${author} 필터 토글`}
                  >
                    {author}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 체크박스 필터들 */}
          <div className="filter-group">
            <label className="filter-label">옵션</label>
            <div className="checkbox-filters">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={filterState.showOnlyWithTimestamp}
                  onChange={(e) => updateFilter({ showOnlyWithTimestamp: e.target.checked })}
                  aria-label="타임스탬프가 있는 피드백만 표시"
                />
                <span>시점 있는 것만</span>
              </label>
              
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={filterState.showOnlySecret}
                  onChange={(e) => updateFilter({ showOnlySecret: e.target.checked })}
                  aria-label="익명 피드백만 표시"
                />
                <span>익명만</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 필터 결과 요약 */}
      <div className="filter-summary">
        <span className="result-count">
          {feedbacks.length > 0 
            ? `총 ${feedbacks.length}개 중 필터링된 결과` 
            : '피드백이 없습니다'}
        </span>
        
        {activeFilterCount > 0 && (
          <div className="active-filters">
            {filterState.searchText && (
              <span className="active-filter">
                검색: "{filterState.searchText}"
              </span>
            )}
            {filterState.dateRange && (
              <span className="active-filter">
                날짜 필터 적용됨
              </span>
            )}
            {filterState.selectedAuthors.length > 0 && (
              <span className="active-filter">
                작성자: {filterState.selectedAuthors.length}명
              </span>
            )}
            {filterState.showOnlyWithTimestamp && (
              <span className="active-filter">
                시점 있음
              </span>
            )}
            {filterState.showOnlySecret && (
              <span className="active-filter">
                익명만
              </span>
            )}
          </div>
        )}
      </div>

      {/* 접근성을 위한 안내 텍스트 */}
      <div className="sr-only" aria-live="polite">
        {activeFilterCount > 0 && `${activeFilterCount}개의 필터가 적용되었습니다.`}
      </div>
    </div>
  );
});

FeedbackFilter.displayName = 'FeedbackFilter';

export default FeedbackFilter;