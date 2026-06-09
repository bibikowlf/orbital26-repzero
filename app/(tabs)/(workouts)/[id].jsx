import { useState, useEffect } from 'react'
import { View, Text, TextInput, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { appStyles } from '../../../styles/styles'
import { supabase } from '../../../lib/supabase'
import { useLocalSearchParams, Stack } from 'expo-router'
import Spacer from '../../../components/spacer'

export default function WorkoutComments() {
    const { id, name } = useLocalSearchParams()
    const styles = appStyles
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
      fetchComments()
    }, [id])

    const fetchComments = async () => {

    }

    if (loading) {
      return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      )
    }

    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: name, headerBackVisible: false, headerTitleAlign: 'center' }} />
      </View>
    )
}