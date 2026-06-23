import { cleanString } from '../app/(tabs)/workout-tutorial'

jest.mock('@react-native-async-storage/async-storage', () => 
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)
jest.mock('../lib/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}))

describe('CleanString Unit Tests', () => {
  it('should remove non alphabetic characters from a string and change to lowercase', () => {
    const mockString = 'Aa^bB01  -'
    const result = cleanString(mockString)

    expect(result === 'aabb')
  })
})