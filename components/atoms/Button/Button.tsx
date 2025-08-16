import React from 'react'
import styles from './Button.module.scss'

export interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  className?: string
  fullWidth?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  fullWidth = false,
  icon,
  iconPosition = 'left',
}) => {
  const classNames = [
    styles.button,
    styles[`button--${variant}`],
    styles[`button--${size}`],
    fullWidth && styles['button--full-width'],
    loading && styles['button--loading'],
    disabled && styles['button--disabled'],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
      aria-disabled={disabled || loading}
    >
      {loading ? (
        <span className={styles.button__loader} aria-label="Loading">
          <span className={styles.button__spinner} />
        </span>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className={styles.button__icon}>{icon}</span>
          )}
          <span className={styles.button__text}>{children}</span>
          {icon && iconPosition === 'right' && (
            <span className={styles.button__icon}>{icon}</span>
          )}
        </>
      )}
    </button>
  )
}

export default Button