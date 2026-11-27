import { SearchX } from 'lucide-react'

import { cn } from '@/lib/utils'

/**
 * Empty state — short message plus one action.
 *   <EmptyState title="No listings match." action={<Button onClick={clear}>Clear filters</Button>} />
 */
function EmptyState({ icon: Icon = SearchX, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-4 rounded-card border border-dashed border-control px-6 py-12 text-center',
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-section">{title}</p>
        {description && <p className="text-body text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export default EmptyState
