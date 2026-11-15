import { useState } from 'react'
import { Link } from 'react-router'

import Nav from '../components/Nav'
import { supabase } from '../supabaseClient'
import './Login.css'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Set once Supabase has accepted the request.
  const [sentTo, setSentTo] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const cleanEmail = email.trim().toLowerCase()
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      // Where the email link sends them. Must be in Supabase's Redirect URLs.
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    setSentTo(cleanEmail)
  }

  if (sentTo) {
    return (
      <>
        <Nav variant="public" />

        <main className="container auth">
          <div className="auth__card">
            <h1 className="auth__title">Check your inbox</h1>
            {/* Supabase answers the same way whether or not the account exists,
                so we don't reveal which emails are registered. */}
            <p className="auth__text">
              If there’s an account for <strong>{sentTo}</strong>, we sent it a link to reset your
              password. The link expires in 1 hour.
            </p>
            <p className="auth__switch">
              Remembered it? <Link to="/login">Log in</Link>
            </p>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Nav variant="public" />

      <main className="container auth">
        <form className="auth__card" onSubmit={handleSubmit}>
          <h1 className="auth__title">Reset your password</h1>
          <p className="auth__text">Enter your email and we’ll send you a link to set a new one.</p>

          <label className="auth__label" htmlFor="forgot-email">
            Northeastern email
          </label>
          <input
            id="forgot-email"
            className="text-input"
            type="email"
            autoComplete="email"
            placeholder="you@northeastern.edu"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          {error && (
            <p className="auth__error" role="alert">
              {error}
            </p>
          )}

          <button className="btn btn--primary auth__submit" type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>

          <p className="auth__switch">
            Remembered it? <Link to="/login">Log in</Link>
          </p>
        </form>
      </main>
    </>
  )
}

export default ForgotPassword
