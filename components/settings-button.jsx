import { useState } from 'react'
import { TouchableOpacity, View, Text, Modal, Pressable } from 'react-native'
import { router } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'

const MENU_ITEMS = [
  { label: '👤  Profile', route: '/profile' },
  { label: '📝  My Posts', route: '/my-posts' },
  { label: '🎥  My Tutorials', route: '/my-tutorials' },
  { label: '📅  My Events', route: '/my-events' },
]

export default function SettingsButton() {
  const [visible, setVisible] = useState(false)

  function handleNavigate(route) {
    setVisible(false)
    router.navigate(route)
  }

  return (
    <View>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={{ paddingLeft: 0, paddingVertical: 4 }}
      >
        <Ionicons name="settings-outline" size={24} color="black" />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={() => setVisible(false)}
        >
          <Pressable
            style={{
              position: 'absolute',
              top: 52,
              left: 12,
              backgroundColor: '#fff',
              borderRadius: 14,
              paddingVertical: 6,
              minWidth: 180,
              shadowColor: '#000',
              shadowOpacity: 0.12,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 4 },
              elevation: 8,
            }}
            onPress={() => {}}
          >
            {MENU_ITEMS.map((item, idx) => (
              <TouchableOpacity
                key={item.route}
                onPress={() => handleNavigate(item.route)}
                style={{
                  paddingVertical: 13,
                  paddingHorizontal: 18,
                  borderBottomWidth: idx < MENU_ITEMS.length - 1 ? 1 : 0,
                  borderBottomColor: '#f0f0f0',
                }}
              >
                <Text style={{ fontSize: 15, color: '#111', fontWeight: '500' }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}