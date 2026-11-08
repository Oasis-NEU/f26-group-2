import { supabase } from '../supabaseClient'

const BUCKET = 'listing-images'

// Sell form labels (src/data/sellOptions.ts) → database enum values.
const CATEGORY_VALUES = {
  Textbooks: 'textbooks',
  Tickets: 'tickets',
  Electronics: 'electronics',
  Furniture: 'furniture',
  Clothing: 'clothing',
  'Dorm & Kitchen': 'dorm_essentials',
  Other: 'other',
}

const CONDITION_VALUES = {
  New: 'new',
  'Like new': 'like_new',
  Good: 'good',
  Fair: 'fair',
  Old: 'poor',
}

const PAYMENT_VALUES = {
  Cash: 'cash',
  Zelle: 'zelle',
  'Cash App': 'cashapp',
  Venmo: 'venmo',
  'Open to trades': 'trade',
}

function fileExtension(file) {
  const fromName = file.name.includes('.') ? file.name.split('.').pop() : ''
  return (fromName || file.type.split('/')[1] || 'jpg').toLowerCase()
}

// Turns database and network errors into something the seller can act on.
// The original error stays on `cause` for debugging.
function readableError(error) {
  const message = error?.message ?? ''
  if (message.includes('listings a day')) return new Error(message, { cause: error })
  if (message.includes('row-level security')) {
    return new Error('Your account can’t post listings right now. Try logging out and back in.', {
      cause: error,
    })
  }
  return new Error('Couldn’t post your listing. Check your connection and try again.', {
    cause: error,
  })
}

async function uploadPhotos(userId, listingId, listing) {
  const paths = []
  const images = []

  for (const [position, file] of listing.photos.entries()) {
    // Storage policies only allow uploads inside the user's own folder.
    const path = `${userId}/${listingId}/${position}.${fileExtension(file)}`
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type })
    if (error) return { paths, error }

    paths.push(path)
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    images.push({ listing_id: listingId, url: data.publicUrl, position, alt_text: listing.title })
  }

  if (images.length) {
    const { error } = await supabase.from('listing_images').insert(images)
    if (error) return { paths, error }
  }
  return { paths, error: null }
}

async function addTags(listingId, names) {
  if (!names.length) return null

  // Creates tags that don't exist yet and leaves existing ones alone.
  const { error: createError } = await supabase
    .from('tags')
    .upsert(
      names.map((name) => ({ name })),
      { onConflict: 'name', ignoreDuplicates: true },
    )
  if (createError) return createError

  const { data: tags, error: findError } = await supabase.from('tags').select('id').in('name', names)
  if (findError) return findError

  const { error } = await supabase
    .from('listing_tags')
    .insert(tags.map((tag) => ({ listing_id: listingId, tag_id: tag.id })))
  return error
}

// Saves a NewListing (src/types/newListing.ts): the listing row, then its
// photos and tags. If any later step fails, the listing and uploaded photos
// are removed so a half-saved listing never shows up in the feed.
// Returns the new listing's id; throws an Error with a readable message.
export async function createListing(listing) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('Log in to post a listing.')
  const userId = session.user.id

  const isFree = listing.price_cents === 0
  const { data: row, error } = await supabase
    .from('listings')
    .insert({
      seller_id: userId,
      title: listing.title,
      description: listing.description,
      category: CATEGORY_VALUES[listing.category],
      condition: CONDITION_VALUES[listing.condition],
      price_cents: isFree ? null : listing.price_cents,
      is_free: isFree,
      open_to_trade: listing.payment_methods.includes('Open to trades'),
      payment_methods: listing.payment_methods.map((method) => PAYMENT_VALUES[method]),
      course_code: listing.course_code,
      campus_area: listing.pickup_spot,
    })
    .select('id')
    .single()
  if (error) throw readableError(error)

  const photos = await uploadPhotos(userId, row.id, listing)
  const tagError = photos.error ? null : await addTags(row.id, listing.tags)
  const failure = photos.error ?? tagError

  if (failure) {
    // Photos and tag links are removed with the listing (on delete cascade).
    await supabase.from('listings').delete().eq('id', row.id)
    if (photos.paths.length) await supabase.storage.from(BUCKET).remove(photos.paths)
    throw readableError(failure)
  }

  return row.id
}
