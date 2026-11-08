import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  // true until we've checked localStorage for a saved session, so pages
  // don't redirect to /login during the split second before we know.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. On page load: is someone already logged in?
    const loadSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setLoading(false)
    }

    loadSession()

    // 2. From then on: update whenever they log in, log out, verify their
    //    email, or Supabase refreshes their token.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    // 3. Stop listening when this component unmounts.
    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
