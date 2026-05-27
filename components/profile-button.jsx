import React from 'react'
import { TouchableOpacity, Text } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { appStyles } from '../styles/styles'
import { router } from 'expo-router'

export default function ProfileButton() {
  const styles = appStyles

  return (
    <TouchableOpacity style={[styles.actionButton, { flex: 0 }]} onPress={() => router.navigate('/profile')}>
      <Text style={styles.text}>👤</Text>
    </TouchableOpacity>
  );
};