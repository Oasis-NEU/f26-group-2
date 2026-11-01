import { Link } from 'react-router'

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
