import { X } from 'lucide-react'
import { Slot } from 'radix-ui'

import { cn } from '@/lib/utils'

const chipBase =
  'm-0 inline-flex h-8 shrink-0 appearance-none items-center gap-1 rounded-full border px-3 py-0 text-small whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

const chipTone = (active) =>
  active
    ? 'border-foreground bg-foreground text-background'
    : 'border-border bg-card text-foreground hover:border-border-strong'

/**
 * Tag chip — fully rounded text label.
 *
 *   <TagChip active onClick={…}>Textbooks</TagChip>        clickable filter (aria-pressed)
 *   <TagChip asChild><Link to="…">Bikes</Link></TagChip>  as a link
 *   <TagChip onRemove={…}>Under $50</TagChip>              removable active filter
 */
function TagChip({ active = false, onRemove, asChild = false, className, children, ...props }) {
  if (onRemove) {
    return (
      <span className={cn(chipBase, chipTone(true), 'pr-1', className)} {...props}>
        {children}
        <button
          type="button"
          onClick={onRemove}
          className="m-0 flex size-6 cursor-pointer appearance-none items-center justify-center rounded-full border-0 bg-transparent p-0 text-background hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-ring"
        >
          <X className="size-3.5" aria-hidden="true" />
          <span className="visually-hidden">Remove {children}</span>
        </button>
      </span>
    )
  }

  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      type={asChild ? undefined : 'button'}
      aria-pressed={asChild ? undefined : active}
      className={cn(chipBase, 'cursor-pointer', chipTone(active), className)}
      {...props}
    >
      {children}
    </Comp>
  )
}

export default TagChip
