import { Link, useNavigate } from 'react-router'

import { supabase } from '../supabaseClient'
import SearchBar from './SearchBar'
import './Nav.css'

function Logo() {
  return (
    <Link className="logo" to="/">
      <span className="logo__mark">NU</span>
      <span className="logo__name">NU Exchange</span>
    </Link>
  )
}

// variant="public" is the logged-out landing nav; variant="app" is the
// signed-in nav with search, messages and the user's avatar.
function Nav({ variant = 'public', initials = 'MM' }) {
  const navigate = useNavigate()

  async function handleLogout() {
    // Leave the protected page first. If we signed out first, RequireAuth
    // would see session === null and redirect to /login before we got here.
    navigate('/')
    // Clears the session from localStorage and fires SIGNED_OUT, which
    // AuthProvider hears and sets session to null.
    await supabase.auth.signOut()
  }

  if (variant === 'app') {
    return (
      <header className="nav">
        <div className="container nav__inner nav__inner--app">
          <Logo />
          <div className="nav__search">
            <SearchBar size="compact" />
          </div>
          <Link className="nav__link nav__link--hide-mobile" to="/messages">
            Messages
          </Link>
          <Link className="btn btn--primary" to="/sell">
            Sell
          </Link>
          <Link className="nav__avatar" to="/profile" aria-label="Your profile">
            {initials}
          </Link>
          <button className="btn btn--secondary" type="button" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
    )
  }

  return (
    <header className="nav">
      <div className="container nav__inner">
        <Logo />
        <div className="nav__spacer" />
        <nav className="nav__links" aria-label="Main">
          <Link className="nav__link" to="/browse">
            Browse
          </Link>
          <a className="nav__link" href="#how-it-works">
            How it works
          </a>
          <Link className="nav__link" to="/safety">
            Safety
          </Link>
        </nav>
        <Link className="btn btn--secondary" to="/login">
          Log in
        </Link>
        <Link className="btn btn--primary" to="/signup">
          Sign up
        </Link>
      </div>
    </header>
  )
}

export default Nav
