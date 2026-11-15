import { useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { useAuth } from '../auth/AuthContext'
import Nav from '../components/Nav'
import { supabase } from '../supabaseClient'
import './Login.css'

const MIN_PASSWORD_LENGTH = 8

// Reads the error Supabase puts in the URL when a reset link is expired or
// already used, e.g. /reset-password#error_code=otp_expired&error_description=...
function getLinkError() {
  const params = new URLSearchParams(window.location.hash.slice(1))
  return params.get('error_description')
}

// The reset email links here. Clicking it logs the user in (supabase-js reads
// the token from the URL), so all this page has to do is set the new password.
function ResetPassword() {
  const navigate = useNavigate()
  const { session, loading } = useAuth()
  const [linkError] = useState(getLinkError)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }

    setSubmitting(true)
    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }
    setDone(true)
  }

  let content
  if (linkError || (!loading && !session)) {
    content = (
      <div className="auth__card">
        <h1 className="auth__title">This link doesn’t work</h1>
        <p className="auth__text">
          {linkError
            ? 'Your reset link has expired or was already used.'
            : 'Open the reset link from your email to set a new password.'}{' '}
          Request a new link and use it within 1 hour.
        </p>
        <Link className="btn btn--primary auth__submit" to="/forgot-password">
          Request a new link
        </Link>
      </div>
    )
  } else if (loading) {
    content = <p className="auth__text">Checking your link…</p>
  } else if (done) {
    content = (
      <div className="auth__card">
        <h1 className="auth__title">Password updated</h1>
        <p className="auth__text">You’re logged in with your new password.</p>
        <button
          className="btn btn--primary auth__submit"
          type="button"
          onClick={() => navigate('/browse')}
        >
          Browse listings
        </button>
      </div>
    )
  } else {
    content = (
      <form className="auth__card" onSubmit={handleSubmit}>
        <h1 className="auth__title">Set a new password</h1>

        <label className="auth__label" htmlFor="reset-password">
          New password
        </label>
        <input
          id="reset-password"
          className="text-input"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <label className="auth__label" htmlFor="reset-confirm">
          Confirm new password
        </label>
        <input
          id="reset-confirm"
          className="text-input"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />

        {error && (
          <p className="auth__error" role="alert">
            {error}
          </p>
        )}

        <button className="btn btn--primary auth__submit" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    )
  }

  return (
    <>
      <Nav variant="public" />
      <main className="container auth">{content}</main>
    </>
  )
}

export default ResetPassword
