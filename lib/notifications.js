import { supabase } from './supabase'

export async function createNotification({ userId, actorId, type, message, referenceId = null }) {
  if (userId === actorId) 
    return 

  const { error } = await supabase.from('notifications').insert({
    user_id: userId,
    actor_id: actorId,
    type,
    message,
    reference_id: referenceId,
  })

  if (error) 
    console.log('Error creating notification:', error)
}