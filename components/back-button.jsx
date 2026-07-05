import { router } from 'expo-router'
import { Pressable } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'

export default function BackButton() {
  return (
    <Pressable onPress={() => router.back()} style={{ alpha: 1 }}>
      <Ionicons name='arrow-back' size={24} color='black' />
    </ Pressable>    
  )
}