import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils'

const spinnerVariants = cva(
  'animate-spin rounded-full border-solid border-current',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 border-2',
        default: 'h-8 w-8 border-2',
        lg: 'h-12 w-12 border-3',
        xl: 'h-16 w-16 border-4',
      },
      variant: {
        default: 'border-gray-300 border-t-blue-600',
        light: 'border-white/30 border-t-white',
        dark: 'border-gray-600 border-t-gray-900',
        primary: 'border-blue-200 border-t-blue-600',
        success: 'border-green-200 border-t-green-600',
        warning: 'border-yellow-200 border-t-yellow-600',
        danger: 'border-red-200 border-t-red-600',
      },
    },
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
  }
)

interface LoadingSpinnerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'>,
    VariantProps<typeof spinnerVariants> {
  label?: string
  center?: boolean
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size, variant, label, center = false, ...props }, ref) => {
    const spinner = (
      <div
        ref={ref}
        className={cn(spinnerVariants({ size, variant }), className)}
        role="status"
        aria-label={label || '로딩 중'}
        {...props}
      >
        <span className="sr-only">{label || '로딩 중...'}</span>
      </div>
    )

    if (center) {
      return (
        <div className="flex items-center justify-center w-full h-full min-h-[200px]">
          {spinner}
        </div>
      )
    }

    return spinner
  }
)
LoadingSpinner.displayName = 'LoadingSpinner'

// Loading overlay component
interface LoadingOverlayProps {
  isLoading: boolean
  children: React.ReactNode
  className?: string
  spinnerProps?: LoadingSpinnerProps
  message?: string
}

function LoadingOverlay({ 
  isLoading, 
  children, 
  className, 
  spinnerProps, 
  message 
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <LoadingSpinner {...spinnerProps} />
            {message && (
              <p className="mt-2 text-sm text-gray-600">{message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Page loading component
function PageLoading({ message = '페이지를 불러오는 중...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="xl" variant="primary" />
        <p className="mt-4 text-lg text-gray-600">{message}</p>
      </div>
    </div>
  )
}

// Section loading component
function SectionLoading({ message = '로딩 중...' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <LoadingSpinner size="lg" variant="primary" />
        <p className="mt-2 text-sm text-gray-500">{message}</p>
      </div>
    </div>
  )
}

// Inline loading component
function InlineLoading({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2">
      <LoadingSpinner size="sm" />
      {message && <span className="text-sm text-gray-500">{message}</span>}
    </div>
  )
}

export { 
  LoadingSpinner, 
  LoadingOverlay, 
  PageLoading, 
  SectionLoading, 
  InlineLoading,
  spinnerVariants 
}
export type { LoadingSpinnerProps, LoadingOverlayProps }