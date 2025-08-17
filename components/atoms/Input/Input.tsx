import React, { useState, forwardRef } from 'react'
import styles from './Input.module.scss'

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string
  error?: string
  hint?: string
  size?: 'small' | 'medium' | 'large'
  fullWidth?: boolean
  required?: boolean
  showPasswordToggle?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      hint,
      size = 'medium',
      fullWidth = false,
      required = false,
      showPasswordToggle = false,
      icon,
      iconPosition = 'left',
      type = 'text',
      className = '',
      disabled = false,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false)
    
    const inputType = type === 'password' && showPassword ? 'text' : type
    
    const inputClassNames = [
      styles.input__field,
      styles[`input__field--${size}`],
      error && styles['input__field--error'],
      icon && styles[`input__field--with-icon-${iconPosition}`],
      disabled && styles['input__field--disabled'],
    ]
      .filter(Boolean)
      .join(' ')
    
    const wrapperClassNames = [
      styles.input,
      fullWidth && styles['input--full-width'],
      error && styles['input--error'],
      className,
    ]
      .filter(Boolean)
      .join(' ')
    
    return (
      <div className={wrapperClassNames}>
        {label && (
          <label className={styles.input__label}>
            {label}
            {required && <span className={styles.input__required}>*</span>}
          </label>
        )}
        
        <div className={styles.input__wrapper}>
          {icon && iconPosition === 'left' && (
            <span className={styles.input__icon}>{icon}</span>
          )}
          
          <input
            ref={ref}
            type={inputType}
            className={inputClassNames}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? 'error-message' : hint ? 'hint-message' : undefined}
            {...props}
          />
          
          {icon && iconPosition === 'right' && !showPasswordToggle && (
            <span className={styles.input__icon}>{icon}</span>
          )}
          
          {type === 'password' && showPasswordToggle && (
            <button
              type="button"
              className={styles.input__toggle}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '[HIDE]' : '[SHOW]'}
            </button>
          )}
        </div>
        
        {hint && !error && (
          <span id="hint-message" className={styles.input__hint}>
            {hint}
          </span>
        )}
        
        {error && (
          <span id="error-message" className={styles.input__error}>
            {error}
          </span>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input