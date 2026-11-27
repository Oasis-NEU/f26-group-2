import { BadgeCheck, Star } from 'lucide-react'

import { cn } from '@/lib/utils'
import { getInitials } from '@/utils/initials'

/**
 * Seller badge — avatar, name, verified check, star rating, review count.
 *   <SellerBadge name="Maya Patel" verified rating={4.8} reviewCount={12} memberSince="2025" />
 */
function SellerBadge({
  name,
  avatarUrl,
  verified = false,
  rating,
  reviewCount = 0,
  memberSince,
  className,
}) {
  const hasReviews = reviewCount > 0 && rating != null

  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="" className="block size-10 shrink-0 rounded-full object-cover" />
      ) : (
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-avatar text-small text-foreground"
        >
          {getInitials(name)}
        </span>
      )}

      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="flex items-center gap-1 text-[15px] font-semibold">
          <span className="truncate">{name}</span>
          {verified && (
            <BadgeCheck
              className="size-4 shrink-0 text-success"
              role="img"
              aria-label="Verified Northeastern student"
            />
          )}
        </p>
        <p className="flex flex-wrap items-center gap-1 text-small text-muted-foreground">
          {hasReviews ? (
            <>
              <Star className="size-3.5 fill-warning text-warning" aria-hidden="true" />
              <span className="text-foreground">{rating.toFixed(1)}</span>
              <span>
                ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
              </span>
            </>
          ) : (
            <span>No reviews yet</span>
          )}
          {memberSince && <span>· Member since {memberSince}</span>}
        </p>
      </div>
    </div>
  )
}

export default SellerBadge
