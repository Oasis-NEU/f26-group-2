import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowLeftRight } from 'lucide-react'

import { coverOf, priceLabel } from '../data/messages'
import { MAX_DECLINE_NOTE, formatCash, respondToOffer } from '../data/tradeOffers'
import { getInitials } from '../utils/initials'
import { Button } from './ui/button'
import './TradeOffer.css'

const STATUS_LABELS = {
  pending: 'Waiting for an answer',
  accepted: 'Accepted',
  declined: 'Declined',
  withdrawn: 'Withdrawn',
}

function OfferedListing({ listing }) {
  const cover = coverOf(listing)
  return (
    <Link className="offer-card__listing" to={`/listings/${listing.id}`}>
      <span className="offer-card__thumb" aria-hidden="true">
        {cover ? <img src={cover} alt="" /> : getInitials(listing.title)}
      </span>
      <span className="offer-card__listing-text">
        <span className="offer-card__listing-title">{listing.title}</span>
        <span className="offer-card__listing-meta">{priceLabel(listing)}</span>
      </span>
    </Link>
  )
}

// A trade offer in the chat. `offer` is its latest state; `role` is the
// signed-in user's side of the conversation ('buyer' made the offer).
function TradeOfferCard({ offer, role, otherName, listing, onChanged }) {
  const [mode, setMode] = useState(null) // null | 'accept' | 'decline'
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const isSeller = role === 'seller'
  const pending = offer.status === 'pending'
  const noteId = `decline-note-${offer.id}`

  async function respond(status) {
    setBusy(true)
    setError('')
    try {
      await respondToOffer(offer.id, status, note)
      setMode(null)
      setNote('')
      onChanged(status)
    } catch (err) {
      console.error(err.cause ?? err)
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="offer-card">
      <div className="offer-card__head">
        <span className="offer-card__label">
          <ArrowLeftRight aria-hidden="true" />
          {isSeller ? `${otherName} offered a trade` : 'You offered a trade'}
        </span>
        <span className={`offer-card__status offer-card__status--${offer.status}`}>
          {STATUS_LABELS[offer.status]}
        </span>
      </div>

      {offer.offered_listing && <OfferedListing listing={offer.offered_listing} />}
      {offer.description && <p className="offer-card__text">{offer.description}</p>}
      {offer.cash_cents > 0 && (
        <p className="offer-card__cash">
          {offer.offered_listing || offer.description ? 'Plus ' : ''}
          {formatCash(offer.cash_cents)} cash
        </p>
      )}

      {/* What you can do next. */}
      {pending && isSeller && mode === null && (
        <div className="offer-card__actions">
          <Button onClick={() => setMode('accept')}>Accept</Button>
          <Button variant="secondary" onClick={() => setMode('decline')}>
            Decline
          </Button>
        </div>
      )}

      {pending && isSeller && mode === 'accept' && (
        <div className="offer-card__confirm">
          <p className="offer-card__note">
            Accept this offer? “{listing.title}” will be marked pending, and any other offers on it
            will be declined.
          </p>
          <div className="offer-card__actions">
            <Button loading={busy} onClick={() => respond('accepted')}>
              Yes, accept
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => setMode(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {pending && isSeller && mode === 'decline' && (
        <div className="offer-card__confirm">
          <label className="offer-card__field-label" htmlFor={noteId}>
            Tell {otherName} why, or what you’d take instead{' '}
            <span className="offer-card__optional">optional</span>
          </label>
          <textarea
            id={noteId}
            className="text-input offer-card__textarea"
            rows={2}
            maxLength={MAX_DECLINE_NOTE}
            placeholder="e.g. I’d trade for a monitor, or $20 plus the lamp."
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          <div className="offer-card__actions">
            <Button variant="destructive" loading={busy} onClick={() => respond('declined')}>
              Decline offer
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => setMode(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {pending && !isSeller && (
        <div className="offer-card__actions">
          <p className="offer-card__note">Waiting for {otherName} to accept or decline.</p>
          <Button variant="secondary" loading={busy} onClick={() => respond('withdrawn')}>
            Withdraw offer
          </Button>
        </div>
      )}

      {offer.status === 'accepted' && (
        <p className="offer-card__note">
          {isSeller
            ? 'You accepted. Agree on when and where to swap here, then mark the listing as sold in your dashboard.'
            : `${otherName} accepted! Agree on when and where to swap here.`}
        </p>
      )}

      {offer.status === 'declined' && !isSeller && listing.status === 'active' && (
        <div className="offer-card__actions">
          <Link className="btn btn--secondary" to={`/listings/${listing.id}?offer=1`}>
            Make a new offer
          </Link>
        </div>
      )}

      {error && (
        <p className="offer-card__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default TradeOfferCard
