import { useState, useEffect } from 'react'
import { View, Text, TextInput, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native'
import { appStyles } from '../../../styles/styles'
import { supabase } from '../../../lib/supabase'
import { useLocalSearchParams, Stack } from 'expo-router'
import Spacer from '../../../components/spacer'

export default function WorkoutComments() {
    const { id } = useLocalSearchParams()
    const styles = appStyles

    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: id, headerBackVisible: false, headerTitleAlign: 'center' }} />
        <Text>{id}</Text>
      </View>
    )
}