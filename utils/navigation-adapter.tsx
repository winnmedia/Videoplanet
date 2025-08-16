/**
 * Navigation Adapter
 * React Router → Next.js Router 호환성 레이어
 * 
 * 이 어댑터는 기존 React Router 코드를 Next.js App Router로
 * 점진적으로 마이그레이션할 수 있도록 돕습니다.
 */

'use client';

import { useRouter as useNextRouter, usePathname, useSearchParams as useNextSearchParams, useParams as useNextParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

/**
 * React Router의 useNavigate 훅을 Next.js의 useRouter로 대체
 * @returns navigate 함수
 */
export const useNavigate = () => {
  const router = useNextRouter();
  
  const navigate = useCallback((to: string | number, options?: { replace?: boolean; state?: any }) => {
    if (typeof to === 'number') {
      // 숫자인 경우 히스토리 네비게이션
      if (to === -1) {
        router.back();
      } else if (to === 1) {
        router.forward();
      } else {
        console.warn('Next.js router only supports -1 (back) or 1 (forward) for history navigation');
      }
    } else {
      // 문자열 경로인 경우
      if (options?.replace) {
        router.replace(to);
      } else {
        router.push(to);
      }
      
      // Note: Next.js App Router는 state를 직접 지원하지 않음
      // state는 query parameters나 context로 전달해야 함
      if (options?.state) {
        console.warn('Next.js App Router does not support state. Consider using query parameters or context instead.');
      }
    }
  }, [router]);
  
  return navigate;
};

/**
 * React Router의 useLocation 훅을 Next.js hooks로 대체
 * @returns location 객체
 */
export const useLocation = () => {
  const pathname = usePathname();
  const searchParams = useNextSearchParams();
  
  const location = useMemo(() => ({
    pathname,
    search: searchParams?.toString() ? `?${searchParams.toString()}` : '',
    hash: '', // Next.js는 hash를 직접 지원하지 않음
    state: null, // Next.js App Router는 state를 지원하지 않음
    key: pathname, // 고유 키로 pathname 사용
  }), [pathname, searchParams]);
  
  return location;
};

/**
 * React Router의 useParams를 Next.js의 useParams로 대체
 * Next.js와 동일한 인터페이스이므로 직접 export
 */
export const useParams = useNextParams;

/**
 * React Router의 useSearchParams를 Next.js 형식으로 변환
 * @returns [searchParams, setSearchParams] 튜플
 */
export const useSearchParams = () => {
  const router = useNextRouter();
  const pathname = usePathname();
  const searchParams = useNextSearchParams();
  
  const setSearchParams = useCallback((
    params: URLSearchParams | Record<string, string> | ((prev: URLSearchParams) => URLSearchParams | Record<string, string>)
  ) => {
    let newParams: URLSearchParams;
    
    if (typeof params === 'function') {
      const result = params(searchParams || new URLSearchParams());
      newParams = result instanceof URLSearchParams ? result : new URLSearchParams(result);
    } else if (params instanceof URLSearchParams) {
      newParams = params;
    } else {
      newParams = new URLSearchParams(params);
    }
    
    const newUrl = `${pathname}?${newParams.toString()}`;
    router.push(newUrl);
  }, [router, pathname, searchParams]);
  
  return [searchParams, setSearchParams] as const;
};

/**
 * React Router의 Link 컴포넌트를 Next.js Link로 매핑하기 위한 타입
 */
export { default as Link } from 'next/link';

/**
 * React Router의 NavLink를 Next.js용으로 구현
 */
import NextLink from 'next/link';
import { ComponentProps } from 'react';

interface NavLinkProps extends Omit<ComponentProps<typeof NextLink>, 'className' | 'children' | 'style'> {
  className?: string | ((props: { isActive: boolean; isPending: boolean }) => string);
  style?: React.CSSProperties | ((props: { isActive: boolean; isPending: boolean }) => React.CSSProperties);
  children?: React.ReactNode | ((props: { isActive: boolean; isPending: boolean }) => React.ReactNode);
}

export const NavLink = ({ className, style, children, href, ...props }: NavLinkProps) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  const isPending = false; // Next.js에서는 pending 상태를 직접 지원하지 않음
  
  const computedClassName = typeof className === 'function' 
    ? className({ isActive, isPending })
    : className;
    
  const computedStyle = typeof style === 'function'
    ? style({ isActive, isPending })
    : style;
    
  const computedChildren = typeof children === 'function'
    ? children({ isActive, isPending })
    : children;
  
  return (
    <NextLink
      {...props}
      href={href}
      className={computedClassName}
      style={computedStyle}
    >
      {computedChildren}
    </NextLink>
  );
};

/**
 * React Router의 Navigate 컴포넌트를 Next.js용으로 구현
 */
interface NavigateProps {
  to: string;
  replace?: boolean;
}

export const Navigate = ({ to, replace = false }: NavigateProps) => {
  const router = useNextRouter();
  
  // useEffect 대신 즉시 실행
  if (typeof window !== 'undefined') {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }
  
  return null;
};

/**
 * React Router의 useRouteError를 위한 대체 (Next.js error boundary용)
 */
export const useRouteError = () => {
  // Next.js에서는 error.tsx 파일에서 error prop으로 에러를 받음
  console.warn('useRouteError is not directly supported in Next.js. Use error.tsx file instead.');
  return null;
};

/**
 * 보호된 라우트를 위한 헬퍼 함수
 */
export const withAuth = (Component: React.ComponentType) => {
  return function ProtectedRoute(props: any) {
    const router = useNextRouter();
    const pathname = usePathname();
    
    // 클라이언트 사이드에서만 실행
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      
      if (!token) {
        // 인증되지 않은 경우 로그인 페이지로 리다이렉트
        router.replace(`/login?returnUrl=${encodeURIComponent(pathname || '/')}`);
        return null;
      }
    }
    
    return <Component {...props} />;
  };
};

/**
 * 라우트 매칭을 위한 유틸리티
 */
export const matchPath = (pattern: string, pathname: string): boolean => {
  // 간단한 매칭 로직 (동적 세그먼트 지원)
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');
  
  if (patternParts.length !== pathParts.length) {
    return false;
  }
  
  return patternParts.every((part, index) => {
    if (part.startsWith(':') || part.startsWith('[')) {
      return true; // 동적 세그먼트는 모든 값과 매칭
    }
    return part === pathParts[index];
  });
};

/**
 * 기존 React Router 코드와의 호환성을 위한 export
 */
export const useHistory = () => {
  const router = useNextRouter();
  
  return {
    push: (path: string) => router.push(path),
    replace: (path: string) => router.replace(path),
    goBack: () => router.back(),
    goForward: () => router.forward(),
  };
};

// 타입 정의
export interface Location {
  pathname: string;
  search: string;
  hash: string;
  state: any;
  key: string;
}

export interface NavigateFunction {
  (to: string | number, options?: { replace?: boolean; state?: any }): void;
}

export default {
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
  NavLink,
  Navigate,
  useRouteError,
  withAuth,
  matchPath,
  useHistory,
};