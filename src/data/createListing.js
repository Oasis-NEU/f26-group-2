import { supabase } from '../supabaseClient'
import { fileExtension, pathFromPublicUrl } from './storagePaths'

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
  PayPal: 'paypal',
  'Apple Cash': 'apple_cash',
  'Open to trades': 'trade',
}

// Turns database and network errors into something the seller can act on.
// The original error stays on `cause` for debugging.
function readableError(error, verb = 'post') {
  const message = error?.message ?? ''
  if (message.includes('listings a day')) return new Error(message, { cause: error })
  if (message.includes('row-level security')) {
    return new Error(`Your account can’t ${verb} listings right now. Try logging out and back in.`, {
      cause: error,
    })
  }
  return new Error(`Couldn’t ${verb} your listing. Check your connection and try again.`, {
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

// ── Editing ─────────────────────────────────────────────────────────────────

// Database enum values → the Sell form's labels (the reverse of the maps above).
function invert(map) {
  return Object.fromEntries(Object.entries(map).map(([label, value]) => [value, label]))
}
const CATEGORY_LABELS = invert(CATEGORY_VALUES)
const CONDITION_LABELS = invert(CONDITION_VALUES)
const PAYMENT_LABELS = invert(PAYMENT_VALUES)

function centsToPrice(cents) {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2)
}

// Loads one of the user's listings in the Sell form's shape:
// { form, photos: [{ url }] }. Returns null if it doesn't exist or isn't theirs.
export async function fetchListingForEdit(listingId) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('Log in to edit a listing.')

  const { data: row, error } = await supabase
    .from('listings')
    .select(
      'id, seller_id, title, description, price_cents, is_free, category, condition, payment_methods, course_code, campus_area, listing_images(url, position), listing_tags(tags(name))',
    )
    .eq('id', listingId)
    .maybeSingle()
  if (error) throw error
  if (!row || row.seller_id !== session.user.id) return null

  let price = ''
  if (row.is_free) price = '0'
  else if (row.price_cents != null) price = centsToPrice(row.price_cents)

  return {
    form: {
      title: row.title,
      description: row.description,
      price,
      // Older listings can have values the form doesn't offer; those start
      // empty (or, for pickup, as an extra option) so the seller can re-pick.
      category: CATEGORY_LABELS[row.category] ?? '',
      courseCode: row.course_code ?? '',
      condition: CONDITION_LABELS[row.condition] ?? '',
      paymentMethods: row.payment_methods.map((method) => PAYMENT_LABELS[method]).filter(Boolean),
      pickupSpot: row.campus_area,
      tags: row.listing_tags.map((link) => link.tags?.name).filter(Boolean),
    },
    photos: [...row.listing_images]
      .sort((a, b) => a.position - b.position)
      .map((image) => ({ url: image.url })),
  }
}

// Saves changes to a listing. `listing` is a NewListing without photos;
// `photoItems` is the final photo order, each either { url } (an existing
// photo to keep) or { file } (a new one to upload). The first is the cover.
export async function updateListing(listingId, listing, photoItems) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) throw new Error('Log in to edit a listing.')
  const userId = session.user.id

  const isFree = listing.price_cents === 0
  const { data: updated, error } = await supabase
    .from('listings')
    .update({
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
    .eq('id', listingId)
    .select('id')
  if (error) throw readableError(error, 'save')
  // RLS quietly updates nothing when the listing isn't the user's.
  if (!updated.length) throw new Error('You can only edit your own listings.')

  // Photos: upload the new ones, then replace the listing's photo rows with
  // the final order. Rows are swapped as a set because each position can
  // only be used once.
  const { data: oldImages, error: oldError } = await supabase
    .from('listing_images')
    .select('url, position, alt_text')
    .eq('listing_id', listingId)
  if (oldError) throw readableError(oldError, 'save')

  const uploadedPaths = []
  const images = []
  for (const [position, item] of photoItems.entries()) {
    let url = item.url
    if (item.file) {
      // A unique name, so it can't clash with photos already in the folder.
      const path = `${userId}/${listingId}/${Date.now()}-${position}.${fileExtension(item.file)}`
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, item.file, { contentType: item.file.type })
      if (uploadError) {
        if (uploadedPaths.length) await supabase.storage.from(BUCKET).remove(uploadedPaths)
        throw readableError(uploadError, 'save')
      }
      uploadedPaths.push(path)
      url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
    }
    images.push({ listing_id: listingId, url, position, alt_text: listing.title })
  }

  const { error: clearError } = await supabase.from('listing_images').delete().eq('listing_id', listingId)
  if (clearError) {
    if (uploadedPaths.length) await supabase.storage.from(BUCKET).remove(uploadedPaths)
    throw readableError(clearError, 'save')
  }
  if (images.length) {
    const { error: insertError } = await supabase.from('listing_images').insert(images)
    if (insertError) {
      // Put the old photos back so the listing isn't left without any.
      if (oldImages.length) {
        await supabase
          .from('listing_images')
          .insert(oldImages.map((image) => ({ ...image, listing_id: listingId })))
      }
      if (uploadedPaths.length) await supabase.storage.from(BUCKET).remove(uploadedPaths)
      throw readableError(insertError, 'save')
    }
  }

  // Delete the files of photos the seller removed.
  const kept = new Set(images.map((image) => image.url))
  const removedPaths = oldImages
    .filter((image) => !kept.has(image.url))
    .map((image) => pathFromPublicUrl(BUCKET, image.url))
    .filter(Boolean)
  if (removedPaths.length) await supabase.storage.from(BUCKET).remove(removedPaths)

  // Tags: replace the whole set.
  const { error: untagError } = await supabase.from('listing_tags').delete().eq('listing_id', listingId)
  if (untagError) throw readableError(untagError, 'save')
  const tagError = await addTags(listingId, listing.tags)
  if (tagError) throw readableError(tagError, 'save')
}
