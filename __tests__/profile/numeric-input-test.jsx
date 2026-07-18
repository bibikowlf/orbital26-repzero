import { handleNumericInput } from '../../functions/numeric-input'

describe('handleNumericInput Unit Test', () => {
  it('handleNumericInput cleans string to numeric characters and handles edge cases', () => {
    expect(handleNumericInput('123')).toBe(123)
    expect(handleNumericInput('abc124def!')).toBe(124)
    expect(handleNumericInput(' 7 8 9 ')).toBe(789)
    expect(handleNumericInput('abcdef')).toBe(0)
    expect(handleNumericInput('')).toBe(0)
  })
})