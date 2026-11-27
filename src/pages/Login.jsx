import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'

import ResendVerification from '../auth/ResendVerification'
import Nav from '../components/Nav'
import { supabase } from '../supabaseClient'
import './Login.css'

// Where to go after logging in: the page that sent them here (only paths on
// this site), or Browse.
function returnPath(from) {
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/browse'
}

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from
  const forListing = typeof from === 'string' && from.startsWith('/listings/')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  // Set when the account exists but its email hasn't been verified yet.
  const [unverifiedEmail, setUnverifiedEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setUnverifiedEmail('')
    setSubmitting(true)

    const cleanEmail = email.trim().toLowerCase()
    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    })

    setSubmitting(false)
    if (error) {
      // Supabase refuses to log in unverified accounts ("Confirm email" is on).
      if (error.code === 'email_not_confirmed') {
        setUnverifiedEmail(cleanEmail)
        return
      }
      setError(error.message)
      return
    }
    navigate(returnPath(from), { replace: true })
  }

  return (
    <>
      <Nav variant="public" />

      <main className="container auth">
        <form className="auth__card" onSubmit={handleSubmit}>
          <h1 className="auth__title">Log in</h1>
          {forListing && (
            <p className="auth__text auth__intro">Log in with your Northeastern email to see this listing.</p>
          )}

          <label className="auth__label" htmlFor="login-email">
            Northeastern email
          </label>
          <input
            id="login-email"
            className="text-input"
            type="email"
            autoComplete="email"
            placeholder="you@northeastern.edu"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label className="auth__label" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            className="text-input"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <Link className="auth__forgot" to="/forgot-password">
            Forgot password?
          </Link>

          {error && (
            <p className="auth__error" role="alert">
              {error}
            </p>
          )}

          {unverifiedEmail && (
            <p className="auth__error" role="alert">
              Verify your email first. Click the link we sent to {unverifiedEmail} when you signed
              up.
            </p>
          )}

          <button className="btn btn--primary auth__submit" type="submit" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>

          {unverifiedEmail && <ResendVerification email={unverifiedEmail} />}

          <p className="auth__switch">
            New to Husky Exchange? <Link to="/signup">Sign up</Link>
          </p>
        </form>
      </main>
    </>
  )
}

export default Login
