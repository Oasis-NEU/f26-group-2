import { Link } from 'react-router'

import { useAuth } from '@/auth/AuthContext'
import { cn } from '@/lib/utils'

function formatPrice(cents) {
  if (cents === 0) return 'Free'
  return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

/**
 * Listing card — photo (4:3), price, title (2 lines max), condition, area, time ago.
 * States: default, hover (border + photo zoom), sold (`status: 'sold'` → greyed, "Sold" label).
 */
function ListingCard({ listing, className }) {
  const { session } = useAuth()
  const sold = listing.status === 'sold'
  const tradeOk = !sold && listing.payment_methods?.includes('Open to trade')

  // Details are members-only, so logged-out visitors go to log in instead.
  return (
    <Link
      to={session ? `/listings/${listing.id}` : '/login'}
      aria-label={sold ? `${listing.title} (sold)` : undefined}
      className={cn(
        'group flex min-w-0 flex-col gap-2 rounded-card border border-transparent bg-card p-2 text-foreground transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        sold ? 'opacity-60' : 'hover:border-border-strong',
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-control bg-muted">
        {listing.image_url ? (
          <img
            src={listing.image_url}
            alt=""
            loading="lazy"
            className={cn(
              'block size-full object-cover transition-transform duration-300',
              sold ? 'grayscale' : 'group-hover:scale-[1.03]',
            )}
          />
        ) : (
          <span className="flex size-full items-center justify-center text-small text-muted-foreground">
            {listing.category}
          </span>
        )}

        {sold && (
          <span className="absolute top-2 left-2 rounded-full bg-success px-2 py-1 text-small text-white">
            Sold
          </span>
        )}
        {tradeOk && (
          <span className="absolute right-2 bottom-2 rounded-full bg-foreground px-2 py-1 text-small text-background">
            Trade OK
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 px-1 pb-1 [overflow-wrap:anywhere]">
        <p className={cn('text-price', sold && 'text-muted-foreground line-through')}>
          {formatPrice(listing.price_cents)}
        </p>
        <p className="line-clamp-2 text-sm leading-5">{listing.title}</p>
        <p className="truncate text-small text-muted-foreground">
          {[listing.condition, listing.location_label, listing.posted_ago]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
    </Link>
  )
}

export default ListingCard
