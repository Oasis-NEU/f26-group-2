import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Send } from 'lucide-react'

import { useAuth } from '../auth/AuthContext'
import Nav from '../components/Nav'
import {
  MAX_MESSAGE_LENGTH,
  fetchConversation,
  fetchListingForNewConversation,
  fetchMessages,
  fetchNewMessages,
  findConversationId,
  formatMessageTime,
  markConversationRead,
  sendMessage,
  startConversation,
  toDate,
} from '../data/messages'
import { getInitials } from '../utils/initials'
import './Conversation.css'

// F6.3: new messages show up within 5 seconds without refreshing.
const POLL_MS = 4000
// Messages from the same person this close together share one timestamp.
const GROUP_GAP_MS = 5 * 60 * 1000
// The character count appears once a message gets this long.
const COUNTER_FROM = MAX_MESSAGE_LENGTH - 200
const STARTER = 'Hi! Is this still available?'
const STATUS_LABELS = { pending: 'Pending', sold: 'Sold' }

// Adds messages to the list without duplicates, oldest first. Timestamps are
// all UTC in the same format, so comparing the strings sorts them correctly.
function mergeMessages(current, incoming) {
  const byId = new Map(current.map((message) => [message.id, message]))
  for (const message of incoming) byId.set(message.id, message)
  return [...byId.values()].sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
}

function ListingCard({ listing }) {
  return (
    <Link className="chat__listing" to={`/listings/${listing.id}`}>
      <span className="chat__thumb" aria-hidden="true">
        {listing.cover_url ? <img src={listing.cover_url} alt="" /> : getInitials(listing.title)}
      </span>
      <span className="chat__listing-text">
        <span className="chat__listing-title">{listing.title}</span>
        <span className="chat__listing-meta">
          {listing.price_label}
          {STATUS_LABELS[listing.status] && ` · ${STATUS_LABELS[listing.status]}`}
        </span>
      </span>
    </Link>
  )
}

function Chat({ conversationId, listingId }) {
  const isNew = Boolean(listingId)
  const { user } = useAuth()
  const navigate = useNavigate()

  // status: 'loading' | 'ready' | 'own' (buyer page for your own listing) | 'not-found' | 'error'
  const [page, setPage] = useState({ status: 'loading', conversation: null, messages: [] })
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [announcement, setAnnouncement] = useState('')

  const inputRef = useRef(null)
  const bottomRef = useRef(null)
  const lastAtRef = useRef(null)
  const shownCountRef = useRef(0)

  const { conversation, messages } = page
  const otherName = conversation?.other_name ?? ''
  const ready = page.status === 'ready'

  // Load the conversation, or for a buyer's first message, the listing.
  useEffect(() => {
    let ignore = false

    async function load() {
      try {
        if (listingId) {
          // Already talking about this listing? Go to that conversation.
          const existingId = await findConversationId(listingId, user.id)
          if (ignore) return
          if (existingId) {
            navigate(`/messages/${existingId}`, { replace: true })
            return
          }

          const found = await fetchListingForNewConversation(listingId)
          if (ignore) return
          if (!found) setPage({ status: 'not-found', conversation: null, messages: [] })
          else if (found.seller_id === user.id) setPage({ status: 'own', conversation: null, messages: [] })
          else setPage({ status: 'ready', conversation: { ...found, role: 'buyer' }, messages: [] })
          return
        }

        const found = await fetchConversation(conversationId, user.id)
        if (ignore) return
        if (!found) {
          setPage({ status: 'not-found', conversation: null, messages: [] })
          return
        }
        const loaded = await fetchMessages(conversationId)
        if (ignore) return
        setPage({ status: 'ready', conversation: found, messages: loaded })
        markConversationRead(conversationId, user.id)
      } catch (error) {
        console.error(error.cause ?? error)
        if (!ignore) setPage({ status: 'error', conversation: null, messages: [] })
      }
    }

    load()
    return () => {
      ignore = true
    }
  }, [conversationId, listingId, user.id, navigate])

  // The newest message's time, so polling only asks for what came after it.
  useEffect(() => {
    lastAtRef.current = messages.at(-1)?.created_at ?? null
  }, [messages])

  // Check for new messages every few seconds while the tab is visible.
  useEffect(() => {
    if (!ready || !conversationId) return
    let ignore = false

    const timer = setInterval(async () => {
      if (document.hidden) return
      try {
        const fresh = await fetchNewMessages(conversationId, lastAtRef.current ?? '1970-01-01T00:00:00Z')
        if (ignore || !fresh.length) return
        setPage((current) => ({ ...current, messages: mergeMessages(current.messages, fresh) }))

        const incoming = fresh.filter((message) => message.sender_id !== user.id)
        if (incoming.length) {
          markConversationRead(conversationId, user.id)
          setAnnouncement(
            incoming.length === 1
              ? `New message from ${otherName}: ${incoming[0].body}`
              : `${incoming.length} new messages from ${otherName}`,
          )
        }
      } catch (error) {
        // Try again on the next tick; a blip shouldn't interrupt the chat.
        console.error(error.cause ?? error)
      }
    }, POLL_MS)

    return () => {
      ignore = true
      clearInterval(timer)
    }
  }, [ready, conversationId, user.id, otherName])

  // Jump to the newest message on first load; afterwards, follow new messages
  // only if you sent them or were already near the bottom.
  useEffect(() => {
    const count = messages.length
    const previous = shownCountRef.current
    shownCountRef.current = count
    if (!count || count === previous) return

    const nearBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 240
    if (previous === 0 || messages[count - 1].sender_id === user.id || nearBottom) {
      bottomRef.current?.scrollIntoView({ block: 'end', behavior: previous === 0 ? 'auto' : 'smooth' })
    }
  }, [messages, user.id])

  const canSend = ready && (!isNew || conversation.listing.status === 'active')

  async function handleSubmit(event) {
    event.preventDefault()
    const text = draft.trim()
    if (!text || sending || !canSend) return

    setSending(true)
    setSendError('')
    try {
      if (isNew) {
        const newId = await startConversation(listingId, user.id, text)
        // The conversation now exists; show it at its own address.
        navigate(`/messages/${newId}`, { replace: true })
        return
      }
      const sent = await sendMessage(conversationId, user.id, text)
      setPage((current) => ({ ...current, messages: mergeMessages(current.messages, [sent]) }))
      setDraft('')
    } catch (error) {
      console.error(error.cause ?? error)
      setSendError(error.message)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  // Enter sends; Shift+Enter adds a new line.
  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      handleSubmit(event)
    }
  }

  let body
  if (page.status === 'loading') {
    body = (
      <p className="chat__muted" role="status">
        Loading conversation…
      </p>
    )
  } else if (page.status === 'error') {
    body = (
      <p className="chat__error" role="alert">
        Couldn’t load this conversation. Refresh the page to try again.
      </p>
    )
  } else if (page.status === 'own') {
    body = (
      <section className="chat__notice">
        <h1 className="chat__title">This is your listing</h1>
        <p className="chat__muted">When buyers message you about it, their messages show up in your inbox.</p>
        <Link className="btn btn--secondary" to="/messages">
          Go to messages
        </Link>
      </section>
    )
  } else if (page.status === 'not-found') {
    body = (
      <section className="chat__notice">
        <h1 className="chat__title">Conversation not found</h1>
        <p className="chat__muted">
          The listing may have been removed, or this link isn’t for one of your conversations.
        </p>
        <Link className="btn btn--secondary" to="/messages">
          Go to messages
        </Link>
      </section>
    )
  } else {
    const roleLabel = conversation.role === 'buyer' ? 'Seller' : 'Buyer'
    const describedBy = [
      draft.length > COUNTER_FROM && 'chat-count',
      sendError && 'chat-error',
      isNew && 'chat-hint',
    ]
      .filter(Boolean)
      .join(' ')

    body = (
      <>
        <header className="chat__header">
          <h1 className="chat__title">
            {otherName}
            <span className="chat__role">{roleLabel}</span>
          </h1>
          <ListingCard listing={conversation.listing} />
        </header>

        {messages.length ? (
          <ol className="chat__messages" aria-label={`Messages with ${otherName}`}>
            {messages.map((message, index) => {
              const mine = message.sender_id === user.id
              const next = messages[index + 1]
              const showTime =
                !next ||
                next.sender_id !== message.sender_id ||
                toDate(next.created_at) - toDate(message.created_at) > GROUP_GAP_MS

              return (
                <li key={message.id} className={`bubble-row${mine ? ' bubble-row--mine' : ''}`}>
                  <p className="bubble">
                    <span className="visually-hidden">{mine ? 'You' : otherName}: </span>
                    {message.body}
                  </p>
                  {showTime && (
                    <time className="bubble-row__time" dateTime={message.created_at}>
                      {formatMessageTime(message.created_at)}
                    </time>
                  )}
                </li>
              )
            })}
          </ol>
        ) : (
          <p className="chat__muted chat__empty">
            {canSend
              ? `Send ${otherName} a message about this listing.`
              : 'This listing is no longer available, so you can’t start a new conversation about it.'}
          </p>
        )}
        <div ref={bottomRef} />

        <form className="chat__composer" onSubmit={handleSubmit}>
          {isNew && canSend && !draft && (
            <button
              className="chip chat__starter"
              type="button"
              onClick={() => {
                setDraft(STARTER)
                inputRef.current?.focus()
              }}
            >
              {STARTER}
            </button>
          )}
          <label className="chat__label" htmlFor="chat-input">
            Message {otherName}
          </label>
          <div className="chat__input-row">
            <textarea
              id="chat-input"
              ref={inputRef}
              className="text-input chat__input"
              rows={1}
              maxLength={MAX_MESSAGE_LENGTH}
              placeholder="Write a message…"
              disabled={!canSend}
              aria-describedby={describedBy || undefined}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value)
                if (sendError) setSendError('')
              }}
              onKeyDown={handleKeyDown}
            />
            <button
              className="btn btn--primary chat__send"
              type="submit"
              disabled={sending || !draft.trim() || !canSend}
            >
              <Send size={18} aria-hidden="true" />
              <span>{sending ? 'Sending…' : 'Send'}</span>
            </button>
          </div>
          {draft.length > COUNTER_FROM && (
            <p className="chat__count" id="chat-count">
              {draft.length}/{MAX_MESSAGE_LENGTH}
            </p>
          )}
          {sendError && (
            <p className="chat__error" id="chat-error" role="alert">
              {sendError}
            </p>
          )}
          {isNew && (
            <p className="chat__hint" id="chat-hint">
              Meet in a public spot on campus, never share your address, and don’t pay before you’ve
              seen the item.
            </p>
          )}
        </form>

        {/* Reads new incoming messages aloud for screen reader users. */}
        <p className="visually-hidden" role="status" aria-live="polite">
          {announcement}
        </p>
      </>
    )
  }

  return (
    <div className="chat-page">
      <Nav variant="app" />
      <main className="container chat">
        <Link className="chat__back" to="/messages">
          ← Messages
        </Link>
        {body}
      </main>
    </div>
  )
}

// /messages/:id is a conversation; /messages/new/:listingId is a buyer's
// first message about a listing. Keying by the address gives each its own
// fresh state, so nothing carries over between conversations.
function Conversation() {
  const { id, listingId } = useParams()
  return (
    <Chat key={listingId ? `new:${listingId}` : id} conversationId={id} listingId={listingId} />
  )
}

export default Conversation
