'use client';

import React from 'react';
import classNames from 'classnames';
import styles from './FormGroup.module.scss';

export interface FormGroupProps {
  children: React.ReactNode;
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  layout?: 'vertical' | 'horizontal';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  htmlFor?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const FormGroup: React.FC<FormGroupProps> = ({
  children,
  label,
  required = false,
  error,
  hint,
  layout = 'vertical',
  size = 'medium',
  fullWidth = false,
  htmlFor,
  className = '',
  style,
}) => {
  const formGroupClasses = classNames(
    styles['form-group'],
    styles[`form-group--${layout}`],
    styles[`form-group--${size}`],
    {
      [styles['form-group--error'] || '']: !!error,
      [styles['form-group--full-width'] || '']: fullWidth,
    },
    className
  );

  const showHint = hint && !error;
  const showError = !!error;

  return (
    <div className={formGroupClasses} style={style}>
      {label && (
        <label 
          className={styles['form-group__label']} 
          htmlFor={htmlFor}
        >
          {label}
          {required && (
            <span className={styles['form-group__required']}>*</span>
          )}
        </label>
      )}
      
      <div className={styles['form-group__content']}>
        {children}
      </div>
      
      {showError && (
        <div className={styles['form-group__error']}>
          {error}
        </div>
      )}
      
      {showHint && (
        <div className={styles['form-group__hint']}>
          {hint}
        </div>
      )}
    </div>
  );
};