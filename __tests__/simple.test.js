// 간단한 Jest 테스트 - 환경 검증용
describe('Jest Environment Test', () => {
  it('should run basic JavaScript test', () => {
    expect(2 + 2).toBe(4)
  })

  it('should have access to jsdom environment', () => {
    expect(typeof window).toBe('object')
    expect(typeof document).toBe('object')
  })

  it('should have localStorage available', () => {
    expect(typeof localStorage).toBe('object')
    localStorage.setItem('test', 'value')
    expect(localStorage.getItem('test')).toBe('value')
  })

  it('should have fetch mock available', () => {
    expect(typeof global.fetch).toBe('function')
  })

  it('should be able to test async functions', async () => {
    const mockPromise = Promise.resolve('test value')
    const result = await mockPromise
    expect(result).toBe('test value')
  })
})