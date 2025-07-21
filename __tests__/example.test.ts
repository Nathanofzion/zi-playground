// __tests__/example.test.ts
describe('Example Unit Test', () => {
  test('basic math works', () => {
    expect(2 + 2).toBe(4)
  })

  test('string operations work', () => {
    const greeting = 'Hello, World!'
    expect(greeting).toContain('World')
  })
})