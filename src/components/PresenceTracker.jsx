import { useEffect, useRef } from 'react'
import { supabase } from '../services/supabase'
import { useAuth } from '../features/auth/authContext'
import { isMissingLastSeenColumn } from '../utils/presence'

export function PresenceTracker() {
  const { user } = useAuth()
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!user?.id) return

    const beat = async () => {
      const now = new Date().toISOString()
      const { error } = await supabase.from('profiles').update({ last_seen_at: now }).eq('id', user.id)
      if (isMissingLastSeenColumn(error)) {
        await supabase.from('profiles').update({ updated_at: now }).eq('id', user.id)
      }
    }

    beat()
    intervalRef.current = setInterval(beat, 15000)

    return () => {
      clearInterval(intervalRef.current)
    }
  }, [user?.id])

  return null
}
