'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from './SearchBox.module.scss';
import { BaseComponentProps } from '../../../types/layout';

export interface SearchBoxProps extends BaseComponentProps {
  /** 플레이스홀더 텍스트 */
  placeholder?: string;
  /** 입력값 */
  value?: string;
  /** 기본값 */
  defaultValue?: string;
  /** 비활성화 상태 */
  disabled?: boolean;
  /** 로딩 상태 */
  loading?: boolean;
  /** 로딩 텍스트 */
  loadingText?: string;
  /** 검색 아이콘 */
  searchIcon?: string;
  /** 클리어 버튼 표시 여부 */
  showClearButton?: boolean;
  /** 자동완성 제안 목록 */
  suggestions?: string[];
  /** 자동완성 표시 여부 */
  showSuggestions?: boolean;
  /** 입력값 변경 핸들러 */
  onChange?: (value: string) => void;
  /** 검색 실행 핸들러 */
  onSearch?: (value: string) => void;
  /** 클리어 핸들러 */
  onClear?: () => void;
  /** 자동완성 선택 핸들러 */
  onSuggestionSelect?: (suggestion: string) => void;
  /** 포커스 핸들러 */
  onFocus?: () => void;
  /** 블러 핸들러 */
  onBlur?: () => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({
  placeholder = '검색어를 입력하세요',
  value,
  defaultValue = '',
  disabled = false,
  loading = false,
  loadingText = '검색 중...',
  searchIcon = 'search_b.svg',
  showClearButton = true,
  suggestions = [],
  showSuggestions = false,
  onChange,
  onSearch,
  onClear,
  onSuggestionSelect,
  onFocus,
  onBlur,
  className = '',
  'data-testid': testId,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [showSuggestionsInternal, setShowSuggestionsInternal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  // Controlled vs Uncontrolled
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  // 초기 자동완성 상태 설정
  useEffect(() => {
    setShowSuggestionsInternal(!!currentValue && showSuggestions && suggestions.length > 0);
  }, [currentValue, showSuggestions, suggestions.length]);

  const getIconPath = (iconName: string): string => {
    const basePath = '/images/Cms/';
    return `${basePath}${iconName}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    if (!isControlled) {
      setInternalValue(newValue);
    }
    
    if (onChange) {
      onChange(newValue);
    }

    // 자동완성 상태 리셋
    setActiveSuggestionIndex(-1);
    setShowSuggestionsInternal(!!newValue && showSuggestions && suggestions.length > 0);
  };

  const handleSearch = () => {
    if (onSearch && !disabled && !loading) {
      onSearch(currentValue);
      setShowSuggestionsInternal(false);
    }
  };

  const handleClear = () => {
    const newValue = '';
    
    if (!isControlled) {
      setInternalValue(newValue);
    }
    
    if (onChange) {
      onChange(newValue);
    }
    
    if (onClear) {
      onClear();
    }
    
    setShowSuggestionsInternal(false);
    setActiveSuggestionIndex(-1);
    
    // 포커스 유지
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled || loading) return;

    const visibleSuggestions = showSuggestionsInternal && suggestions;
    const suggestionsCount = visibleSuggestions ? suggestions.length : 0;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (activeSuggestionIndex >= 0 && visibleSuggestions && suggestions[activeSuggestionIndex]) {
          handleSuggestionSelect(suggestions[activeSuggestionIndex]!);
        } else {
          handleSearch();
        }
        break;
        
      case 'ArrowDown':
        if (visibleSuggestions) {
          e.preventDefault();
          setActiveSuggestionIndex(prev => 
            prev < suggestionsCount - 1 ? prev + 1 : 0
          );
        }
        break;
        
      case 'ArrowUp':
        if (visibleSuggestions) {
          e.preventDefault();
          setActiveSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : suggestionsCount - 1
          );
        }
        break;
        
      case 'Escape':
        setShowSuggestionsInternal(false);
        setActiveSuggestionIndex(-1);
        if (inputRef.current) {
          inputRef.current.blur();
        }
        break;
    }
  };

  const handleSuggestionSelect = (suggestion: string) => {
    if (!isControlled) {
      setInternalValue(suggestion);
    }
    
    if (onChange) {
      onChange(suggestion);
    }
    
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
    
    setShowSuggestionsInternal(false);
    setActiveSuggestionIndex(-1);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestionsInternal(!!currentValue && showSuggestions && suggestions.length > 0);
    
    if (onFocus) {
      onFocus();
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // 자동완성 목록 클릭 시에는 블러를 지연시킴
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestionsInternal(false);
      setActiveSuggestionIndex(-1);
    }, 200);
    
    if (onBlur) {
      onBlur();
    }
  };

  const searchBoxClasses = [
    styles.searchBox,
    isFocused ? styles['searchBox--focused'] : '',
    loading ? styles['searchBox--loading'] : '',
    disabled ? styles['searchBox--disabled'] : '',
    className,
  ].filter(Boolean).join(' ');

  const showClear = showClearButton && currentValue && !loading;
  const showSuggestionsDropdown = showSuggestionsInternal && suggestions.length > 0;

  return (
    <div className={searchBoxClasses} data-testid={testId} {...props}>
      <div className={styles.searchBox__container}>
        {/* 검색 아이콘 */}
        <button
          type="button"
          className={styles.searchBox__searchButton}
          onClick={handleSearch}
          disabled={disabled || loading}
          aria-label="검색"
        >
          <img
            src={getIconPath(searchIcon)}
            alt="Search"
            className={styles.searchBox__searchIcon}
          />
        </button>

        {/* 입력 필드 */}
        <input
          ref={inputRef}
          type="text"
          role="searchbox"
          className={styles.searchBox__input}
          placeholder={placeholder}
          value={currentValue}
          disabled={disabled || loading}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-expanded={showSuggestionsDropdown}
          aria-autocomplete={showSuggestions ? 'list' : 'none'}
          aria-label="검색어 입력"
        />

        {/* 로딩 인디케이터 */}
        {loading && (
          <div 
            className={styles.searchBox__loading}
            role="status"
            aria-live="polite"
            aria-label={loadingText}
          >
            <div className={styles.searchBox__spinner} />
            <span className={styles.searchBox__loadingText}>
              {loadingText}
            </span>
          </div>
        )}

        {/* 클리어 버튼 */}
        {showClear && (
          <button
            type="button"
            className={styles.searchBox__clearButton}
            onClick={handleClear}
            aria-label="검색어 지우기"
          >
            <svg
              className={styles.searchBox__clearIcon}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* 자동완성 제안 */}
      {showSuggestionsDropdown && (
        <ul
          ref={suggestionsRef}
          className={styles.searchBox__suggestions}
          role="listbox"
          aria-label="검색 제안"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion}
              className={[
                styles.suggestions__item,
                index === activeSuggestionIndex ? styles['suggestions__item--active'] : '',
              ].filter(Boolean).join(' ')}
              role="option"
              aria-selected={index === activeSuggestionIndex}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <span className={styles.suggestions__text}>
                {suggestion}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBox;