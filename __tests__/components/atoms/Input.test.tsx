import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Input } from '@/components/atoms/Input'

describe('Input Component', () => {
  it('should render with placeholder', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })
  
  it('should handle value changes', () => {
    const handleChange = jest.fn()
    render(<Input onChange={handleChange} />)
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'test' } })
    expect(handleChange).toHaveBeenCalled()
  })
  
  it('should display error message', () => {
    render(<Input error="This field is required" />)
    expect(screen.getByText('This field is required')).toBeInTheDocument()
  })
  
  it('should show label when provided', () => {
    render(<Input label="Email Address" />)
    expect(screen.getByText('Email Address')).toBeInTheDocument()
  })
  
  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled />)
    expect(screen.getByRole('textbox')).toBeDisabled()
  })
  
  it('should show required indicator when required', () => {
    render(<Input label="Email" required />)
    expect(screen.getByText('*')).toBeInTheDocument()
  })
  
  it('should handle different input types', () => {
    render(<Input type="email" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')
  })
  
  it('should apply error styles when error is present', () => {
    const { container } = render(<Input error="Error message" />)
    expect(container.querySelector('.input--error')).toBeInTheDocument()
  })
  
  it('should handle password type with toggle visibility', () => {
    render(<Input type="password" showPasswordToggle />)
    const toggleButton = screen.getByRole('button')
    expect(toggleButton).toBeInTheDocument()
  })
})