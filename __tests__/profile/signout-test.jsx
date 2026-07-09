import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import SignOutButton from '../../components/signout-button'
import { supabase } from '../../lib/supabase'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(() => Promise.resolve({ error: null })),
    },
  },
}))

jest.mock('../../styles/styles', () => ({
  appStyles: {},
}))

describe('Signout Test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('supabase.auth.signOut is called after pressing signout button', async () => {
    await act(async () => render(<SignOutButton />))

    const signOutButton = screen.getByText('Sign out')
    await act(async () => fireEvent.press(signOutButton))

    await waitFor(() => expect(supabase.auth.signOut).toHaveBeenCalled())
  })
})