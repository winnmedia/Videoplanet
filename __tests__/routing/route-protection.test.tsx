/**
 * Route Protection Tests
 * 보호된 라우트 및 인증 플로우 테스트
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { redirect } from 'next/navigation';
import '@testing-library/jest-dom';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  redirect: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Route Protection', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.clear.mockClear();
  });

  describe('Authentication Guard', () => {
    it('should redirect to login when not authenticated', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
        const router = useRouter();
        const pathname = usePathname();

        React.useEffect(() => {
          const token = localStorage.getItem('token');
          if (!token && pathname !== '/login') {
            router.replace('/login');
          }
        }, [pathname, router]);

        return <>{children}</>;
      };

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/login');
      });
    });

    it('should allow access when authenticated', () => {
      localStorageMock.getItem.mockReturnValue('valid-token');

      const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
        const router = useRouter();
        const pathname = usePathname();

        React.useEffect(() => {
          const token = localStorage.getItem('token');
          if (!token && pathname !== '/login') {
            router.replace('/login');
          }
        }, [pathname, router]);

        return <>{children}</>;
      };

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('should preserve intended route after login', async () => {
      const LoginRedirect = () => {
        const router = useRouter();
        const [returnUrl, setReturnUrl] = React.useState<string>('/dashboard');

        React.useEffect(() => {
          // URL에서 returnUrl 파라미터 확인
          const params = new URLSearchParams(window.location.search);
          const url = params.get('returnUrl');
          if (url) {
            setReturnUrl(url);
          }
        }, []);

        const handleLogin = () => {
          localStorage.setItem('token', 'valid-token');
          router.push(returnUrl);
        };

        return (
          <button onClick={handleLogin}>
            Login and Redirect
          </button>
        );
      };

      render(<LoginRedirect />);
      const button = screen.getByText('Login and Redirect');
      button.click();

      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'valid-token');
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Role-based Access Control', () => {
    it('should deny access for insufficient permissions', async () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'token') return 'valid-token';
        if (key === 'userRole') return 'viewer';
        return null;
      });

      const AdminRoute = ({ children }: { children: React.ReactNode }) => {
        const router = useRouter();

        React.useEffect(() => {
          const userRole = localStorage.getItem('userRole');
          if (userRole !== 'admin' && userRole !== 'manager') {
            router.replace('/unauthorized');
          }
        }, [router]);

        return <>{children}</>;
      };

      render(
        <AdminRoute>
          <div>Admin Content</div>
        </AdminRoute>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/unauthorized');
      });
    });

    it('should allow access for admin role', () => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'token') return 'valid-token';
        if (key === 'userRole') return 'admin';
        return null;
      });

      const AdminRoute = ({ children }: { children: React.ReactNode }) => {
        const router = useRouter();

        React.useEffect(() => {
          const userRole = localStorage.getItem('userRole');
          if (userRole !== 'admin' && userRole !== 'manager') {
            router.replace('/unauthorized');
          }
        }, [router]);

        return <>{children}</>;
      };

      render(
        <AdminRoute>
          <div>Admin Content</div>
        </AdminRoute>
      );

      expect(screen.getByText('Admin Content')).toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should redirect to login on session expire', async () => {
      const SessionGuard = ({ children }: { children: React.ReactNode }) => {
        const router = useRouter();

        React.useEffect(() => {
          const checkSession = () => {
            const token = localStorage.getItem('token');
            const expiry = localStorage.getItem('tokenExpiry');
            
            if (token && expiry) {
              const now = Date.now();
              const expiryTime = parseInt(expiry, 10);
              
              if (now > expiryTime) {
                localStorage.clear();
                router.replace('/login?reason=session-expired');
              }
            }
          };

          checkSession();
          const interval = setInterval(checkSession, 60000); // Check every minute
          
          return () => clearInterval(interval);
        }, [router]);

        return <>{children}</>;
      };

      // Set expired token
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'token') return 'valid-token';
        if (key === 'tokenExpiry') return '1000'; // Expired timestamp
        return null;
      });

      render(
        <SessionGuard>
          <div>Protected Content</div>
        </SessionGuard>
      );

      await waitFor(() => {
        expect(localStorageMock.clear).toHaveBeenCalled();
        expect(mockReplace).toHaveBeenCalledWith('/login?reason=session-expired');
      });
    });

    it('should maintain session for valid token', () => {
      const SessionGuard = ({ children }: { children: React.ReactNode }) => {
        const router = useRouter();

        React.useEffect(() => {
          const checkSession = () => {
            const token = localStorage.getItem('token');
            const expiry = localStorage.getItem('tokenExpiry');
            
            if (token && expiry) {
              const now = Date.now();
              const expiryTime = parseInt(expiry, 10);
              
              if (now > expiryTime) {
                localStorage.clear();
                router.replace('/login?reason=session-expired');
              }
            }
          };

          checkSession();
        }, [router]);

        return <>{children}</>;
      };

      // Set valid token with future expiry
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'token') return 'valid-token';
        if (key === 'tokenExpiry') return String(Date.now() + 3600000); // 1 hour from now
        return null;
      });

      render(
        <SessionGuard>
          <div>Protected Content</div>
        </SessionGuard>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
      expect(localStorageMock.clear).not.toHaveBeenCalled();
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  describe('Public Routes', () => {
    it('should allow access to public routes without authentication', () => {
      localStorageMock.getItem.mockReturnValue(null);
      (usePathname as jest.Mock).mockReturnValue('/');

      const PublicRoute = ({ children }: { children: React.ReactNode }) => {
        const router = useRouter();
        const pathname = usePathname();

        const publicRoutes = ['/', '/login', '/signup', '/privacy', '/terms'];

        React.useEffect(() => {
          const token = localStorage.getItem('token');
          if (!token && !publicRoutes.includes(pathname)) {
            router.replace('/login');
          }
        }, [pathname, router]);

        return <>{children}</>;
      };

      render(
        <PublicRoute>
          <div>Public Content</div>
        </PublicRoute>
      );

      expect(screen.getByText('Public Content')).toBeInTheDocument();
      expect(mockReplace).not.toHaveBeenCalled();
    });

    it('should redirect authenticated users from login to dashboard', async () => {
      localStorageMock.getItem.mockReturnValue('valid-token');
      (usePathname as jest.Mock).mockReturnValue('/login');

      const LoginRoute = ({ children }: { children: React.ReactNode }) => {
        const router = useRouter();
        const pathname = usePathname();

        React.useEffect(() => {
          const token = localStorage.getItem('token');
          if (token && pathname === '/login') {
            router.replace('/dashboard');
          }
        }, [pathname, router]);

        return <>{children}</>;
      };

      render(
        <LoginRoute>
          <div>Login Page</div>
        </LoginRoute>
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/dashboard');
      });
    });
  });
});