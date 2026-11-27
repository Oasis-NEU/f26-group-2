import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { MessagesSquare } from 'lucide-react'

import { useAuth } from '../auth/AuthContext'
import EmptyState from '../components/EmptyState'
import Nav from '../components/Nav'
import { fetchInbox, formatMessageTime } from '../data/messages'
import { getInitials } from '../utils/initials'
import './Inbox.css'

// How often the inbox checks for new messages while it's open.
const REFRESH_MS = 10000

const STATUS_LABELS = { pending: 'Pending', sold: 'Sold' }

function ConversationRow({ conversation }) {
  const { listing, last_message: last, unread_count: unread } = conversation
  const unreadText = unread === 1 ? '1 unread message' : `${unread} unread messages`

  return (
    <li>
      <Link
        className={`inbox-row${unread ? ' inbox-row--unread' : ''}`}
        to={`/messages/${conversation.id}`}
      >
        <span className="inbox-row__thumb" aria-hidden="true">
          {listing?.cover_url ? (
            <img src={listing.cover_url} alt="" />
          ) : (
            getInitials(conversation.other_name)
          )}
        </span>

        <span className="inbox-row__body">
          <span className="inbox-row__top">
            <span className="inbox-row__name">{conversation.other_name}</span>
            <time className="inbox-row__time" dateTime={last.created_at}>
              {formatMessageTime(last.created_at)}
            </time>
          </span>
          <span className="inbox-row__listing">
            {conversation.role === 'seller' ? 'Your listing · ' : ''}
            {listing?.title ?? 'Listing removed'}
            {STATUS_LABELS[listing?.status] && ` · ${STATUS_LABELS[listing.status]}`}
          </span>
          <span className="inbox-row__preview">
            {last.from_me && 'You: '}
            {last.body}
          </span>
        </span>

        {unread > 0 && (
          <span className="inbox-row__dot">
            <span className="visually-hidden">{unreadText}</span>
          </span>
        )}
      </Link>
    </li>
  )
}

function Inbox() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState(null) // null while loading
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let ignore = false

    async function load() {
      // Don't poll from a background tab.
      if (document.hidden) return
      try {
        const rows = await fetchInbox(user.id)
        if (ignore) return
        setConversations(rows)
        setFailed(false)
      } catch (error) {
        console.error(error.cause ?? error)
        if (!ignore) setFailed(true)
      }
    }

    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => {
      ignore = true
      clearInterval(timer)
    }
  }, [user.id])

  let content
  if (!conversations && failed) {
    content = (
      <p className="field__error" role="alert">
        Couldn’t load your messages. Refresh the page to try again.
      </p>
    )
  } else if (!conversations) {
    content = (
      <p className="inbox__muted" role="status">
        Loading your messages…
      </p>
    )
  } else if (!conversations.length) {
    content = (
      <EmptyState
        icon={MessagesSquare}
        title="No messages yet."
        description="When you message a seller, or a buyer messages you, it shows up here."
        action={
          <Link className="btn btn--primary" to="/browse">
            Browse listings
          </Link>
        }
      />
    )
  } else {
    content = (
      <ul className="inbox__list" aria-label="Conversations">
        {conversations.map((conversation) => (
          <ConversationRow key={conversation.id} conversation={conversation} />
        ))}
      </ul>
    )
  }

  return (
    <>
      <Nav variant="app" />

      <main className="container inbox">
        <h1 className="inbox__title">Messages</h1>
        {content}
      </main>
    </>
  )
}

export default Inbox
