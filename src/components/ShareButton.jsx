import { Share2 } from 'lucide-react'
import { toast } from 'sonner'

// The link anyone can open to see a listing. Logged-out visitors are sent to
// log in first, then straight back to it (see RequireAuth and Login).
function listingUrl(id) {
  return `${window.location.origin}/listings/${id}`
}

// Phones open the system share sheet (Messages, Instagram, …). Elsewhere, or
// if that isn't available, the link is copied.
function prefersShareSheet() {
  return Boolean(navigator.share) && window.matchMedia('(pointer: coarse)').matches
}

async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url)
    toast.success('Link copied. Paste it anywhere to share this listing.')
  } catch {
    // Clipboard blocked (old browser or no permission): show the link instead.
    window.prompt('Copy this link to share the listing:', url)
  }
}

function ShareButton({ listing, className = '' }) {
  async function handleShare() {
    const url = listingUrl(listing.id)

    if (prefersShareSheet()) {
      try {
        await navigator.share({ title: listing.title, text: `${listing.title} on Husky Exchange`, url })
        return
      } catch (error) {
        if (error.name === 'AbortError') return // They closed the share sheet.
      }
    }
    await copyLink(url)
  }

  return (
    <button className={`btn btn--secondary share-button ${className}`.trim()} type="button" onClick={handleShare}>
      <Share2 aria-hidden="true" />
      Share
    </button>
  )
}

export default ShareButton
