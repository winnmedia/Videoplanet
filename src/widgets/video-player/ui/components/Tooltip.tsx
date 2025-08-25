'use client'

import React, { useState, useRef, useEffect } from 'react'
import styles from './Tooltip.module.scss'

interface TooltipProps {
  children: React.ReactNode
  content: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  delay = 300
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ x: 0, y: 0 })
  const timeoutRef = useRef<NodeJS.Timeout>()
  const triggerRef = useRef<HTMLDivElement>(null)

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
      updatePosition()
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  const updatePosition = () => {
    if (!triggerRef.current) return

    const rect = triggerRef.current.getBoundingClientRect()
    let x = 0
    let y = 0

    switch (position) {
      case 'top':
        x = rect.left + rect.width / 2
        y = rect.top - 8
        break
      case 'bottom':
        x = rect.left + rect.width / 2
        y = rect.bottom + 8
        break
      case 'left':
        x = rect.left - 8
        y = rect.top + rect.height / 2
        break
      case 'right':
        x = rect.right + 8
        y = rect.top + rect.height / 2
        break
    }

    setCoords({ x, y })
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      <div
        ref={triggerRef}
        className={styles.trigger}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={`${styles.tooltip} ${styles[position]}`}
          style={{
            left: coords.x,
            top: coords.y
          }}
          role="tooltip"
        >
          <div className={styles.content}>{content}</div>
        </div>
      )}
    </>
  )
}