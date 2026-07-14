import React from 'react'
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native'
import { Alert } from 'react-native'
import Tutorial from '../../app/(tabs)/(tutorial)/tutorial'
import MyTutorials from '../../app/(tabs)/(settings)/my-tutorials'

const mockUserSubId = 'user-123'

let mockTutorialsStore = []

jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn((table) => {
      const builder = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockImplementation((column, value) => {
          return {
            then: (resolve) => {
              const filteredData = mockTutorialsStore.filter(item => item[column] === value)
              return Promise.resolve(resolve({ data: filteredData, error: null }))
            }
          }
        }),
        insert: jest.fn().mockImplementation((payload) => {
          const rowsToInsert = Array.isArray(payload) ? payload : [payload]
          const processedRows = rowsToInsert.map(row => ({
            id: Math.floor(Math.random() * 1000),
            created_at: new Date().toISOString(),
            user_id: mockUserSubId,
            ...row
          }))
          
          mockTutorialsStore.push(...processedRows)
          return Promise.resolve({ data: processedRows, error: null })
        }),
        then: jest.fn().mockImplementation((resolve) => {
          return Promise.resolve(resolve({ data: mockTutorialsStore, error: null }))
        })
      }
      return builder
    })
  }
}))

jest.mock('expo-router', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
    useFocusEffect: (callback) => {
      React.useEffect(() => callback(), [])
    },
    useLocalSearchParams: () => ({ id: 'workout-abc', name: 'Chest Press' }),
    Stack: Object.assign(({ children }) => React.createElement(View, null, children), { Screen: () => null }),
  }
})

jest.mock('../../hooks/auth-context', () => ({
  useAuthContext: () => ({ claims: { sub: mockUserSubId } }),
}))

describe('Tutorial Integration Test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(() => {})
    mockTutorialsStore = []
  })

  afterEach(() => cleanup())

  it('user creates new tutorial and views it in my tutorials', async () => {
    await act(async () => render(<Tutorial />))
    
    const input = screen.getByPlaceholderText('Enter tutorial')
    await act(async () => fireEvent.changeText(input, 'Fresh Muscle Tutorial'))
    await act(async () => fireEvent.press(screen.getByText('Add')))

    expect(mockTutorialsStore).toHaveLength(1)
    expect(mockTutorialsStore[0].content).toBe('Fresh Muscle Tutorial')
    expect(mockTutorialsStore[0].user_id).toBe(mockUserSubId)
    
    await act(async () => cleanup())

    await act(async () => render(<MyTutorials />))

    expect(screen.getByText('Fresh Muscle Tutorial')).toBeTruthy()
  })
})