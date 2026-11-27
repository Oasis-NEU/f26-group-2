import { SlidersHorizontal } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { DESKTOP_QUERY, useMediaQuery } from '@/hooks/useMediaQuery'
import { cn } from '@/lib/utils'

/**
 * Filter panel — side panel on desktop (≥1024 px), bottom sheet on mobile.
 * Filter controls go in as children and are rendered once (no duplicate ids).
 */
function FilterPanel({ children, activeCount = 0, resultCount, onClear, className }) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY)

  if (isDesktop) {
    return (
      <aside aria-label="Filters" className={cn('w-60 shrink-0', className)}>
        <div className="mb-4 flex min-h-8 items-center justify-between">
          <h2 className="text-price">Filters</h2>
          {activeCount > 0 && (
            <Button variant="link" size="sm" onClick={onClear}>
              Clear all
            </Button>
          )}
        </div>
        <div className="flex flex-col">{children}</div>
      </aside>
    )
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary" className={cn('self-start', className)}>
          <SlidersHorizontal />
          Filters
          {activeCount > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] text-primary-foreground tabular-nums">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription className="visually-hidden">Narrow down the listings</SheetDescription>
        </SheetHeader>
        <SheetBody>{children}</SheetBody>
        <SheetFooter>
          <Button variant="secondary" className="flex-1" onClick={onClear} disabled={!activeCount}>
            Clear all
          </Button>
          <SheetClose asChild>
            <Button className="flex-1">
              {resultCount == null
                ? 'Show results'
                : `Show ${resultCount} ${resultCount === 1 ? 'result' : 'results'}`}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function FilterGroup({ legend, children }) {
  return (
    <fieldset className="m-0 flex min-w-0 flex-col gap-2 border-0 border-b border-border p-0 pb-4 not-first:pt-4 last:border-b-0">
      <legend className="float-left mb-2 p-0 text-sm font-semibold">{legend}</legend>
      <div className="clear-left flex flex-col gap-1">{children}</div>
    </fieldset>
  )
}

function toggle(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

function FilterCheckboxes({ legend, options, selected, onChange }) {
  return (
    <FilterGroup legend={legend}>
      {options.map((option) => (
        <label key={option} className="flex min-h-11 cursor-pointer items-center gap-2 text-sm sm:min-h-8">
          <Checkbox
            checked={selected.includes(option)}
            onCheckedChange={() => onChange(toggle(selected, option))}
          />
          {option}
        </label>
      ))}
    </FilterGroup>
  )
}

export { FilterCheckboxes, FilterGroup, FilterPanel }
export default FilterPanel
