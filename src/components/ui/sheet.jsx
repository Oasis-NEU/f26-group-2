import { X } from 'lucide-react'
import { Dialog as SheetPrimitive } from 'radix-ui'

import { closeButtonClass, overlayClass } from '@/components/ui/styles'
import { cn } from '@/lib/utils'

// Sheet — a dialog that slides in from an edge. Used as the mobile bottom sheet.
const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close

const SIDES = {
  bottom:
    'inset-x-0 bottom-0 max-h-[85svh] rounded-t-card border-t data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom',
  right:
    'inset-y-0 right-0 h-full w-3/4 max-w-sm border-l data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
  left: 'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
}

function SheetContent({ className, children, side = 'bottom', ...props }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className={overlayClass} />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          'fixed z-50 flex flex-col border-0 border-border bg-panel text-foreground outline-none data-[state=open]:animate-in data-[state=open]:duration-300 data-[state=closed]:animate-out data-[state=closed]:duration-200',
          SIDES[side],
          className,
        )}
        {...props}
      >
        {side === 'bottom' && (
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-control" aria-hidden="true" />
        )}
        {children}
        <SheetPrimitive.Close className={closeButtonClass}>
          <X className="size-4" aria-hidden="true" />
          <span className="visually-hidden">Close</span>
        </SheetPrimitive.Close>
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  )
}

function SheetHeader({ className, ...props }) {
  return <div className={cn('flex flex-col gap-1 px-4 pt-4 pb-2', className)} {...props} />
}

function SheetBody({ className, ...props }) {
  return <div className={cn('flex-1 overflow-y-auto px-4 pb-4', className)} {...props} />
}

function SheetFooter({ className, ...props }) {
  return (
    <div
      className={cn('flex gap-2 border-0 border-t border-border p-4', className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }) {
  return <SheetPrimitive.Title className={cn('m-0 text-section', className)} {...props} />
}

function SheetDescription({ className, ...props }) {
  return (
    <SheetPrimitive.Description
      className={cn('text-small text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
}
