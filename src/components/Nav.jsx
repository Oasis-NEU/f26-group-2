import { Link } from 'react-router'
import { MessageCircle } from 'lucide-react'

import { useAuth } from '../auth/AuthContext'
import { useUnreadMessages } from '../hooks/useUnreadMessages'
import { getUserInitials } from '../utils/initials'
import LogoMark from './LogoMark'
import SearchBar from './SearchBar'
import './Nav.css'

function Logo() {
  return (
    <Link className="logo" to="/">
      <LogoMark />
      <span className="logo__name">Husky Exchange</span>
    </Link>
  )
}

// variant="public" is the logged-out landing nav; variant="app" is the
// signed-in nav with search, messages and the user's avatar.
function Nav({ variant = 'public' }) {
  const { user } = useAuth()
  const avatarUrl = user?.user_metadata?.avatar_url
  // Only the signed-in nav has a Messages link to put the dot on.
  const hasUnread = useUnreadMessages(variant === 'app' ? user?.id : null)

  if (variant === 'app') {
    return (
      <header className="nav">
        <div className="container nav__inner nav__inner--app">
          <Logo />
          <div className="nav__search">
            <SearchBar size="compact" />
          </div>
          <Link className="nav__link nav__link--hide-mobile" to="/dashboard">
            Dashboard
          </Link>
          <Link className="nav__link nav__link--hide-mobile nav__messages" to="/messages">
            Messages
            {hasUnread && (
              <>
                <span className="nav__dot" aria-hidden="true" />
                <span className="visually-hidden">, new messages</span>
              </>
            )}
          </Link>
          {/* Phones get an icon instead of the text link. */}
          <Link
            className="nav__icon-link"
            to="/messages"
            aria-label={hasUnread ? 'Messages, new messages' : 'Messages'}
          >
            <MessageCircle size={22} aria-hidden="true" />
            {hasUnread && <span className="nav__dot nav__dot--icon" aria-hidden="true" />}
          </Link>
          <Link className="btn btn--primary" to="/sell">
            Sell
          </Link>
          {/* Log out lives on the profile page. */}
          <Link className="nav__avatar" to="/profile" aria-label="Your profile">
            {avatarUrl ? <img src={avatarUrl} alt="" /> : getUserInitials(user)}
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
