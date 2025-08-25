import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils'
import { Eye, EyeOff } from 'lucide-react'

const inputVariants = cva(
  'flex w-full rounded-[15px] border border-[#eeeeee] bg-white px-4 py-2 text-base font-[SUIT_Variable] ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#919191] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[5px_5px_10px_#e8e8e8] focus-visible:bg-white hover:shadow-[5px_5px_10px_#e8e8e8] hover:bg-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        error: 'border-red-500 focus-visible:ring-red-500',
        success: 'border-green-500 focus-visible:ring-green-500',
      },
      size: {
        default: 'h-10',
        sm: 'h-9',
        lg: 'h-[54px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  error?: string
  success?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  showPasswordToggle?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    variant,
    size,
    type,
    label,
    error,
    success,
    hint,
    leftIcon,
    rightIcon,
    showPasswordToggle,
    id,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const [internalId] = React.useState(() => id || Math.random().toString(36).substring(2, 15))
    
    const inputType = showPasswordToggle && type === 'password' 
      ? (showPassword ? 'text' : 'password')
      : type

    const inputVariant = error ? 'error' : success ? 'success' : variant

    const togglePassword = () => {
      setShowPassword(!showPassword)
    }

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={internalId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          
          <input
            type={inputType}
            id={internalId}
            className={cn(
              inputVariants({ variant: inputVariant, size }),
              leftIcon && 'pl-10',
              (rightIcon || showPasswordToggle) && 'pr-10',
              className
            )}
            ref={ref}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${internalId}-error` : 
              success ? `${internalId}-success` : 
              hint ? `${internalId}-hint` : 
              undefined
            }
            {...props}
          />
          
          {showPasswordToggle && type === 'password' && (
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={togglePassword}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          )}
          
          {!showPasswordToggle && rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        
        {error && (
          <p 
            id={`${internalId}-error`}
            className="mt-1 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}
        
        {success && !error && (
          <p 
            id={`${internalId}-success`}
            className="mt-1 text-sm text-green-600"
            role="status"
          >
            {success}
          </p>
        )}
        
        {hint && !error && !success && (
          <p 
            id={`${internalId}-hint`}
            className="mt-1 text-sm text-gray-500"
          >
            {hint}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input, inputVariants }