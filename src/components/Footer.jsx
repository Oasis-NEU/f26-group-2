import { Link } from 'react-router'

import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <p className="footer__note">
          © 2026 NU Exchange · Student project, not an official Northeastern University service.
        </p>
        <nav className="footer__links" aria-label="Footer">
          <Link to="/about">About</Link>
          <Link to="/safety">Safety</Link>
          <Link to="/help">Help</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </div>
    </footer>
  )
}

export default Footer
