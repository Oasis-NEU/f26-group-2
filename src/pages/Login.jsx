import { useState } from 'react'
import { useNavigate } from 'react-router'

import Nav from '../components/Nav'
import { supabase } from '../supabaseClient'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    setSubmitting(false)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/browse')
  }

  return (
    <>
      <Nav variant="public" />

      <main className="container auth">
        <form className="auth__card" onSubmit={handleSubmit}>
          <h1 className="auth__title">Log in</h1>

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

          {error && (
            <p className="auth__error" role="alert">
              {error}
            </p>
          )}

          <button className="btn btn--primary auth__submit" type="submit" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </main>
    </>
  )
}

export default Login
