import { useState } from 'react'
import { useNavigate } from 'react-router'

import searchIcon from '../assets/search-icon.svg'
import './SearchBar.css'

function SearchBar({ size = 'large', defaultValue = '' }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState(defaultValue)

  function handleSubmit(event) {
    event.preventDefault()
    const q = query.trim()
    navigate(q ? `/browse?q=${encodeURIComponent(q)}` : '/browse')
  }

  return (
    <form className={`search-bar search-bar--${size}`} role="search" onSubmit={handleSubmit}>
      <img className="search-bar__icon" src={searchIcon} alt="" width="14" height="14" />
      <label className="visually-hidden" htmlFor={`search-${size}`}>
        Search listings
      </label>
      <input
        id={`search-${size}`}
        className="search-bar__input"
        type="search"
        placeholder="Search for textbooks, furniture, tickets…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <button className="search-bar__button" type="submit">
        Search
      </button>
    </form>
  )
}

export default SearchBar
