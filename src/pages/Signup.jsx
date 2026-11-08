import { useState } from 'react'
import { Link } from 'react-router'

import Nav from '../components/Nav'
import { supabase } from '../supabaseClient'
import './Login.css'

const NU_DOMAIN = '@northeastern.edu'
const MIN_PASSWORD_LENGTH = 8

function Signup() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Set once Supabase has sent the verification email.
  const [sentTo, setSentTo] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const cleanEmail = email.trim().toLowerCase()

    // Quick feedback in the form. The real check is the Supabase
    // "Before User Created" hook, since anyone can call signUp() directly.
    if (!cleanEmail.endsWith(NU_DOMAIN)) {
      setError('Use your Northeastern email to sign up.')
      return
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }

    setSubmitting(true)

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        // Where the verify link sends them. Must be in Supabase's Redirect URLs.
        emailRedirectTo: `${window.location.origin}/browse`,
        // Saved on the user as user_metadata.display_name.
        data: { display_name: name.trim() },
      },
    })

    setSubmitting(false)

    if (error) {
      setError(error.message)
      return
    }

    // Supabase doesn't return an error for an email that's already registered
    // (so nobody can probe which emails have accounts). The clue is an empty
    // identities list.
    if (data.user && data.user.identities?.length === 0) {
      setError('An account with this email already exists. Log in instead.')
      return
    }

    // With "Confirm email" on, there's no session yet: they must click the link.
    setSentTo(cleanEmail)
  }

  if (sentTo) {
    return (
      <>
        <Nav variant="public" />

        <main className="container auth">
          <div className="auth__card">
            <h1 className="auth__title">Check your inbox</h1>
            <p className="auth__text">
              We sent a verification link to <strong>{sentTo}</strong>. Click it to finish signing
              up. The link expires in 1 hours.
            </p>
            <p className="auth__switch">
              Already verified? <Link to="/login">Log in</Link>
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
          <h1 className="auth__title">Sign up</h1>

          <label className="auth__label" htmlFor="signup-name">
            Name
          </label>
          <input
            id="signup-name"
            className="text-input"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <label className="auth__label" htmlFor="signup-email">
            Northeastern email
          </label>
          <input
            id="signup-email"
            className="text-input"
            type="email"
            autoComplete="email"
            placeholder="you@northeastern.edu"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label className="auth__label" htmlFor="signup-password">
            Password
          </label>
          <input
            id="signup-password"
            className="text-input"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <label className="auth__label" htmlFor="signup-confirm">
            Confirm password
          </label>
          <input
            id="signup-confirm"
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
            {submitting ? 'Creating account…' : 'Sign up'}
          </button>

          <p className="auth__switch">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </main>
    </>
  )
}

export default Signup
