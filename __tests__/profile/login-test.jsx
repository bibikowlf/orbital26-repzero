import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native'
import Login from '../../app/login'
import { supabase } from '../../lib/supabase'

jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(() => Promise.resolve({ data: {}, error: null })),
      signInWithPassword: jest.fn(() => Promise.resolve({ data: {}, error: null })),
    },
  },
}))

jest.mock('expo-router', () => {
  const ReactModule = require('react')
  return {
    router: { navigate: jest.fn() },
    useFocusEffect: (callback) => {
      ReactModule.useEffect(() => {
        callback()
      }, [callback])
    },
    Stack: {
      Screen: () => null,
    },
  }
})

jest.mock('../../styles/styles', () => ({
  appStyles: {},
}))

describe('Login Test', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('supabase.signUp is called after pressing signup button', async () => {
    await act(async () => render(<Login />))

    const emailInput = screen.getByPlaceholderText('email@address.com')
    const passwordInput = screen.getByPlaceholderText('Password')
    
    await act(async () => fireEvent.changeText(emailInput, 'test@example.com'))
    await act(async () => fireEvent.changeText(passwordInput, 'password123'))

    const signUpButton = screen.getByText('Sign up')
    await act(async () => fireEvent.press(signUpButton))

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('supabase.signInWithPassword is called after pressing signin button', async () => {
    await act(async () => render(<Login />))

    const emailInput = screen.getByPlaceholderText('email@address.com')
    const passwordInput = screen.getByPlaceholderText('Password')
    
    await act(async () => fireEvent.changeText(emailInput, 'test@example.com'))
    await act(async () => fireEvent.changeText(passwordInput, 'password123'))

    const signInButton = screen.getByText('Sign in')
    await act(async () => fireEvent.press(signInButton))

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })
})