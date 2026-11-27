import { supabase } from '../supabaseClient'

// Database enum values → the labels the feed filters and cards use.
const CATEGORY_LABELS = {
  textbooks: 'Textbooks',
  furniture: 'Furniture',
  electronics: 'Electronics',
  appliances: 'Appliances',
  clothing: 'Clothing',
  tickets: 'Tickets',
  dorm_essentials: 'Dorm essentials',
  other: 'Other',
}

const CONDITION_LABELS = {
  new: 'New',
  like_new: 'Like new',
  good: 'Good',
  fair: 'Fair',
  poor: 'Old',
}

const PAYMENT_LABELS = {
  cash: 'Cash',
  venmo: 'Venmo',
  zelle: 'Zelle',
  cashapp: 'Cash App',
  paypal: 'PayPal',
  apple_cash: 'Apple Cash',
  trade: 'Open to trade',
}

const AFFILIATION_LABELS = {
  student: 'Student',
  alum: 'Alum',
}

// Listing ids are UUIDs. Anything else can't match a row, and Postgres
// rejects it with an error instead of returning nothing.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function timeAgo(date) {
  const minutes = Math.floor((Date.now() - new Date(date)) / 60000)
  if (minutes < 60) return `${Math.max(minutes, 1)}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

// Shapes a database row like the objects in sampleListings.js so the
// existing cards and filters work unchanged.
function toCard(row) {
  const payments = row.payment_methods.map((method) => PAYMENT_LABELS[method])
  if (row.open_to_trade && !payments.includes('Open to trade')) payments.push('Open to trade')
  const cover = [...row.listing_images].sort((a, b) => a.position - b.position)[0]

  return {
    id: row.id,
    title: row.title,
    price_cents: row.is_free ? 0 : row.price_cents,
    category: CATEGORY_LABELS[row.category],
    condition: CONDITION_LABELS[row.condition],
    payment_methods: payments,
    pickup_spot: row.campus_area,
    location_label: row.campus_area,
    created_at: row.created_at,
    posted_ago: timeAgo(row.created_at),
    image_url: cover?.url,
  }
}

// Active listings, newest first. Works logged out too, but only for the
// columns selected here: the database blocks logged-out users from reading
// any other listing column. Add a column here and it must also be granted
// to anon in a migration, or the feed breaks for visitors.
export async function fetchListings() {
  const { data, error } = await supabase
    .from('listings')
    .select(
      'id, title, price_cents, is_free, category, condition, payment_methods, open_to_trade, campus_area, created_at, listing_images(url, position)',
    )
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data.map(toCard)
}

function formatPrice(row) {
  if (row.is_free) return 'Free'
  if (row.price_cents === null) return 'Trade only'
  return `$${(row.price_cents / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

// Shapes a database row for the listing detail page.
function toDetail(row) {
  const images = [...row.listing_images].sort((a, b) => a.position - b.position)
  const seller = row.seller

  return {
    id: row.id,
    seller_id: row.seller_id,
    status: row.status,
    title: row.title,
    description: row.description,
    price_label: formatPrice(row),
    category: CATEGORY_LABELS[row.category],
    condition: CONDITION_LABELS[row.condition],
    course_code: row.course_code,
    pickup_spot: row.campus_area,
    posted_ago: timeAgo(row.created_at),
    // "Open to trade" is stored as its own flag, so it's shown separately.
    payment_methods: row.payment_methods
      .filter((method) => method !== 'trade')
      .map((method) => PAYMENT_LABELS[method]),
    open_to_trade: row.open_to_trade || row.payment_methods.includes('trade'),
    images: images.map((image, index) => ({
      url: image.url,
      alt: image.alt_text ? `${image.alt_text}, photo ${index + 1}` : `Photo ${index + 1}`,
    })),
    seller: seller && {
      name: seller.display_name,
      avatar_url: seller.avatar_url,
      affiliation: AFFILIATION_LABELS[seller.affiliation],
      grad_year: seller.grad_year,
      member_since: new Date(seller.created_at).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      }),
    },
  }
}

// One listing with its photos and seller, for /listings/:id. Tags aren't
// loaded: they're for search, not shown on the page.
// Returns null when the listing doesn't exist or this user can't see it
// (sold, deleted, or a bad link). Members only: logged-out visitors can't
// read these columns.
export async function fetchListing(id) {
  if (!UUID_PATTERN.test(id)) return null

  const { data, error } = await supabase
    .from('listings')
    .select(
      `id, seller_id, status, title, description, price_cents, is_free, category, condition,
       payment_methods, open_to_trade, course_code, campus_area, created_at,
       listing_images(url, position, alt_text),
       seller:users!listings_seller_id_fkey(display_name, avatar_url, affiliation, grad_year, created_at)`,
    )
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data && toDetail(data)
}
