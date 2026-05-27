import { supabase } from '../lib/supabase'
import React from 'react'
import { Button } from 'react-native'
import { appStyles } from '../styles/styles'

async function onSignOutButtonPress() {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
  }
}

export default function SignOutButton() {
  const styles = appStyles
  return <Button title="Sign out" onPress={onSignOutButtonPress} />
}