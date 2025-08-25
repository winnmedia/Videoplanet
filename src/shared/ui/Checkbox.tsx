import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/utils'
import { Check } from 'lucide-react'

const checkboxVariants = cva(
  'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        error: 'border-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:text-white',
      },
      size: {
        default: 'h-4 w-4',
        sm: 'h-3 w-3',
        lg: 'h-5 w-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof checkboxVariants> {
  label?: React.ReactNode
  description?: string
  error?: string
  indeterminate?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({
    className,
    variant,
    size,
    label,
    description,
    error,
    indeterminate = false,
    id,
    checked,
    ...props
  }, ref) => {
    const [internalId] = React.useState(() => id || Math.random().toString(36).substring(2, 15))
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useImperativeHandle(ref, () => inputRef.current!)

    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = indeterminate
      }
    }, [indeterminate])

    const checkboxVariant = error ? 'error' : variant

    return (
      <div className="flex items-start space-x-2">
        <div className="relative flex items-center">
          <input
            type="checkbox"
            id={internalId}
            ref={inputRef}
            className={cn(
              'appearance-none',
              checkboxVariants({ variant: checkboxVariant, size }),
              className
            )}
            checked={checked}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${internalId}-error` : 
              description ? `${internalId}-description` : 
              undefined
            }
            {...props}
          />
          
          {/* Custom checkbox visual */}
          <div className={cn(
            'absolute inset-0 flex items-center justify-center pointer-events-none',
            'opacity-0 transition-opacity',
            checked && 'opacity-100'
          )}>
            {indeterminate ? (
              <div className="w-2 h-0.5 bg-current rounded-full" />
            ) : (
              <Check size={size === 'sm' ? 10 : size === 'lg' ? 14 : 12} className="text-current" />
            )}
          </div>
        </div>
        
        {(label || description) && (
          <div className="flex-1">
            {label && (
              <label
                htmlFor={internalId}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {label}
              </label>
            )}
            
            {description && (
              <p
                id={`${internalId}-description`}
                className="text-sm text-muted-foreground mt-1"
              >
                {description}
              </p>
            )}
            
            {error && (
              <p
                id={`${internalId}-error`}
                className="text-sm text-red-600 mt-1"
                role="alert"
              >
                {error}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox, checkboxVariants }