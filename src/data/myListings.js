import { supabase } from '../supabaseClient'
import { pathFromPublicUrl } from './storagePaths'

const LISTING_BUCKET = 'listing-images'

// The seller dashboard's data: the signed-in user's own listings.

// Everything the user is selling or has sold, newest first.
export async function fetchMyListings(userId) {
  const { data, error } = await supabase
    .from('listings')
    .select(
      'id, title, price_cents, is_free, status, campus_area, created_at, sold_at, listing_images(url, position)',
    )
    .eq('seller_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error

  return data.map((row) => {
    const images = [...row.listing_images].sort((a, b) => a.position - b.position)
    return { ...row, cover_url: images[0]?.url ?? null, image_urls: images.map((image) => image.url) }
  })
}

export async function removeListingPhotos(urls) {
  const paths = urls.map((url) => pathFromPublicUrl(LISTING_BUCKET, url)).filter(Boolean)
  if (paths.length) await supabase.storage.from(LISTING_BUCKET).remove(paths)
}

// Moves a listing between active, pending, and sold. The database fills in
// sold_at when it's sold and clears it when it's reopened. It refuses to
// reopen a sale that already has a review, with a message we can show as is.
export async function updateListingStatus(id, status) {
  const { data, error } = await supabase
    .from('listings')
    .update({ status })
    .eq('id', id)
    .select('id, status, sold_at')
    .maybeSingle()

  if (error) {
    // P0001 = a message raised on purpose by a database rule, written for users.
    if (error.code === 'P0001') throw new Error(error.message)
    throw error
  }
  if (!data) throw new Error('We couldn’t find that listing, or it isn’t yours.')
  return data
}

// Deletes one listing and its photos. The database refuses to delete sold
// listings (they keep the buyer's review history), so this throws for those.
export async function deleteListing(listing) {
  const { data, error } = await supabase.from('listings').delete().eq('id', listing.id).select('id')
  if (error) throw error
  if (!data.length) throw new Error('This listing can’t be deleted. Sold listings stay on record.')
  await removeListingPhotos(listing.image_urls)
}
