import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import HomeTest from '../HomeTest'

describe('HomeTest Component Logo Tests', () => {
  beforeEach(() => {
    render(<HomeTest />)
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

  test('should maintain consistent branding throughout the component', () => {
    // Both header and footer should use the same logo file
    const logos = screen.getAllByRole('img', { name: /vlanet/i })
    expect(logos).toHaveLength(2)
    
    logos.forEach(logo => {
      expect(logo).toHaveAttribute('src', '/images/Common/w_logo02.svg')
    })
  })
})