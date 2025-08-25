import { describe, it, expect } from 'vitest'
import { add, multiply, isEven } from './math'

describe('Math utilities', () => {
  describe('add', () => {
    it('should add two positive numbers', () => {
      expect(add(2, 3)).toBe(5)
    })

    it('should add positive and negative numbers', () => {
      expect(add(5, -2)).toBe(3)
    })

    it('should add two negative numbers', () => {
      expect(add(-3, -4)).toBe(-7)
    })
  })

  describe('multiply', () => {
    it('should multiply two positive numbers', () => {
      expect(multiply(3, 4)).toBe(12)
    })

    it('should multiply by zero', () => {
      expect(multiply(5, 0)).toBe(0)
    })
  })

  describe('isEven', () => {
    it('should return true for even numbers', () => {
      expect(isEven(2)).toBe(true)
      expect(isEven(4)).toBe(true)
      expect(isEven(0)).toBe(true)
    })

    it('should return false for odd numbers', () => {
      expect(isEven(1)).toBe(false)
      expect(isEven(3)).toBe(false)
    })
  })
})