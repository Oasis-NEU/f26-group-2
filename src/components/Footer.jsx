import { Link } from 'react-router'

import LogoMark from './LogoMark'
import './Footer.css'

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div className="footer__brand">
          <LogoMark size="small" />
          <p className="footer__note">
            © 2026 Husky Exchange · Student project, not an official Northeastern University service.
          </p>
        </div>
        <nav className="footer__links" aria-label="Footer">
          <Link to="/about">About</Link>
          <Link to="/terms">Terms and conditions</Link>
          <Link to="/help">Help</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </div>
    </footer>
  )
}

export default Footer
