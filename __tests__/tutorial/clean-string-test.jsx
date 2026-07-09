import { cleanString } from '../../functions/clean-string'

describe('cleanString Test', () => {
  it('cleanString correctly removes non alphabetic characters from string and lowercases it', () => {
    expect(cleanString('GymBro')).toBe('gymbro')
    expect(cleanString('Hello World')).toBe('helloworld')
    expect(cleanString('App123!@#')).toBe('app')
    expect(cleanString('REACT_NATIVE_2026')).toBe('reactnative')
    expect(cleanString('!!!999')).toBe('')
    expect(cleanString('')).toBe('')
  })
})