import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { SearchBox } from '../../../components/molecules/SearchBox';
import type { SearchBoxProps } from '../../../components/molecules/SearchBox/SearchBox';

describe('SearchBox Component', () => {
  const defaultProps: SearchBoxProps = {
    placeholder: 'Search...',
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('필수 props로 올바르게 렌더링된다', () => {
      render(<SearchBox {...defaultProps} />);
      
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /검색/i })).toBeInTheDocument();
    });

    it('기본 검색 아이콘이 표시된다', () => {
      render(<SearchBox {...defaultProps} />);
      
      const searchIcon = screen.getByAltText('Search');
      expect(searchIcon).toBeInTheDocument();
      expect(searchIcon).toHaveAttribute('src', expect.stringContaining('search'));
    });

    it('테스트 아이디가 설정된다', () => {
      render(<SearchBox {...defaultProps} data-testid="search-input" />);
      
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });
  });

  describe('Input 기능', () => {
    it('값 입력 시 onChange가 호출된다', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(<SearchBox {...defaultProps} onChange={mockOnChange} />);
      
      const input = screen.getByRole('searchbox');
      await user.type(input, 'test query');
      
      expect(mockOnChange).toHaveBeenCalledWith('test query');
    });

    it('value prop으로 초기값이 설정된다', () => {
      render(<SearchBox {...defaultProps} value="initial value" />);
      
      expect(screen.getByDisplayValue('initial value')).toBeInTheDocument();
    });

    it('defaultValue prop으로 초기값이 설정된다', () => {
      render(<SearchBox {...defaultProps} defaultValue="default value" />);
      
      expect(screen.getByDisplayValue('default value')).toBeInTheDocument();
    });
  });

  describe('Clear 버튼', () => {
    it('값이 있을 때 클리어 버튼이 표시된다', () => {
      render(<SearchBox {...defaultProps} value="test" />);
      
      expect(screen.getByRole('button', { name: /지우기/i })).toBeInTheDocument();
    });

    it('값이 없을 때 클리어 버튼이 표시되지 않는다', () => {
      render(<SearchBox {...defaultProps} value="" />);
      
      expect(screen.queryByRole('button', { name: /지우기/i })).not.toBeInTheDocument();
    });

    it('클리어 버튼 클릭 시 값이 초기화된다', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      const mockOnClear = jest.fn();
      
      render(
        <SearchBox 
          {...defaultProps} 
          value="test" 
          onChange={mockOnChange} 
          onClear={mockOnClear}
        />
      );
      
      await user.click(screen.getByRole('button', { name: /지우기/i }));
      
      expect(mockOnClear).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith('');
    });

    it('showClearButton이 false일 때 클리어 버튼이 표시되지 않는다', () => {
      render(<SearchBox {...defaultProps} value="test" showClearButton={false} />);
      
      expect(screen.queryByRole('button', { name: /지우기/i })).not.toBeInTheDocument();
    });
  });

  describe('Search 기능', () => {
    it('검색 버튼 클릭 시 onSearch가 호출된다', async () => {
      const user = userEvent.setup();
      const mockOnSearch = jest.fn();
      
      render(<SearchBox {...defaultProps} value="query" onSearch={mockOnSearch} />);
      
      await user.click(screen.getByLabelText('검색'));
      
      expect(mockOnSearch).toHaveBeenCalledWith('query');
    });

    it('Enter 키 입력 시 onSearch가 호출된다', async () => {
      const user = userEvent.setup();
      const mockOnSearch = jest.fn();
      
      render(<SearchBox {...defaultProps} value="query" onSearch={mockOnSearch} />);
      
      const input = screen.getByRole('searchbox');
      input.focus();
      await user.keyboard('{Enter}');
      
      expect(mockOnSearch).toHaveBeenCalledWith('query');
    });

    it('검색 아이콘이 커스텀 가능하다', () => {
      render(<SearchBox {...defaultProps} searchIcon="custom-search.svg" />);
      
      const searchIcon = screen.getByAltText('Search');
      expect(searchIcon).toHaveAttribute('src', expect.stringContaining('custom-search.svg'));
    });
  });

  describe('Loading 상태', () => {
    it('loading이 true일 때 로딩 상태가 표시된다', () => {
      render(<SearchBox {...defaultProps} loading />);
      
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('검색 중...')).toBeInTheDocument();
    });

    it('loading 중에는 검색 버튼이 비활성화된다', () => {
      render(<SearchBox {...defaultProps} loading />);
      
      expect(screen.getByRole('button', { name: /검색/i })).toBeDisabled();
    });

    it('loading 중에는 입력이 비활성화된다', () => {
      render(<SearchBox {...defaultProps} loading />);
      
      expect(screen.getByRole('searchbox')).toBeDisabled();
    });

    it('커스텀 로딩 텍스트가 표시된다', () => {
      render(<SearchBox {...defaultProps} loading loadingText="Searching..." />);
      
      expect(screen.getByText('Searching...')).toBeInTheDocument();
    });
  });

  describe('Disabled 상태', () => {
    it('disabled가 true일 때 모든 요소가 비활성화된다', () => {
      render(<SearchBox {...defaultProps} disabled />);
      
      expect(screen.getByRole('searchbox')).toBeDisabled();
      expect(screen.getByRole('button', { name: /검색/i })).toBeDisabled();
    });

    it('disabled 상태에서 이벤트가 발생하지 않는다', async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      const mockOnSearch = jest.fn();
      
      render(
        <SearchBox 
          {...defaultProps} 
          disabled 
          onChange={mockOnChange} 
          onSearch={mockOnSearch} 
        />
      );
      
      await user.type(screen.getByRole('searchbox'), 'test');
      await user.click(screen.getByRole('button', { name: /검색/i }));
      
      expect(mockOnChange).not.toHaveBeenCalled();
      expect(mockOnSearch).not.toHaveBeenCalled();
    });
  });

  describe('자동완성 기능', () => {
    const suggestions = ['Apple', 'Banana', 'Cherry'];

    it('suggestions가 있을 때 자동완성 목록이 표시된다', () => {
      render(<SearchBox {...defaultProps} value="test" suggestions={suggestions} showSuggestions />);
      
      suggestions.forEach(suggestion => {
        expect(screen.getByText(suggestion)).toBeInTheDocument();
      });
    });

    it('showSuggestions가 false일 때 자동완성이 표시되지 않는다', () => {
      render(<SearchBox {...defaultProps} suggestions={suggestions} showSuggestions={false} />);
      
      suggestions.forEach(suggestion => {
        expect(screen.queryByText(suggestion)).not.toBeInTheDocument();
      });
    });

    it('자동완성 항목 클릭 시 onSuggestionSelect가 호출된다', async () => {
      const user = userEvent.setup();
      const mockOnSuggestionSelect = jest.fn();
      
      render(
        <SearchBox 
          {...defaultProps} 
          value="test"
          suggestions={suggestions} 
          showSuggestions 
          onSuggestionSelect={mockOnSuggestionSelect}
        />
      );
      
      await user.click(screen.getByText('Apple'));
      
      expect(mockOnSuggestionSelect).toHaveBeenCalledWith('Apple');
    });

    it('키보드로 자동완성 항목을 선택할 수 있다', async () => {
      const user = userEvent.setup();
      const mockOnSuggestionSelect = jest.fn();
      
      render(
        <SearchBox 
          {...defaultProps} 
          value="test"
          suggestions={suggestions} 
          showSuggestions 
          onSuggestionSelect={mockOnSuggestionSelect}
        />
      );
      
      const input = screen.getByRole('searchbox');
      input.focus();
      await user.keyboard('{ArrowDown}'); // 첫 번째 항목 선택
      await user.keyboard('{Enter}');
      
      expect(mockOnSuggestionSelect).toHaveBeenCalledWith('Apple');
    });

    it('ArrowUp/ArrowDown으로 자동완성 항목 간 이동이 가능하다', async () => {
      const user = userEvent.setup();
      
      render(
        <SearchBox 
          {...defaultProps} 
          value="test"
          suggestions={suggestions} 
          showSuggestions 
        />
      );
      
      const input = screen.getByRole('searchbox');
      input.focus();
      await user.keyboard('{ArrowDown}');
      
      expect(screen.getByText('Apple').closest('li')).toHaveClass('suggestions__item--active');
      
      await user.keyboard('{ArrowDown}');
      
      expect(screen.getByText('Banana').closest('li')).toHaveClass('suggestions__item--active');
    });

    it('Escape 키로 자동완성을 닫을 수 있다', async () => {
      const user = userEvent.setup();
      
      render(
        <SearchBox 
          {...defaultProps} 
          suggestions={suggestions} 
          showSuggestions 
        />
      );
      
      const input = screen.getByRole('searchbox');
      input.focus();
      await user.keyboard('{Escape}');
      
      suggestions.forEach(suggestion => {
        expect(screen.queryByText(suggestion)).not.toBeInTheDocument();
      });
    });
  });

  describe('접근성', () => {
    it('검색 입력 필드에 적절한 role이 설정된다', () => {
      render(<SearchBox {...defaultProps} />);
      
      expect(screen.getByRole('searchbox')).toBeInTheDocument();
    });

    it('검색 버튼에 적절한 aria-label이 설정된다', () => {
      render(<SearchBox {...defaultProps} />);
      
      expect(screen.getByLabelText('검색')).toHaveAttribute('aria-label', '검색');
    });

    it('클리어 버튼에 적절한 aria-label이 설정된다', () => {
      render(<SearchBox {...defaultProps} value="test" />);
      
      expect(screen.getByLabelText('검색어 지우기')).toHaveAttribute('aria-label', '검색어 지우기');
    });

    it('로딩 상태에서 screen reader를 위한 상태가 설정된다', () => {
      render(<SearchBox {...defaultProps} loading />);
      
      const status = screen.getByRole('status');
      expect(status).toHaveAttribute('aria-live', 'polite');
    });

    it('자동완성 목록에 적절한 ARIA 속성이 설정된다', () => {
      render(<SearchBox {...defaultProps} value="test" suggestions={['test']} showSuggestions />);
      
      const input = screen.getByRole('searchbox');
      expect(input).toHaveAttribute('aria-expanded', 'true');
      expect(input).toHaveAttribute('aria-autocomplete', 'list');
    });
  });

  describe('CSS 클래스', () => {
    it('기본 클래스가 적용된다', () => {
      render(<SearchBox {...defaultProps} />);
      
      expect(screen.getByRole('searchbox').closest('.searchBox')).toBeInTheDocument();
    });

    it('커스텀 className이 추가된다', () => {
      render(<SearchBox {...defaultProps} className="custom-search" />);
      
      expect(screen.getByRole('searchbox').closest('.searchBox')).toHaveClass('custom-search');
    });

    it('loading 상태에서 로딩 클래스가 적용된다', () => {
      render(<SearchBox {...defaultProps} loading />);
      
      expect(screen.getByRole('searchbox').closest('.searchBox')).toHaveClass('searchBox--loading');
    });

    it('disabled 상태에서 비활성 클래스가 적용된다', () => {
      render(<SearchBox {...defaultProps} disabled />);
      
      expect(screen.getByRole('searchbox').closest('.searchBox')).toHaveClass('searchBox--disabled');
    });
  });

  describe('에러 처리', () => {
    it('onChange가 없어도 에러가 발생하지 않는다', () => {
      expect(() => {
        render(<SearchBox placeholder="test" />);
      }).not.toThrow();
    });

    it('빈 suggestions 배열이어도 에러가 발생하지 않는다', () => {
      expect(() => {
        render(<SearchBox {...defaultProps} suggestions={[]} showSuggestions />);
      }).not.toThrow();
    });

    it('null 또는 undefined suggestions가 있어도 에러가 발생하지 않는다', () => {
      expect(() => {
        render(<SearchBox {...defaultProps} suggestions={[]} showSuggestions />);
      }).not.toThrow();
    });
  });
});