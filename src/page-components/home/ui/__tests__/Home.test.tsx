import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from '../Home'

// Mock useRouter (handled globally in setup.ts)

describe('Home Component Logo Tests', () => {
  beforeEach(() => {
    render(<Home />)
  })

  test('should display Vlanet logo in header with correct accessibility attributes', () => {
    const headerLogo = screen.getByAltText('Vlanet 로고')
    expect(headerLogo).toBeInTheDocument()
    expect(headerLogo).toHaveAttribute('src', '/images/Common/w_logo02.svg')
    expect(headerLogo).toHaveAttribute('alt', 'Vlanet 로고')
  })

  test('should display Vlanet logo in footer with correct accessibility attributes', () => {
    const footerLogo = screen.getByAltText('Vlanet')
    expect(footerLogo).toBeInTheDocument()
    expect(footerLogo).toHaveAttribute('src', '/images/Common/w_logo02.svg')
    expect(footerLogo).toHaveAttribute('alt', 'Vlanet')
  })

  test('should have logos wrapped in proper semantic elements', () => {
    // Header logo should be in h1 for proper semantic structure
    const headerLogoContainer = screen.getByRole('banner').querySelector('h1')
    expect(headerLogoContainer).toBeInTheDocument()
    expect(headerLogoContainer).toHaveClass('logo')

    // Footer logo should be accessible
    const footerLogoContainer = screen.getByRole('contentinfo').querySelector('.logo')
    expect(footerLogoContainer).toBeInTheDocument()
  })

  test('should have proper logo dimensions applied via CSS classes', () => {
    const headerLogo = screen.getByAltText('Vlanet 로고')
    const footerLogo = screen.getByAltText('Vlanet')
    
    // Check that logos have the logo class for CSS styling
    expect(headerLogo.closest('.logo')).toBeInTheDocument()
    expect(footerLogo.closest('.logo')).toBeInTheDocument()
  })
})