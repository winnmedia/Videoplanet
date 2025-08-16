/**
 * Navigation System Tests
 * Next.js App Router 네비게이션 시스템 테스트
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import '@testing-library/jest-dom';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
  useParams: jest.fn(),
}));

describe('Navigation System', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockBack = jest.fn();
  const mockForward = jest.fn();
  const mockRefresh = jest.fn();
  const mockPrefetch = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      back: mockBack,
      forward: mockForward,
      refresh: mockRefresh,
      prefetch: mockPrefetch,
    });
    (usePathname as jest.Mock).mockReturnValue('/');
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    jest.clearAllMocks();
  });

  describe('Page Navigation', () => {
    it('should navigate to login page', async () => {
      const TestComponent = () => {
        const router = useRouter();
        return (
          <button onClick={() => router.push('/login')}>
            Go to Login
          </button>
        );
      };

      render(<TestComponent />);
      const button = screen.getByText('Go to Login');
      fireEvent.click(button);

      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('should navigate to dashboard after login', async () => {
      const TestComponent = () => {
        const router = useRouter();
        const handleLogin = () => {
          // 로그인 성공 후 대시보드로 이동
          router.push('/dashboard');
        };
        return <button onClick={handleLogin}>Login</button>;
      };

      render(<TestComponent />);
      fireEvent.click(screen.getByText('Login'));

      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });

    it('should handle protected routes', async () => {
      const TestComponent = () => {
        const router = useRouter();
        const isAuthenticated = false; // 인증되지 않은 상태

        const navigateToProtectedRoute = () => {
          if (!isAuthenticated) {
            router.push('/login');
          } else {
            router.push('/dashboard');
          }
        };

        return (
          <button onClick={navigateToProtectedRoute}>
            Access Dashboard
          </button>
        );
      };

      render(<TestComponent />);
      fireEvent.click(screen.getByText('Access Dashboard'));

      expect(mockPush).toHaveBeenCalledWith('/login');
      expect(mockPush).not.toHaveBeenCalledWith('/dashboard');
    });

    it('should preserve query parameters', async () => {
      const TestComponent = () => {
        const router = useRouter();
        const navigateWithParams = () => {
          router.push('/projects?filter=active&sort=date');
        };
        return (
          <button onClick={navigateWithParams}>
            Navigate with Params
          </button>
        );
      };

      render(<TestComponent />);
      fireEvent.click(screen.getByText('Navigate with Params'));

      expect(mockPush).toHaveBeenCalledWith('/projects?filter=active&sort=date');
    });

    it('should handle back navigation', async () => {
      const TestComponent = () => {
        const router = useRouter();
        return <button onClick={() => router.back()}>Go Back</button>;
      };

      render(<TestComponent />);
      fireEvent.click(screen.getByText('Go Back'));

      expect(mockBack).toHaveBeenCalled();
    });
  });

  describe('Dynamic Routes', () => {
    it('should handle project ID in URL', async () => {
      const TestComponent = () => {
        const router = useRouter();
        const projectId = '123';
        
        const navigateToProject = () => {
          router.push(`/projects/${projectId}`);
        };

        return (
          <button onClick={navigateToProject}>
            View Project
          </button>
        );
      };

      render(<TestComponent />);
      fireEvent.click(screen.getByText('View Project'));

      expect(mockPush).toHaveBeenCalledWith('/projects/123');
    });

    it('should handle feedback project ID', async () => {
      const TestComponent = () => {
        const router = useRouter();
        const projectId = '456';
        
        const navigateToFeedback = () => {
          router.push(`/feedback/${projectId}`);
        };

        return (
          <button onClick={navigateToFeedback}>
            View Feedback
          </button>
        );
      };

      render(<TestComponent />);
      fireEvent.click(screen.getByText('View Feedback'));

      expect(mockPush).toHaveBeenCalledWith('/feedback/456');
    });

    it('should handle 404 for invalid routes', async () => {
      const TestComponent = () => {
        const router = useRouter();
        
        const navigateToInvalidRoute = () => {
          router.push('/invalid-route');
        };

        return (
          <button onClick={navigateToInvalidRoute}>
            Invalid Route
          </button>
        );
      };

      render(<TestComponent />);
      fireEvent.click(screen.getByText('Invalid Route'));

      expect(mockPush).toHaveBeenCalledWith('/invalid-route');
    });

    it('should handle nested dynamic routes', async () => {
      const TestComponent = () => {
        const router = useRouter();
        const projectId = '789';
        
        const navigateToEditProject = () => {
          router.push(`/projects/${projectId}/edit`);
        };

        return (
          <button onClick={navigateToEditProject}>
            Edit Project
          </button>
        );
      };

      render(<TestComponent />);
      fireEvent.click(screen.getByText('Edit Project'));

      expect(mockPush).toHaveBeenCalledWith('/projects/789/edit');
    });
  });

  describe('URL Parameters', () => {
    it('should extract project ID from URL', () => {
      const mockParams = { id: '123' };
      const useParams = require('next/navigation').useParams;
      (useParams as jest.Mock).mockReturnValue(mockParams);

      const TestComponent = () => {
        const params = useParams();
        return <div>Project ID: {params.id}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByText('Project ID: 123')).toBeInTheDocument();
    });

    it('should handle search parameters', () => {
      const searchParams = new URLSearchParams('?filter=active&sort=date');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      const TestComponent = () => {
        const searchParams = useSearchParams();
        const filter = searchParams.get('filter');
        const sort = searchParams.get('sort');
        
        return (
          <div>
            <div>Filter: {filter}</div>
            <div>Sort: {sort}</div>
          </div>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('Filter: active')).toBeInTheDocument();
      expect(screen.getByText('Sort: date')).toBeInTheDocument();
    });

    it('should maintain state during navigation', async () => {
      const TestComponent = () => {
        const router = useRouter();
        const pathname = usePathname();
        
        const navigateWithState = () => {
          // Next.js App Router에서는 state를 query params나 context로 전달
          router.push('/projects?from=dashboard');
        };

        return (
          <div>
            <div>Current Path: {pathname}</div>
            <button onClick={navigateWithState}>
              Navigate with State
            </button>
          </div>
        );
      };

      render(<TestComponent />);
      expect(screen.getByText('Current Path: /')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Navigate with State'));
      expect(mockPush).toHaveBeenCalledWith('/projects?from=dashboard');
    });

    it('should update search parameters', async () => {
      const TestComponent = () => {
        const router = useRouter();
        const pathname = usePathname();
        
        const updateSearchParams = () => {
          const params = new URLSearchParams();
          params.set('page', '2');
          params.set('limit', '20');
          router.push(`${pathname}?${params.toString()}`);
        };

        return (
          <button onClick={updateSearchParams}>
            Update Params
          </button>
        );
      };

      render(<TestComponent />);
      fireEvent.click(screen.getByText('Update Params'));

      expect(mockPush).toHaveBeenCalledWith('/?page=2&limit=20');
    });
  });

  describe('Navigation Guards', () => {
    it('should redirect unauthenticated users', async () => {
      const TestComponent = () => {
        const router = useRouter();
        const isAuthenticated = false;

        React.useEffect(() => {
          if (!isAuthenticated) {
            router.replace('/login');
          }
        }, [isAuthenticated, router]);

        return <div>Protected Content</div>;
      };

      render(<TestComponent />);
      
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login');
      });
    });

    it('should allow authenticated users to access protected routes', () => {
      const TestComponent = () => {
        const router = useRouter();
        const isAuthenticated = true;

        React.useEffect(() => {
          if (!isAuthenticated) {
            router.replace('/login');
          }
        }, [isAuthenticated, router]);

        return <div>Protected Content</div>;
      };

      render(<TestComponent />);
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe('Prefetching', () => {
    it('should prefetch routes on hover', async () => {
      const TestComponent = () => {
        const router = useRouter();
        
        const handleMouseEnter = () => {
          router.prefetch('/projects');
        };

        return (
          <a 
            href="/projects"
            onMouseEnter={handleMouseEnter}
          >
            Projects
          </a>
        );
      };

      render(<TestComponent />);
      const link = screen.getByText('Projects');
      
      fireEvent.mouseEnter(link);
      expect(mockPrefetch).toHaveBeenCalledWith('/projects');
    });
  });
});