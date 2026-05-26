import { useState, useEffect, useCallback, useRef } from 'react'
import { AuthContext } from './authContext'
import { getSession, onAuthChange, signOut as signOutSession } from '../../api/authApi'
import { getProfile } from '../../api/profilesApi'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const userRef = useRef(null)

  useEffect(() => {
    let mounted = true

    const init = async () => {
      try {
        const { data } = await getSession()
        if (!mounted) return

        const currentSession = data.session
        setSession(currentSession)

        if (currentSession?.user) {
          try {
            const u = await loadProfile(currentSession.user)
            if (mounted) {
              setUser(u)
              userRef.current = u
            }
          } catch {
            if (mounted) {
              const fallback = { id: currentSession.user.id, role: 'client', full_name: currentSession.user.email }
              setUser(fallback)
              userRef.current = fallback
            }
          }
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    init()

    const { data: listener } = onAuthChange((_event, newSession) => {
      if (!mounted) return
      setSession(newSession)
      if (newSession?.user) {
        loadProfile(newSession.user)
          .then(u => { if (mounted) { setUser(u); userRef.current = u } })
          .catch(() => {
            if (mounted) {
              const fb = { id: newSession.user.id, role: 'client', full_name: newSession.user.email }
              setUser(fb)
              userRef.current = fb
            }
          })
      } else {
        setUser(null)
        userRef.current = null
      }
    })

    window.addEventListener('auth-profile-update', () => {
      if (userRef.current) {
        loadProfile(userRef.current)
          .then(u => { if (mounted) { setUser(u); userRef.current = u } })
      }
    })

    return () => {
      mounted = false
      listener?.subscription?.unsubscribe()
    }
  }, [])

  const updateUser = useCallback((newData) => {
    setUser(prev => {
      const updated = { ...prev, ...newData }
      userRef.current = updated
      return updated
    })
  }, [])

  const signOut = useCallback(async () => {
    await signOutSession()
    setSession(null)
    setUser(null)
    userRef.current = null
  }, [])

  return (
    <AuthContext.Provider value={{ session, loading, user, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

function getAuthFallback(authUser) {
  const metadata = authUser?.user_metadata || {}
  const firstName = metadata.first_name || metadata.name?.split(' ')[0] || ''
  const lastName = metadata.last_name || ''
  const fullName = metadata.full_name || metadata.name || [firstName, lastName].filter(Boolean).join(' ')

  return {
    id: authUser?.id,
    role: metadata.role || 'client',
    full_name: fullName || firstName || authUser?.email || 'Usuario',
    first_name: firstName || undefined,
    last_name: lastName || undefined,
    email: authUser?.email,
  }
}

async function loadProfile(authUserOrId) {
  const authUser = typeof authUserOrId === 'object' ? authUserOrId : { id: authUserOrId }
  const userId = authUser.id
  const fallback = getAuthFallback(authUser)
  const profile = await getProfile(userId)
  if (!profile) return fallback

  return {
    ...fallback,
    ...profile,
    id: profile.id || userId,
    role: profile.role || fallback.role,
    full_name: profile.full_name || fallback.full_name,
    first_name: profile.first_name || fallback.first_name,
    last_name: profile.last_name || fallback.last_name,
    email: profile.email || fallback.email,
  }
}
