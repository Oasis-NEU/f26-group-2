import { supabase } from '../supabaseClient'
import { coverOf, findConversationId, priceLabel } from './messages'

// Trade offers on "Open to trades" listings. Making, accepting, declining, or
// withdrawing an offer posts a message into the buyer and seller's
// conversation; the database does that (trade_offers_in_messages migration).

export const MAX_OFFER_DESCRIPTION = 1000 // trade_offers_description_check
export const MAX_DECLINE_NOTE = 500 // trade_offers_response_note_check
export const MAX_OFFER_CASH_CENTS = 1000000 // $10,000; just a sanity limit

// The text the database sends when a seller declines without a note.
export const DEFAULT_DECLINE_BODY = 'Declined your trade offer.'

function readableError(error, fallback) {
  // Database rules raise messages written for users (P0001).
  if (error?.code === 'P0001') return new Error(error.message, { cause: error })
  if (error?.code === '23505') {
    return new Error(
      'You already have an offer waiting on this listing. Withdraw it in Messages to make a new one.',
      { cause: error },
    )
  }
  return new Error(fallback, { cause: error })
}

// Your active listings you could offer in a trade (not the one you're offering on).
export async function fetchListingsToOffer(userId, excludeListingId) {
  const { data, error } = await supabase
    .from('listings')
    .select('id, title, price_cents, is_free, listing_images(url, position)')
    .eq('seller_id', userId)
    .eq('status', 'active')
    .neq('id', excludeListingId)
    .order('created_at', { ascending: false })
  if (error) throw readableError(error, 'Couldn’t load your listings.')

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    price_label: priceLabel(row),
    cover_url: coverOf(row),
  }))
}

// Your offer on this listing that's still waiting for an answer, with the
// conversation it's in, or null.
export async function fetchMyPendingOffer(listingId, userId) {
  const { data, error } = await supabase
    .from('trade_offers')
    .select('id')
    .eq('listing_id', listingId)
    .eq('from_user_id', userId)
    .eq('status', 'pending')
    .maybeSingle()
  if (error) throw readableError(error, 'Couldn’t check your offers.')
  if (!data) return null
  return { id: data.id, conversation_id: await findConversationId(listingId, userId) }
}

// Sends an offer and returns the id of the conversation it was posted in.
export async function makeTradeOffer({ listingId, userId, offeredListingId, description, cashCents }) {
  const { error } = await supabase.from('trade_offers').insert({
    listing_id: listingId,
    from_user_id: userId,
    offered_listing_id: offeredListingId || null,
    description: description.trim() || null,
    cash_cents: cashCents,
  })
  if (error) throw readableError(error, 'Couldn’t send your offer. Try again.')
  return findConversationId(listingId, userId)
}

// Seller: 'accepted' or 'declined' (with an optional note). Buyer: 'withdrawn'.
export async function respondToOffer(offerId, status, note = '') {
  const changes = { status }
  if (status === 'declined') changes.response_note = note.trim() || null

  const { data, error } = await supabase
    .from('trade_offers')
    .update(changes)
    .eq('id', offerId)
    .select('id, status')
    .maybeSingle()
  if (error) throw readableError(error, 'Couldn’t update the offer. Try again.')
  if (!data) throw new Error('This offer isn’t available anymore. Refresh the page.')
  return data
}

// "$10" or "$10.50".
export function formatCash(cents) {
  return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}
