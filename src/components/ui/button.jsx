import { cva } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { Slot } from 'radix-ui'

import { cn } from '@/lib/utils'

// Tailwind runs without its preflight reset here, so the base classes also clear
// the browser's default <button> margin, padding and border.
const buttonVariants = cva(
  'm-0 inline-flex shrink-0 cursor-pointer appearance-none items-center justify-center gap-2 rounded-control border border-transparent py-0 text-[15px] font-semibold whitespace-nowrap no-underline transition-[background-color,border-color,filter] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 aria-busy:cursor-wait [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // One primary (red) button per view.
        primary: 'bg-primary text-primary-foreground hover:brightness-110',
        secondary: 'border-border-strong bg-transparent text-foreground hover:bg-card',
        // Outlined in the error red so it never reads as the primary action.
        destructive:
          'border-destructive/60 bg-transparent text-destructive hover:border-destructive hover:bg-destructive/10',
        ghost: 'bg-transparent text-foreground hover:bg-accent',
        link: 'h-auto bg-transparent px-0 text-primary-text underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        // 44 px on phones (minimum tap target), 40 px from 640 px up.
        default: 'h-11 px-4 sm:h-10',
        lg: 'h-12 px-6 text-body font-semibold',
        icon: 'size-11 sm:size-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

/**
 * Button — variants: primary | secondary | destructive | ghost | link.
 * States: hover, focus-visible, disabled, and `loading` (spinner, disabled, aria-busy).
 * Use `asChild` to style a <Link>: <Button asChild><Link to="/sell">Sell</Link></Button>
 */
function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  type,
  children,
  ...props
}) {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      type={asChild ? undefined : (type ?? 'button')}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
          {children}
        </>
      )}
    </Comp>
  )
}

// buttonVariants is exported (as in shadcn) so other elements can reuse the styles.
// oxlint-disable-next-line react/only-export-components
export { Button, buttonVariants }
