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
  trade: 'Open to trade',
}

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
    posted_ago: timeAgo(row.created_at),
    image_url: cover?.url,
  }
}

// Active listings, newest first. RLS only returns rows to signed-in users.
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
