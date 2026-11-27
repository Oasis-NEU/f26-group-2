import logo from '../assets/logo.svg'
import './LogoMark.css'

// The NU Exchange logo on a light rounded tile. The logo artwork is dark ink,
// so it needs the light tile to show up on the dark theme.
// Decorative (alt=""): it always sits next to the "NU Exchange" name.
function LogoMark({ size = 'default' }) {
  return (
    <span className={`logo-mark logo-mark--${size}`}>
      <img className="logo-mark__img" src={logo} alt="" />
    </span>
  )
}

export default LogoMark
