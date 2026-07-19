import { useState, useCallback } from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../lib/supabase'; 
import { appStyles } from '../styles/styles'

export default function NotificationBell() {
  const router = useRouter();
  const [hasUnread, setHasUnread] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchUnreadStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !isActive) return;

        const { count, error } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false);

        if (error) {
          console.log('Error fetching unread notifications:', error);
          return;
        }

        if (isActive) setHasUnread((count ?? 0) > 0);
      };

      fetchUnreadStatus();

      return () => { isActive = false; };
    }, [])
  );

  return (
    <TouchableOpacity
      onPress={() => router.push('/notifications')}
      style={appStyles.container}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="notifications-outline" size={24} color="#000" />
      {hasUnread && <View style={appStyles.dot} />}
    </TouchableOpacity>
  );
}