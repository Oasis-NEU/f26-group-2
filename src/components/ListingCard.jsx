import { Link } from 'react-router'

import './ListingCard.css'

function formatPrice(cents) {
  if (cents === 0) return 'Free'
  return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

function ListingCard({ listing }) {
  const tradeOk = listing.payment_methods?.includes('Open to trade')

  return (
    <Link className="listing-card" to={`/listings/${listing.id}`}>
      <div className="listing-card__thumb">
        {listing.image_url ? (
          <img src={listing.image_url} alt="" />
        ) : (
          <span className="listing-card__placeholder">{listing.category}</span>
        )}
        {tradeOk && <span className="listing-card__badge">Trade OK</span>}
      </div>
      <div className="listing-card__body">
        <p className="listing-card__price">{formatPrice(listing.price_cents)}</p>
        <p className="listing-card__title">{listing.title}</p>
        <p className="listing-card__meta">
          {listing.location_label} · {listing.posted_ago}
        </p>
      </div>
    </Link>
  )
}

export default ListingCard
