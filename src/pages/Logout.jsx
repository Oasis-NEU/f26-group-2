import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'

import { supabase } from '../supabaseClient'

// The Log out button sends users here. Signing out from this neutral page
// (instead of from inside Nav) avoids two redirects fighting:
// - signing out on a protected page makes RequireAuth jump to /login, and
// - going home before signing out makes the home page jump to /browse.
function Logout() {
  const navigate = useNavigate()
  // In development, StrictMode runs effects twice. Without this guard we'd
  // call signOut twice, and the second call fails because the first one
  // already ended the session.
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    async function logOut() {
      await supabase.auth.signOut()
      navigate('/', { replace: true })
    }

    logOut()
  }, [navigate])

  return null
}

export default Logout
