import { useEffect, useState } from 'react'

import { supabase } from '../supabaseClient'

// Supabase only allows one verification email per address every 60 seconds,
// so the button waits that long between sends.
const COOLDOWN_SECONDS = 60

// "Resend link" button for an account that hasn't verified its email yet.
// Uses the auth__ classes from Login.css, which every auth page imports.
function ResendVerification({ email }) {
  // 'idle' | 'sending' | 'sent' | 'error'
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [secondsLeft, setSecondsLeft] = useState(0)

  // Count down once a second until the button can be used again.
  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft])

  async function handleResend() {
    setStatus('sending')
    setMessage('')

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/browse` },
    })

    if (error) {
      setStatus('error')
      setMessage(error.message)
      return
    }

    setStatus('sent')
    setMessage(`We sent a new link to ${email}.`)
    setSecondsLeft(COOLDOWN_SECONDS)
  }

  let label = 'Resend link'
  if (status === 'sending') label = 'Sending…'
  else if (secondsLeft > 0) label = `Resend link in ${secondsLeft}s`

  return (
    <>
      <button
        className="btn btn--secondary auth__submit"
        type="button"
        onClick={handleResend}
        disabled={status === 'sending' || secondsLeft > 0}
      >
        {label}
      </button>
      {message && (
        <p
          className={status === 'error' ? 'auth__error' : 'auth__text'}
          role={status === 'error' ? 'alert' : 'status'}
        >
          {message}
        </p>
      )}
    </>
  )
}

export default ResendVerification
