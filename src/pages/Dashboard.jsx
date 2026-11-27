import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { PackageOpen } from 'lucide-react'
import { toast } from 'sonner'

import { useAuth } from '../auth/AuthContext'
import EmptyState from '../components/EmptyState'
import Nav from '../components/Nav'
import { Button } from '../components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { deleteListing, fetchMyListings, updateListingStatus } from '../data/myListings'
import './Dashboard.css'

const STATUSES = [
  { value: 'active', label: 'Active', hint: 'On Browse for everyone to see.' },
  { value: 'pending', label: 'Pending', hint: 'Hidden from Browse while you arrange a pickup.' },
  { value: 'sold', label: 'Sold', hint: 'Off Browse. They stay here until you delete them.' },
]

const STATUS_LABELS = Object.fromEntries(STATUSES.map((status) => [status.value, status.label]))

const FILTERS = [{ value: 'all', label: 'All' }, ...STATUSES]

function formatMoney(cents) {
  return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}

function formatPrice(listing) {
  if (listing.is_free || listing.price_cents === 0) return 'Free'
  if (listing.price_cents == null) return 'Trade only'
  return formatMoney(listing.price_cents)
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Summary ─────────────────────────────────────────────────────────────────

function Summary({ listings }) {
  const count = (status) => listings.filter((listing) => listing.status === status).length
  const sold = listings.filter((listing) => listing.status === 'sold')
  const soldTotal = sold.reduce((sum, listing) => sum + (listing.is_free ? 0 : listing.price_cents ?? 0), 0)

  const stats = [
    { label: 'Active', value: count('active') },
    { label: 'Pending', value: count('pending') },
    { label: 'Sold', value: sold.length },
    { label: 'Sold total', value: formatMoney(soldTotal) },
  ]

  return (
    <dl className="dash-stats">
      {stats.map((stat) => (
        <div key={stat.label} className="dash-stats__item">
          <dt className="dash-stats__label">{stat.label}</dt>
          <dd className="dash-stats__value">{stat.value}</dd>
        </div>
      ))}
    </dl>
  )
}

// ── One listing ─────────────────────────────────────────────────────────────

function ListingRow({ listing, busy, onStatusChange, onDelete }) {
  const statusId = `status-${listing.id}`
  const dateLine =
    listing.status === 'sold' && listing.sold_at
      ? `Sold ${formatDate(listing.sold_at)}`
      : `Posted ${formatDate(listing.created_at)}`

  return (
    <li className="dash-listing">
      <Link className="dash-listing__thumb" to={`/listings/${listing.id}`} tabIndex={-1} aria-hidden="true">
        {listing.cover_url && <img src={listing.cover_url} alt="" />}
      </Link>

      <div className="dash-listing__body">
        <Link className="dash-listing__title" to={`/listings/${listing.id}`}>
          {listing.title}
        </Link>
        <p className="dash-listing__price">{formatPrice(listing)}</p>
        <p className="dash-listing__meta">
          <span className={`dash-badge dash-badge--${listing.status}`}>
            {STATUS_LABELS[listing.status] ?? listing.status}
          </span>
          <span>{[dateLine, listing.campus_area].filter(Boolean).join(' · ')}</span>
        </p>
      </div>

      <div className="dash-listing__controls">
        <div className="dash-listing__status">
          <label className="dash-listing__status-label" htmlFor={statusId}>
            Status
          </label>
          <select
            id={statusId}
            className="text-input dash-listing__select"
            value={listing.status}
            disabled={busy}
            onChange={(event) => onStatusChange(listing, event.target.value)}
          >
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        <div className="dash-listing__buttons">
          <Link
            className="btn btn--secondary"
            to={`/listings/${listing.id}/edit`}
            aria-label={`Edit ${listing.title}`}
          >
            Edit
          </Link>
          <button
            className="btn btn--secondary dash-listing__delete"
            type="button"
            disabled={busy}
            aria-label={`Delete ${listing.title}`}
            onClick={() => onDelete(listing)}
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  )
}

// ── Confirm dialogs ─────────────────────────────────────────────────────────

// Marking as sold and deleting are hard to take back, so both ask first.
function ConfirmDialog({ action, busy, onConfirm, onCancel }) {
  const isDelete = action?.type === 'delete'
  const title = action?.listing.title
  const deleteText =
    action?.listing.status === 'sold'
      ? `“${title}”, its photos, and messages about it will be deleted. Any review of the sale stays on your profile. This can’t be undone.`
      : `“${title}”, its photos, and messages about it will be deleted. This can’t be undone.`

  return (
    <Dialog open={Boolean(action)} onOpenChange={(open) => !open && !busy && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isDelete ? 'Delete this listing?' : 'Mark as sold?'}</DialogTitle>
          <DialogDescription>
            {isDelete
              ? deleteText
              : `“${title}” will come off Browse. It stays on your dashboard until you delete it, and you can set it back to active if the sale falls through.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary" disabled={busy}>
              Cancel
            </Button>
          </DialogClose>
          <Button variant={isDelete ? 'destructive' : 'primary'} loading={busy} onClick={onConfirm}>
            {isDelete ? 'Delete listing' : 'Mark as sold'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

function Dashboard() {
  const { user } = useAuth()
  const [listings, setListings] = useState(null) // null while loading
  const [loadError, setLoadError] = useState(false)
  const [filter, setFilter] = useState('all')
  const [busyId, setBusyId] = useState(null)
  const [confirm, setConfirm] = useState(null) // { type: 'sold' | 'delete', listing }

  useEffect(() => {
    fetchMyListings(user.id)
      .then(setListings)
      .catch((error) => {
        console.error(error)
        setLoadError(true)
      })
  }, [user.id])

  async function applyStatus(listing, status) {
    setBusyId(listing.id)
    try {
      const saved = await updateListingStatus(listing.id, status)
      setListings((current) =>
        current.map((item) => (item.id === saved.id ? { ...item, ...saved } : item)),
      )
      toast.success(`“${listing.title}” is now ${STATUS_LABELS[saved.status].toLowerCase()}.`)
    } catch (error) {
      console.error(error)
      toast.error(error.message || 'Couldn’t change the status. Try again.')
    } finally {
      setBusyId(null)
      setConfirm(null)
    }
  }

  async function removeListing(listing) {
    setBusyId(listing.id)
    try {
      await deleteListing(listing)
      setListings((current) => current.filter((item) => item.id !== listing.id))
      toast.success(`Deleted “${listing.title}”.`)
    } catch (error) {
      console.error(error)
      toast.error(error.message || 'Couldn’t delete that listing. Try again.')
    } finally {
      setBusyId(null)
      setConfirm(null)
    }
  }

  function handleStatusChange(listing, status) {
    if (status === listing.status) return
    if (status === 'sold') setConfirm({ type: 'sold', listing })
    else applyStatus(listing, status)
  }

  function handleConfirm() {
    if (confirm.type === 'delete') removeListing(confirm.listing)
    else applyStatus(confirm.listing, 'sold')
  }

  const countFor = (value) =>
    value === 'all' ? listings.length : listings.filter((listing) => listing.status === value).length
  const shown = listings?.filter((listing) => filter === 'all' || listing.status === filter) ?? []

  let content
  if (loadError) {
    content = (
      <p className="field__error" role="alert">
        Couldn’t load your listings. Refresh the page to try again.
      </p>
    )
  } else if (!listings) {
    content = (
      <p className="dash__muted" role="status">
        Loading your listings…
      </p>
    )
  } else if (!listings.length) {
    content = (
      <EmptyState
        icon={PackageOpen}
        title="You haven’t listed anything yet."
        description="Post your first item and it’ll show up here."
        action={
          <Link className="btn btn--primary" to="/sell">
            Sell an item
          </Link>
        }
      />
    )
  } else {
    const currentFilter = STATUSES.find((status) => status.value === filter)
    content = (
      <>
        <Summary listings={listings} />

        <section className="dash__list" aria-labelledby="dash-list-heading">
          <h2 className="visually-hidden" id="dash-list-heading">
            Your listings
          </h2>
          <div className="dash__filters" role="group" aria-label="Show listings">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`chip${filter === option.value ? ' chip--active' : ''}`}
                aria-pressed={filter === option.value}
                onClick={() => setFilter(option.value)}
              >
                {option.label} ({countFor(option.value)})
              </button>
            ))}
          </div>
          {currentFilter && <p className="dash__muted">{currentFilter.hint}</p>}

          {shown.length ? (
            <ul className="dash-listings">
              {shown.map((listing) => (
                <ListingRow
                  key={listing.id}
                  listing={listing}
                  busy={busyId === listing.id}
                  onStatusChange={handleStatusChange}
                  onDelete={(item) => setConfirm({ type: 'delete', listing: item })}
                />
              ))}
            </ul>
          ) : (
            <p className="dash__empty">No {currentFilter.label.toLowerCase()} listings.</p>
          )}
        </section>
      </>
    )
  }

  return (
    <>
      <Nav variant="app" />

      <main className="container dash">
        <header className="dash__header">
          <h1 className="dash__title">Seller dashboard</h1>
          <Link className="btn btn--primary" to="/sell">
            Sell an item
          </Link>
        </header>

        {content}
      </main>

      <ConfirmDialog
        action={confirm}
        busy={Boolean(busyId)}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </>
  )
}

export default Dashboard
