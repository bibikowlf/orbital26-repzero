import { TouchableOpacity } from 'react-native'
import { appStyles } from '../styles/styles'
import { router } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'

export default function ProfileButton() {
  const styles = appStyles

  return (
    <TouchableOpacity style={[styles.actionButton, { flex: 0 }]} onPress={() => router.navigate('/profile')}>
      <Ionicons name="person" size={24} color="black" />
    </TouchableOpacity>
  );
};