import { supabase } from '../supabaseClient'

// Chat data: conversations (one per buyer per listing) and their messages.
// The database does the protecting: only the buyer and seller can read or
// send, conversations only start on active listings, blocked users can't
// message each other, and sending is rate-limited (see the chat triggers in
// supabase/migrations).

export const MAX_MESSAGE_LENGTH = 2000 // messages_body_check

// How many of the newest messages a conversation loads at first.
const MESSAGE_PAGE = 200

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const PERSON = 'display_name, avatar_url'
const LISTING = 'id, title, price_cents, is_free, open_to_trade, status, listing_images(url, position)'

// Database rules raise errors written for users (code P0001), so those are
// shown as is. Anything else gets a general message; the original stays on
// `cause` for debugging.
function readableError(error, fallback) {
  if (error?.code === 'P0001') return new Error(error.message, { cause: error })
  return new Error(fallback, { cause: error })
}

export function coverOf(listing) {
  const images = [...(listing?.listing_images ?? [])].sort((a, b) => a.position - b.position)
  return images[0]?.url ?? null
}

export function priceLabel(listing) {
  if (listing.is_free) return 'Free'
  if (listing.price_cents === null) return 'Trade only'
  return `$${(listing.price_cents / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

// Shapes a conversation row from the signed-in user's point of view.
function toConversation(row, userId) {
  const iAmBuyer = row.buyer_id === userId
  const other = (iAmBuyer ? row.seller : row.buyer) ?? null

  return {
    id: row.id,
    role: iAmBuyer ? 'buyer' : 'seller',
    other_name: other?.display_name ?? 'Husky Exchange member',
    other_avatar_url: other?.avatar_url ?? null,
    last_message_at: row.last_message_at,
    listing: row.listing && {
      id: row.listing.id,
      title: row.listing.title,
      status: row.listing.status,
      price_label: priceLabel(row.listing),
      cover_url: coverOf(row.listing),
    },
  }
}

// The signed-in user's conversations, most recent first, each with its last
// message and how many messages they haven't read yet.
export async function fetchInbox(userId) {
  const { data, error } = await supabase
    .from('conversations')
    .select(
      `id, buyer_id, seller_id, last_message_at,
       listing:listings(${LISTING}),
       buyer:users!conversations_buyer_id_fkey(${PERSON}),
       seller:users!conversations_seller_id_fkey(${PERSON}),
       messages(body, sender_id, created_at)`,
    )
    // Admins can read every conversation; the inbox is only your own.
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('last_message_at', { ascending: false })
    .order('created_at', { referencedTable: 'messages', ascending: false })
    .limit(1, { referencedTable: 'messages' })
  if (error) throw readableError(error, 'Couldn’t load your messages.')

  // Only conversations with at least one message (a buyer who never sent
  // anything shouldn't show up in the seller's inbox).
  const rows = data.filter((row) => row.messages.length)
  const unread = await fetchUnreadCounts(
    userId,
    rows.map((row) => row.id),
  )

  return rows.map((row) => {
    const last = row.messages[0]
    return {
      ...toConversation(row, userId),
      last_message: { body: last.body, from_me: last.sender_id === userId, created_at: last.created_at },
      unread_count: unread[row.id] ?? 0,
    }
  })
}

// conversation id → number of messages from the other person not yet read.
async function fetchUnreadCounts(userId, conversationIds) {
  if (!conversationIds.length) return {}
  const { data, error } = await supabase
    .from('messages')
    .select('conversation_id')
    .in('conversation_id', conversationIds)
    .neq('sender_id', userId)
    .is('read_at', null)
  if (error) throw readableError(error, 'Couldn’t load your messages.')

  const counts = {}
  for (const { conversation_id: id } of data) counts[id] = (counts[id] ?? 0) + 1
  return counts
}

// One conversation, or null when it doesn't exist or isn't yours.
export async function fetchConversation(id, userId) {
  if (!UUID_PATTERN.test(id)) return null

  const { data, error } = await supabase
    .from('conversations')
    .select(
      `id, buyer_id, seller_id, last_message_at,
       listing:listings(${LISTING}),
       buyer:users!conversations_buyer_id_fkey(${PERSON}),
       seller:users!conversations_seller_id_fkey(${PERSON})`,
    )
    .eq('id', id)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .maybeSingle()
  if (error) throw readableError(error, 'Couldn’t load this conversation.')
  return data && toConversation(data, userId)
}

// What a buyer needs before their first message: the listing and seller.
// Returns null when the listing doesn't exist or isn't visible.
export async function fetchListingForNewConversation(listingId) {
  if (!UUID_PATTERN.test(listingId)) return null

  const { data, error } = await supabase
    .from('listings')
    .select(`${LISTING}, seller_id, seller:users!listings_seller_id_fkey(${PERSON})`)
    .eq('id', listingId)
    .maybeSingle()
  if (error) throw readableError(error, 'Couldn’t load this listing.')
  if (!data) return null

  return {
    seller_id: data.seller_id,
    other_name: data.seller?.display_name ?? 'the seller',
    other_avatar_url: data.seller?.avatar_url ?? null,
    listing: {
      id: data.id,
      title: data.title,
      status: data.status,
      price_label: priceLabel(data),
      cover_url: coverOf(data),
    },
  }
}

// The buyer's existing conversation about a listing, or null.
export async function findConversationId(listingId, userId) {
  const { data, error } = await supabase
    .from('conversations')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', userId)
    .maybeSingle()
  if (error) throw readableError(error, 'Couldn’t open this conversation.')
  return data?.id ?? null
}

// Starts the buyer's conversation about a listing with its first message.
// The conversation is only created when there's a message to send, so
// sellers never see empty conversations. Returns the conversation id.
export async function startConversation(listingId, userId, body) {
  let conversationId = await findConversationId(listingId, userId)

  if (!conversationId) {
    // seller_id is filled in by the database from the listing.
    const { data, error } = await supabase
      .from('conversations')
      .insert({ listing_id: listingId, buyer_id: userId })
      .select('id')
      .single()

    if (error?.code === '23505') {
      // Started in another tab a moment ago: use that one.
      conversationId = await findConversationId(listingId, userId)
    } else if (error) {
      throw readableError(error, 'Couldn’t send your message. Try again.')
    } else {
      conversationId = data.id
    }
  }

  await sendMessage(conversationId, userId, body)
  return conversationId
}

// Messages about a trade offer carry the offer (with its current status), so
// the chat can show it as a card. Needs the trade_offers_in_messages migration.
const MESSAGE_FIELDS = `id, sender_id, body, created_at, read_at, trade_offer_id, offer_event,
  trade_offer:trade_offers(id, status, description, cash_cents, from_user_id, response_note,
    offered_listing:listings!trade_offers_offered_listing_id_fkey(${LISTING}))`

// The newest messages in a conversation, oldest first (for display).
export async function fetchMessages(conversationId) {
  const { data, error } = await supabase
    .from('messages')
    .select(MESSAGE_FIELDS)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(MESSAGE_PAGE)
  if (error) throw readableError(error, 'Couldn’t load messages.')
  return data.reverse()
}

// Messages sent after `since` (an ISO timestamp), oldest first. Used for polling.
export async function fetchNewMessages(conversationId, since) {
  const { data, error } = await supabase
    .from('messages')
    .select(MESSAGE_FIELDS)
    .eq('conversation_id', conversationId)
    .gt('created_at', since)
    .order('created_at', { ascending: true })
  if (error) throw readableError(error, 'Couldn’t load new messages.')
  return data
}

export async function sendMessage(conversationId, userId, body) {
  const text = body.trim()
  if (!text) throw new Error('Write a message before sending.')
  if (text.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Keep messages to ${MAX_MESSAGE_LENGTH} characters.`)
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({ conversation_id: conversationId, sender_id: userId, body: text })
    .select(MESSAGE_FIELDS)
    .single()
  if (error) throw readableError(error, 'Couldn’t send your message. Try again.')
  return data
}

// Fired on window after messages are marked read, so the nav's unread dot
// can update right away instead of waiting for its next check.
export const MESSAGES_READ_EVENT = 'husky:messages-read'

// Marks the other person's messages in this conversation as read.
export async function markConversationRead(conversationId, userId) {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId)
    .is('read_at', null)
  // Not worth interrupting the chat over; the unread dot just stays.
  if (error) console.error(error)
  else window.dispatchEvent(new Event(MESSAGES_READ_EVENT))
}

// True when someone has sent the user a message they haven't opened yet.
// Same rule as the inbox's unread counts. The conversations join keeps it to
// the user's own conversations (admins can read everyone's).
export async function hasUnreadMessages(userId) {
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversations!inner(buyer_id, seller_id)')
    .neq('sender_id', userId)
    .is('read_at', null)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`, { referencedTable: 'conversations' })
    .limit(1)
  if (error) throw error
  return data.length > 0
}

// Postgres sends microseconds ("…16.063123+00:00"), which some browsers can't
// parse. Trimming to milliseconds parses everywhere.
export function toDate(value) {
  return new Date(String(value).replace(/(\.\d{3})\d+/, '$1'))
}

// "2:14 PM" today, "Mon" this week, "Nov 3" this year, else "Nov 3, 2025".
export function formatMessageTime(date) {
  const then = toDate(date)
  const now = new Date()
  const days = (now - then) / 86400000

  if (then.toDateString() === now.toDateString()) {
    return then.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  }
  if (days < 6) return then.toLocaleDateString('en-US', { weekday: 'short' })
  if (then.getFullYear() === now.getFullYear()) {
    return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
