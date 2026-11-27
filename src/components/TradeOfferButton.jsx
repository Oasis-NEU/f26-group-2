import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeftRight } from 'lucide-react'

import { useAuth } from '../auth/AuthContext'
import {
  MAX_OFFER_CASH_CENTS,
  MAX_OFFER_DESCRIPTION,
  fetchListingsToOffer,
  fetchMyPendingOffer,
  makeTradeOffer,
} from '../data/tradeOffers'
import { getInitials } from '../utils/initials'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import './TradeOffer.css'

const CASH_PATTERN = /^\d+(\.\d{1,2})?$/

function toCents(value) {
  return Math.round(Number(value) * 100)
}

// The form inside the dialog. Mounted only while the dialog is open, so it
// starts fresh each time.
function OfferForm({ listing, onSent }) {
  const { user } = useAuth()
  const [myListings, setMyListings] = useState(null) // null while loading
  const [offeredId, setOfferedId] = useState('')
  const [description, setDescription] = useState('')
  const [cash, setCash] = useState('')
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)

  // Editing a field clears its error, and picking a listing clears the
  // "pick a listing or describe it" one.
  function clearError(field) {
    setErrors((current) => (current[field] || current.form ? { ...current, [field]: '', form: '' } : current))
  }

  useEffect(() => {
    let ignore = false
    fetchListingsToOffer(user.id, listing.id)
      .then((rows) => !ignore && setMyListings(rows))
      .catch((error) => {
        console.error(error.cause ?? error)
        if (!ignore) setMyListings([])
      })
    return () => {
      ignore = true
    }
  }, [user.id, listing.id])

  async function handleSubmit(event) {
    event.preventDefault()

    const next = {}
    if (!offeredId && !description.trim()) {
      next.description = 'Pick one of your listings above, or describe what you’re offering.'
    }
    const cashText = cash.trim().replace(/^\$/, '')
    if (cashText && (!CASH_PATTERN.test(cashText) || toCents(cashText) > MAX_OFFER_CASH_CENTS)) {
      next.cash = 'Enter an amount like 10 or 10.50, or leave it blank.'
    }
    setErrors(next)
    if (next.description) return document.getElementById('offer-description').focus()
    if (next.cash) return document.getElementById('offer-cash').focus()

    setSending(true)
    try {
      const conversationId = await makeTradeOffer({
        listingId: listing.id,
        userId: user.id,
        offeredListingId: offeredId,
        description,
        cashCents: cashText ? toCents(cashText) : 0,
      })
      onSent(conversationId)
    } catch (error) {
      console.error(error.cause ?? error)
      setErrors({ form: error.message })
      setSending(false)
    }
  }

  return (
    <form className="offer-form" onSubmit={handleSubmit} noValidate>
      <fieldset className="offer-form__group">
        <legend className="offer-form__label">
          Offer one of your listings <span className="offer-form__optional">optional</span>
        </legend>
        {myListings === null ? (
          <p className="offer-form__hint">Loading your listings…</p>
        ) : (
          <div className="offer-choices">
            <label className="offer-choice">
              <input
                type="radio"
                name="offered-listing"
                value=""
                checked={offeredId === ''}
                onChange={() => {
                  setOfferedId('')
                  clearError('description')
                }}
              />
              <span className="offer-choice__text">No listing, I’ll describe it</span>
            </label>
            {myListings.map((item) => (
              <label key={item.id} className="offer-choice">
                <input
                  type="radio"
                  name="offered-listing"
                  value={item.id}
                  checked={offeredId === item.id}
                  onChange={() => {
                    setOfferedId(item.id)
                    clearError('description')
                  }}
                />
                <span className="offer-choice__thumb" aria-hidden="true">
                  {item.cover_url ? <img src={item.cover_url} alt="" /> : getInitials(item.title)}
                </span>
                <span className="offer-choice__text">
                  <span className="offer-choice__title">{item.title}</span>
                  <span className="offer-choice__meta">{item.price_label}</span>
                </span>
              </label>
            ))}
            {!myListings.length && (
              <p className="offer-form__hint">
                You don’t have any active listings to offer. Describe what you’d trade below.
              </p>
            )}
          </div>
        )}
      </fieldset>

      <div className="offer-form__group">
        <label className="offer-form__label" htmlFor="offer-description">
          {offeredId ? (
            <>
              Add a note <span className="offer-form__optional">optional</span>
            </>
          ) : (
            'What are you offering?'
          )}
        </label>
        <textarea
          id="offer-description"
          className="text-input offer-form__textarea"
          rows={3}
          maxLength={MAX_OFFER_DESCRIPTION}
          placeholder={offeredId ? 'e.g. It’s in great shape, happy to meet at Snell.' : 'e.g. A desk lamp and a box of textbooks'}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? 'offer-description-error' : undefined}
          value={description}
          onChange={(event) => {
            setDescription(event.target.value)
            clearError('description')
          }}
        />
        {errors.description && (
          <p className="offer-form__error" id="offer-description-error">
            {errors.description}
          </p>
        )}
      </div>

      <div className="offer-form__group">
        <label className="offer-form__label" htmlFor="offer-cash">
          Add cash <span className="offer-form__optional">optional</span>
        </label>
        <div className="offer-form__cash">
          <span aria-hidden="true">$</span>
          <input
            id="offer-cash"
            className="text-input"
            type="text"
            inputMode="decimal"
            placeholder="0"
            autoComplete="off"
            aria-invalid={Boolean(errors.cash)}
            aria-describedby={errors.cash ? 'offer-cash-error offer-cash-hint' : 'offer-cash-hint'}
            value={cash}
            onChange={(event) => {
              setCash(event.target.value)
              clearError('cash')
            }}
          />
        </div>
        <p className="offer-form__hint" id="offer-cash-hint">
          On top of the trade, paid in cash or by Venmo, Zelle, Cash App, PayPal, or Apple Cash.
        </p>
        {errors.cash && (
          <p className="offer-form__error" id="offer-cash-error">
            {errors.cash}
          </p>
        )}
      </div>

      {errors.form && (
        <p className="offer-form__error" role="alert">
          {errors.form}
        </p>
      )}

      <Button type="submit" loading={sending} className="offer-form__submit">
        {sending ? 'Sending offer…' : 'Send offer'}
      </Button>
    </form>
  )
}

// "Offer a trade" on a listing that's open to trades. If you already have an
// offer waiting, it links to that conversation instead.
function TradeOfferButton({ listing, startOpen = false }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  // undefined while checking, null for none, or { id, conversation_id }
  const [pending, setPending] = useState(undefined)

  useEffect(() => {
    let ignore = false
    fetchMyPendingOffer(listing.id, user.id)
      .then((found) => {
        if (ignore) return
        setPending(found)
        if (!found && startOpen) setOpen(true)
      })
      .catch((error) => {
        console.error(error.cause ?? error)
        if (!ignore) setPending(null)
      })
    return () => {
      ignore = true
    }
  }, [listing.id, user.id, startOpen])

  if (pending) {
    return (
      <Link className="btn btn--secondary" to={pending.conversation_id ? `/messages/${pending.conversation_id}` : '/messages'}>
        View your trade offer
      </Link>
    )
  }

  return (
    <>
      <button
        className="btn btn--secondary trade-button"
        type="button"
        disabled={pending === undefined}
        onClick={() => setOpen(true)}
      >
        <ArrowLeftRight aria-hidden="true" />
        Offer a trade
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Offer a trade</DialogTitle>
            <DialogDescription>
              For “{listing.title}”. Your offer is sent to the seller in Messages, where they can
              accept or decline it.
            </DialogDescription>
          </DialogHeader>
          {open && (
            <OfferForm
              listing={listing}
              onSent={(conversationId) => {
                setOpen(false)
                navigate(conversationId ? `/messages/${conversationId}` : '/messages')
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TradeOfferButton
