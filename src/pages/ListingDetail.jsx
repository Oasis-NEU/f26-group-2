import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import { useAuth } from '../auth/AuthContext'
import Nav from '../components/Nav'
import ShareButton from '../components/ShareButton'
import { fetchListing } from '../data/listings'
import { pickupMapFor } from '../data/pickupLocations'
import { ONLINE_PICKUP } from '../data/sellOptions'
import './ListingDetail.css'

const STATUS_NOTES = {
  pending: 'This listing is marked as pending. Buyers can’t see it in the feed.',
  sold: 'This listing is sold. Buyers can’t see it in the feed.',
}

function initialsOf(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

function Gallery({ images, category }) {
  const [active, setActive] = useState(0)

  if (!images.length) {
    return (
      <div className="gallery">
        <div className="gallery__main gallery__main--empty">
          <span>{category}</span>
          <span className="gallery__empty-note">No photos</span>
        </div>
      </div>
    )
  }

  const current = images[active]

  return (
    <div className="gallery">
      <div className="gallery__main">
        <img src={current.url} alt={current.alt} />
        {images.length > 1 && (
          <span className="gallery__count" aria-hidden="true">
            {active + 1} / {images.length}
          </span>
        )}
      </div>

      {images.length > 1 && (
        <ul className="gallery__thumbs" aria-label="Photos">
          {images.map((image, index) => (
            <li key={image.url}>
              <button
                className={`gallery__thumb${index === active ? ' gallery__thumb--active' : ''}`}
                type="button"
                aria-label={`Show photo ${index + 1} of ${images.length}`}
                aria-pressed={index === active}
                onClick={() => setActive(index)}
              >
                <img src={image.url} alt="" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function PickupMap({ spot }) {
  const map = pickupMapFor(spot)

  if (spot === ONLINE_PICKUP) {
    return (
      <section className="detail__card" aria-labelledby="pickup-heading">
        <h2 className="detail__section-title" id="pickup-heading">
          Delivery
        </h2>
        <p className="pickup__name">{spot}</p>
        <p className="detail__muted">
          No meetup needed. Message the seller to arrange the transfer, and don’t pay until you’ve
          received it.
        </p>
      </section>
    )
  }

  return (
    <section className="detail__card" aria-labelledby="pickup-heading">
      <h2 className="detail__section-title" id="pickup-heading">
        Pickup spot
      </h2>
      <p className="pickup__name">{spot}</p>

      {map ? (
        <>
          <iframe
            className="pickup__map"
            title={`Map of ${spot}`}
            src={map.embedUrl}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <p className="pickup__links">
            <a href={map.googleUrl} target="_blank" rel="noreferrer">
              Open in Google Maps<span className="visually-hidden"> (opens in a new tab)</span>
            </a>
            <a href={map.appleUrl} target="_blank" rel="noreferrer">
              Open in Apple Maps<span className="visually-hidden"> (opens in a new tab)</span>
            </a>
          </p>
        </>
      ) : (
        <p className="detail__muted">Message the seller to agree on a spot on campus.</p>
      )}
    </section>
  )
}

function SellerCard({ seller }) {
  if (!seller) return null

  const about = [seller.affiliation, seller.grad_year && `Class of ${seller.grad_year}`]
    .filter(Boolean)
    .join(' · ')

  return (
    <section className="detail__card seller" aria-labelledby="seller-heading">
      <h2 className="detail__section-title" id="seller-heading">
        Seller
      </h2>
      <div className="seller__row">
        {seller.avatar_url ? (
          <img className="seller__avatar" src={seller.avatar_url} alt="" />
        ) : (
          <span className="seller__avatar" aria-hidden="true">
            {initialsOf(seller.name)}
          </span>
        )}
        <div className="seller__info">
          <p className="seller__name">{seller.name}</p>
          {about && <p className="seller__meta">{about}</p>}
          <p className="seller__meta">Member since {seller.member_since}</p>
          <p className="seller__meta">No reviews yet</p>
        </div>
      </div>
    </section>
  )
}

function ListingDetail() {
  const { id } = useParams()
  const { user } = useAuth()

  // Remembers which id the result belongs to, so moving to another listing
  // shows "Loading…" until that listing's result arrives.
  const [result, setResult] = useState({ id: null, listing: null, failed: false })
  const listing = result.listing
  const loadState =
    result.id !== id ? 'loading' : result.failed ? 'error' : listing ? 'ready' : 'not-found'

  useEffect(() => {
    // Ignore a slow response if the user has already moved to another listing.
    let ignore = false

    fetchListing(id)
      .then((found) => {
        if (!ignore) setResult({ id, listing: found, failed: false })
      })
      .catch((error) => {
        if (ignore) return
        console.error(error)
        setResult({ id, listing: null, failed: true })
      })

    return () => {
      ignore = true
    }
  }, [id])

  return (
    <>
      <Nav variant="app" />

      <main className="container detail">
        <Link className="detail__back" to="/browse">
          ← Back to listings
        </Link>

        {loadState === 'loading' ? (
          <p className="detail__message">Loading listing…</p>
        ) : loadState === 'not-found' ? (
          <section className="detail__card detail__empty">
            <h1 className="detail__empty-title">Listing not found</h1>
            <p className="detail__muted">It may have been sold or removed, or the link is wrong.</p>
            <Link className="btn btn--primary" to="/browse">
              Browse listings
            </Link>
          </section>
        ) : loadState === 'error' ? (
          <section className="detail__card detail__empty">
            <h1 className="detail__empty-title">Couldn’t load this listing</h1>
            <p className="detail__muted">Check your connection and refresh the page to try again.</p>
          </section>
        ) : (
          <ListingView listing={listing} isOwner={user?.id === listing.seller_id} />
        )}
      </main>
    </>
  )
}

function ListingView({ listing, isOwner }) {
  const statusNote = isOwner && STATUS_NOTES[listing.status]

  return (
    <div className="detail__layout">
      <Gallery key={listing.id} images={listing.images} category={listing.category} />

      <div className="detail__info">
        {statusNote && <p className="detail__status">{statusNote}</p>}

        <section className="detail__card" aria-labelledby="listing-title">
          <div className="detail__price-row">
            <p className="detail__price">{listing.price_label}</p>
            <ShareButton listing={listing} className="detail__share" />
          </div>
          <h1 className="detail__title" id="listing-title">
            {listing.title}
          </h1>
          <ul className="detail__pills" aria-label="Item details">
            <li className="pill">{listing.condition}</li>
            <li className="pill">{listing.category}</li>
            {listing.course_code && <li className="pill">{listing.course_code}</li>}
          </ul>

          <dl className="detail__facts">
            <div>
              <dt>{listing.pickup_spot === ONLINE_PICKUP ? 'Delivery' : 'Pickup spot'}</dt>
              <dd>{listing.pickup_spot}</dd>
            </div>
            <div>
              <dt>Posted</dt>
              <dd>{listing.posted_ago}</dd>
            </div>
            <div>
              <dt>Payment</dt>
              <dd>
                {[...listing.payment_methods, listing.open_to_trade && 'Open to trade']
                  .filter(Boolean)
                  .join(', ') || 'Ask the seller'}
              </dd>
            </div>
          </dl>

          {isOwner ? (
            <div className="detail__actions">
              <Link className="btn btn--primary" to={`/listings/${listing.id}/edit`}>
                Edit listing
              </Link>
              <Link className="btn btn--secondary" to="/dashboard">
                Manage in dashboard
              </Link>
              <p className="detail__muted detail__note">
                This is your listing. Change its status or delete it from your dashboard.
              </p>
            </div>
          ) : (
            <div className="detail__actions">
              {/* Opens the existing conversation about this listing if there is one. */}
              <Link className="btn btn--primary" to={`/messages/new/${listing.id}`}>
                Message seller
              </Link>
              {listing.open_to_trade && (
                <button className="btn btn--secondary" type="button" disabled>
                  Offer a trade
                </button>
              )}
              <p className="detail__muted detail__note">
                Meet in a public spot on campus and never share your address.
              </p>
            </div>
          )}
        </section>

        {listing.description && (
          <section className="detail__card" aria-labelledby="description-heading">
            <h2 className="detail__section-title" id="description-heading">
              Description
            </h2>
            <p className="detail__description">{listing.description}</p>
          </section>
        )}

        <PickupMap spot={listing.pickup_spot} />

        <SellerCard seller={listing.seller} />

        {/* Kept small and away from the buying actions on purpose. */}
        {!isOwner && (
          <button className="detail__report" type="button" disabled>
            Report this listing
          </button>
        )}
      </div>
    </div>
  )
}

export default ListingDetail
