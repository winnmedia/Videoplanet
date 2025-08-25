import React, { Component, ErrorInfo } from 'react';
import { ErrorBoundaryProps, ErrorBoundaryState, ErrorFallbackProps } from './types';
import styles from './styles.module.scss';

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  errorInfo, 
  resetError 
}) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return (
    <div 
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={styles['error-boundary']}
    >
      <div className={styles['error-boundary__icon']}>
        <svg 
          width="64" 
          height="64" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      
      <h2 className={styles['error-boundary__title']}>
        Something went wrong
      </h2>
      
      <p className={styles['error-boundary__message']}>
        We encountered an unexpected error. Please try refreshing the page or contact support if the problem persists.
      </p>
      
      {isDevelopment && errorInfo && (
        <details className={styles['error-boundary__details']}>
          <summary>Error Details</summary>
          <pre className={styles['error-boundary__stack']}>
            {error.toString()}
            {errorInfo.componentStack}
          </pre>
        </details>
      )}
      
      <div className={styles['error-boundary__actions']}>
        <button 
          onClick={resetError}
          className={styles['error-boundary__button']}
          aria-label="Try again"
        >
          Try Again
        </button>
        
        <button 
          onClick={() => window.location.href = '/'}
          className={styles['error-boundary__button--secondary']}
          aria-label="Go to home page"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetKeysRef: Array<string | number>;
  
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
    this.resetKeysRef = props.resetKeys || [];
  }
  
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, enableReporting, errorReporter } = this.props;
    
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      errorInfo,
    });
    
    // Call custom error handler
    if (onError) {
      onError(error, errorInfo);
    }
    
    // Report to external service
    if (enableReporting && errorReporter) {
      errorReporter(error, errorInfo);
    }
  }
  
  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    const { resetKeys } = this.props;
    const { hasError } = this.state;
    
    // Reset error if resetKeys changed
    if (hasError && prevProps.resetKeys !== resetKeys) {
      const hasResetKeyChanged = resetKeys?.some(
        (key, index) => key !== this.resetKeysRef[index]
      );
      
      if (hasResetKeyChanged) {
        this.resetError();
        this.resetKeysRef = resetKeys || [];
      }
    }
  }
  
  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };
  
  render() {
    const { hasError, error, errorInfo } = this.state;
    const { 
      children, 
      fallback: FallbackComponent = DefaultErrorFallback,
      fallbackMessage,
      showDetails,
      className,
    } = this.props;
    
    if (hasError && error) {
      // Use custom fallback component if provided
      if (FallbackComponent) {
        return (
          <div className={className}>
            <FallbackComponent 
              error={error}
              errorInfo={errorInfo}
              resetError={this.resetError}
            />
          </div>
        );
      }
      
      // Use default error UI with custom message
      return (
        <div 
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          className={`${styles['error-boundary']} ${className || ''}`}
        >
          <div className={styles['error-boundary__icon']}>
            <svg 
              width="64" 
              height="64" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#ef4444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          
          <h2 className={styles['error-boundary__title']}>
            {fallbackMessage || 'Something went wrong'}
          </h2>
          
          {(showDetails || process.env.NODE_ENV === 'development') && (
            <details className={styles['error-boundary__details']}>
              <summary>Error Details</summary>
              <pre className={styles['error-boundary__stack']}>
                {error.toString()}
                {errorInfo?.componentStack}
              </pre>
            </details>
          )}
          
          <button 
            onClick={this.resetError}
            className={styles['error-boundary__button']}
          >
            Try Again
          </button>
        </div>
      );
    }
    
    return children;
  }
}