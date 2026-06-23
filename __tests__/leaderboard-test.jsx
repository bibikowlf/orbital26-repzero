import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react-native'
import LeaderBoard from '../app/(tabs)/(community)/leaderboard'
import { supabase } from '../lib/supabase'

const mockLeaderboardData = Array.from({ length: 11 }, (_, i) => ({
  id: `user-id-${i + 1}`,
  username: `User_Rank_${i + 1}`,
  minutes: 500 - i * 10
}))

let mockActiveChains = {}

jest.mock('../lib/supabase', () => {
  return {
    supabase: {
      from: jest.fn((table) => {
        if (!mockActiveChains[table]) {
          const builder = {
            select: jest.fn().mockImplementation(() => builder),
            then: jest.fn().mockImplementation((resolve) => {
              if (table === 'total_minutes_this_week') {
                return Promise.resolve(resolve({ data: mockLeaderboardData, error: null }))
              }
              return Promise.resolve(resolve({ data: [], error: null }))
            })
          }
          mockActiveChains[table] = builder
        }
        return mockActiveChains[table]
      })
    }
  }
})

jest.mock('../hooks/auth-context', () => ({
  useAuthContext: () => ({ 
    claims: { sub: 'user-id-5' }
  }),
}))

describe('Leaderboard Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockActiveChains = {}
  })

  it('correctly filters, renders ranks 1 through 10, and omits rank 11', async () => {
    await act(async () => render(<LeaderBoard />))
    await waitFor(() => expect(screen.getByText(/You're in 5th place with 460 minutes!/)).toBeTruthy())

    expect(screen.getByText('User_Rank_1')).toBeTruthy()
    expect(screen.getByText('User_Rank_2')).toBeTruthy()
    expect(screen.getByText('User_Rank_3')).toBeTruthy()

    expect(screen.getByText(/4\s+User_Rank_4/)).toBeTruthy()
    expect(screen.getByText(/5\s+You/)).toBeTruthy()
    expect(screen.getByText(/6\s+User_Rank_6/)).toBeTruthy()
    expect(screen.getByText(/7\s+User_Rank_7/)).toBeTruthy()
    expect(screen.getByText(/8\s+User_Rank_8/)).toBeTruthy()
    expect(screen.getByText(/9\s+User_Rank_9/)).toBeTruthy()
    expect(screen.getByText(/10\s+User_Rank_10/)).toBeTruthy()

    expect(screen.queryByText(/11\s+/)).toBeNull()
    expect(screen.queryByText('User_Rank_11')).toBeNull()
  })
})