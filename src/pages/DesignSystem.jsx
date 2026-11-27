import { Inbox, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import EmptyState from '@/components/EmptyState'
import { FilterCheckboxes, FilterPanel } from '@/components/FilterPanel'
import ListingCard from '@/components/ListingCard'
import SellerBadge from '@/components/SellerBadge'
import TagChip from '@/components/TagChip'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { CONDITIONS, sampleListings } from '@/data/sampleListings'

// Living reference for the design system at /design-system. Not linked from the app.

const COLORS = [
  { name: 'Primary red', token: '--accent', use: 'Primary button, active states', swatch: 'bg-primary' },
  { name: 'Text', token: '--text', use: 'Body text, headings', swatch: 'bg-foreground' },
  { name: 'Muted', token: '--text-muted', use: 'Secondary text, meta', swatch: 'bg-muted-foreground' },
  { name: 'Background', token: '--bg', use: 'Page background', swatch: 'bg-background' },
  { name: 'Surface', token: '--surface', use: 'Cards, inputs, chips', swatch: 'bg-card' },
  { name: 'Success', token: '--success', use: 'Verified, sold', swatch: 'bg-success' },
  { name: 'Warning', token: '--warning', use: 'Pending', swatch: 'bg-warning' },
]

const TYPE = [
  { className: 'text-page', label: 'text-page · 28 / 700', sample: 'Browse listings' },
  { className: 'text-section', label: 'text-section · 20 / 600', sample: 'Similar listings' },
  { className: 'text-price', label: 'text-price · 18 / 700', sample: '$45' },
  { className: 'text-body', label: 'text-body · 16 / 400', sample: 'Lightly used, no highlighting.' },
  { className: 'text-small', label: 'text-small · 13 / 500', sample: 'Snell Library · 2h ago' },
]

function Section({ title, note, children }) {
  return (
    <section className="flex flex-col gap-4 border-0 border-t border-border pt-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-section">{title}</h2>
        {note && <p className="text-small text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  )
}

function DesignSystem() {
  const [activeChip, setActiveChip] = useState('Textbooks')
  const [removable, setRemovable] = useState(['Under $50', 'Like new'])
  const [conditions, setConditions] = useState([])
  const soldListing = { ...sampleListings[0], id: 'sold-demo', status: 'sold' }

  return (
    <main className="container flex flex-col gap-10 py-12 text-foreground">
      <header className="flex flex-col gap-2">
        <h1 className="text-page">Husky Exchange design system</h1>
        <p className="text-body text-muted-foreground">
          Tokens live in <code>src/index.css</code>. Shared pieces live in{' '}
          <code>src/components/ui</code> and <code>src/components</code>.
        </p>
      </header>

      <Section title="Color" note="Dark theme only. Red is for primary actions and active states.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {COLORS.map((color) => (
            <div key={color.name} className="flex flex-col gap-2">
              <div className={`h-16 rounded-card border border-border ${color.swatch}`} />
              <div>
                <p className="text-sm font-semibold">{color.name}</p>
                <p className="text-small text-muted-foreground">{color.token}</p>
                <p className="text-small text-subtle-foreground">{color.use}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography" note="Inter throughout.">
        <div className="flex flex-col gap-4">
          {TYPE.map((row) => (
            <div key={row.label} className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
              <p className="w-52 shrink-0 text-small text-muted-foreground">{row.label}</p>
              <p className={row.className}>{row.sample}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Spacing and radius" note="8 px grid. Use even Tailwind steps: p-2 = 8 px, p-4 = 16 px, gap-6 = 24 px.">
        <div className="flex flex-wrap items-end gap-4">
          {[1, 2, 3, 4, 6, 8].map((n) => (
            <div key={n} className="flex flex-col items-center gap-2">
              <div className="bg-primary-soft" style={{ width: n * 8, height: n * 8 }} />
              <span className="text-small text-muted-foreground tabular-nums">{n * 8}px</span>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex size-20 items-center justify-center rounded-card bg-card text-small">
            12 · card
          </div>
          <div className="flex h-10 items-center rounded-control border border-border bg-card px-3 text-small">
            8 · input / button
          </div>
          <div className="flex h-8 items-center rounded-full bg-muted px-3 text-small">full · tag</div>
        </div>
      </Section>

      <Section title="Button">
        <div className="flex flex-wrap items-center gap-4">
          <Button>Post listing</Button>
          <Button variant="secondary">Save draft</Button>
          <Button variant="destructive">
            <Trash2 />
            Delete listing
          </Button>
          <Button variant="ghost">Cancel</Button>
          <Button variant="link">See all →</Button>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Button disabled>Disabled</Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
          <Button loading>Posting…</Button>
          <Button variant="secondary" loading>
            Saving…
          </Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section title="Input">
        <div className="grid max-w-xl gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Title
            <Input placeholder="e.g. IKEA desk lamp" />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Disabled
            <Input placeholder="Can’t edit" disabled />
          </label>
          <label className="flex flex-col gap-2 text-sm font-semibold">
            Price
            <Input aria-invalid="true" aria-describedby="ds-price-error" defaultValue="abc" />
            <span id="ds-price-error" className="text-small text-destructive">
              Enter a price. Use 0 if it’s free.
            </span>
          </label>
        </div>
      </Section>

      <Section title="Tag chip" note="Clickable filter, and a removable version for active filters.">
        <div className="flex flex-wrap gap-2">
          {['Textbooks', 'Furniture', 'Bikes'].map((name) => (
            <TagChip key={name} active={activeChip === name} onClick={() => setActiveChip(name)}>
              {name}
            </TagChip>
          ))}
        </div>
        <div className="flex min-h-8 flex-wrap items-center gap-2">
          {removable.map((name) => (
            <TagChip
              key={name}
              onRemove={() => setRemovable((list) => list.filter((item) => item !== name))}
            >
              {name}
            </TagChip>
          ))}
          {removable.length === 0 && (
            <Button variant="link" size="sm" onClick={() => setRemovable(['Under $50', 'Like new'])}>
              Reset chips
            </Button>
          )}
        </div>
      </Section>

      <Section
        title="Listing card"
        note="Default · hover (border + photo zoom) · sold. Grid: 2 columns under 640 px, 3 up to 1024 px, 4 above."
      >
        <div className="listing-grid">
          <ListingCard listing={sampleListings[0]} />
          <ListingCard listing={sampleListings[4]} />
          <ListingCard listing={soldListing} />
          <ListingCard listing={sampleListings[2]} />
        </div>
      </Section>

      <Section title="Seller badge">
        <div className="flex flex-wrap gap-8">
          <SellerBadge name="Maya Patel" verified rating={4.8} reviewCount={12} memberSince="2025" />
          <SellerBadge name="Jordan Lee" verified rating={5} reviewCount={1} />
          <SellerBadge name="Sam Rivera" memberSince="2026" />
        </div>
      </Section>

      <Section
        title="Filter panel"
        note="Side panel at 1024 px and wider. Narrow the window to get the bottom sheet."
      >
        <div className="max-w-xs rounded-card bg-panel p-4">
          <FilterPanel activeCount={conditions.length} resultCount={8} onClear={() => setConditions([])}>
            <FilterCheckboxes
              legend="Condition"
              options={CONDITIONS}
              selected={conditions}
              onChange={setConditions}
            />
          </FilterPanel>
        </div>
      </Section>

      <Section title="Modal" note="Closes with Esc, a click outside, or the close button.">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary" className="self-start">
              Open modal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete this listing?</DialogTitle>
              <DialogDescription>
                People who saved it won’t see it anymore. You can’t undo this.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="secondary">Keep listing</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="destructive" onClick={() => toast.success('Listing deleted')}>
                  Delete listing
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      <Section title="Empty state">
        <EmptyState
          title="No listings match."
          description="Try a different search or fewer filters."
          action={<Button>Clear filters</Button>}
        />
        <EmptyState
          icon={Inbox}
          title="No messages yet."
          action={<Button variant="secondary">Browse listings</Button>}
        />
      </Section>

      <Section title="Toast">
        <div className="flex flex-wrap gap-4">
          <Button variant="secondary" onClick={() => toast('Draft saved')}>
            Default
          </Button>
          <Button variant="secondary" onClick={() => toast.success('Listing posted')}>
            Success
          </Button>
          <Button variant="secondary" onClick={() => toast.warning('Trade offer pending')}>
            Warning
          </Button>
          <Button variant="secondary" onClick={() => toast.error('Couldn’t upload photo. Try again.')}>
            Error
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast('Marked as sold', { action: { label: 'Undo', onClick: () => {} } })}
          >
            With action
          </Button>
        </div>
      </Section>
    </main>
  )
}

export default DesignSystem
