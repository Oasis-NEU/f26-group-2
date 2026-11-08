import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'

import ListingCard from '../components/ListingCard'
import Nav from '../components/Nav'
import { fetchListings } from '../data/listings'
import { CATEGORIES, CONDITIONS, PAYMENT_METHODS, PICKUP_SPOTS } from '../data/sampleListings'
import { supabase } from '../supabaseClient'
import './HomeFeed.css'

const SORTS = {
  newest: 'Newest first',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
}

function toggle(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

function CheckboxGroup({ legend, options, selected, onChange }) {
  return (
    <fieldset className="filter-group">
      <legend className="filter-group__label">{legend}</legend>
      {options.map((option) => (
        <label key={option} className="checkbox">
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={() => onChange(toggle(selected, option))}
          />
          <span className="checkbox__box" aria-hidden="true" />
          {option}
        </label>
      ))}
    </fieldset>
  )
}

function HomeFeed() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('category') ?? 'All'
  const query = searchParams.get('q') ?? ''

  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [conditions, setConditions] = useState([])
  const [payments, setPayments] = useState([])
  const [pickups, setPickups] = useState([])
  const [sort, setSort] = useState('newest')

  const [allListings, setAllListings] = useState([])
  // 'loading' | 'ready' | 'signed-out' | 'error'
  const [loadState, setLoadState] = useState('loading')

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setLoadState('signed-out')
        return
      }

      try {
        setAllListings(await fetchListings())
        setLoadState('ready')
      } catch (error) {
        console.error(error)
        setLoadState('error')
      }
    }

    load()
  }, [])

  function selectCategory(next) {
    const params = new URLSearchParams(searchParams)
    if (next === 'All') params.delete('category')
    else params.set('category', next)
    setSearchParams(params)
  }

  const listings = useMemo(() => {
    const q = query.toLowerCase()
    const min = minPrice === '' ? null : Number(minPrice) * 100
    const max = maxPrice === '' ? null : Number(maxPrice) * 100

    const filtered = allListings.filter((listing) => {
      if (category === 'Free' ? listing.price_cents !== 0 : category !== 'All' && listing.category !== category) return false
      if (q && !listing.title.toLowerCase().includes(q)) return false
      if (min !== null && listing.price_cents < min) return false
      if (max !== null && listing.price_cents > max) return false
      if (conditions.length && !conditions.includes(listing.condition)) return false
      if (payments.length && !payments.some((p) => listing.payment_methods.includes(p))) return false
      if (pickups.length && !pickups.includes(listing.pickup_spot)) return false
      return true
    })

    if (sort === 'price-asc') return [...filtered].sort((a, b) => a.price_cents - b.price_cents)
    if (sort === 'price-desc') return [...filtered].sort((a, b) => b.price_cents - a.price_cents)
    return filtered
  }, [allListings, category, query, minPrice, maxPrice, conditions, payments, pickups, sort])

  return (
    <>
      <Nav variant="app" />

      <div className="container chips-row" role="toolbar" aria-label="Categories">
        {['All', ...CATEGORIES].map((name) => (
          <button
            key={name}
            type="button"
            className={`chip${category === name ? ' chip--active' : ''}`}
            aria-pressed={category === name}
            onClick={() => selectCategory(name)}
          >
            {name}
          </button>
        ))}
      </div>

      <main className="container feed-layout">
        <details className="filters" open>
          <summary className="filters__title">Filters</summary>

          <fieldset className="filter-group">
            <legend className="filter-group__label">Price</legend>
            <div className="price-inputs">
              <label className="visually-hidden" htmlFor="price-min">
                Minimum price
              </label>
              <input
                id="price-min"
                className="text-input"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="Min"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
              />
              <label className="visually-hidden" htmlFor="price-max">
                Maximum price
              </label>
              <input
                id="price-max"
                className="text-input"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="Max"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
              />
            </div>
          </fieldset>

          <CheckboxGroup
            legend="Condition"
            options={CONDITIONS}
            selected={conditions}
            onChange={setConditions}
          />
          <CheckboxGroup
            legend="Payment"
            options={PAYMENT_METHODS}
            selected={payments}
            onChange={setPayments}
          />
          <CheckboxGroup
            legend="Pickup location"
            options={PICKUP_SPOTS}
            selected={pickups}
            onChange={setPickups}
          />
        </details>

        <section className="feed" aria-label="Listings">
          <div className="feed__head">
            <p className="feed__count">
              {listings.length} {listings.length === 1 ? 'listing' : 'listings'}
            </p>
            <label className="visually-hidden" htmlFor="sort">
              Sort by
            </label>
            <select
              id="sort"
              className="sort-select"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
            >
              {Object.entries(SORTS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {loadState === 'loading' ? (
            <p className="feed__empty">Loading listings…</p>
          ) : loadState === 'signed-out' ? (
            <p className="feed__empty">
              <Link to="/login">Log in</Link> with your Northeastern email to see listings.
            </p>
          ) : loadState === 'error' ? (
            <p className="feed__empty">Couldn't load listings. Refresh the page to try again.</p>
          ) : listings.length ? (
            <div className="listing-grid">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <p className="feed__empty">No listings match these filters.</p>
          )}
        </section>
      </main>
    </>
  )
}

export default HomeFeed
