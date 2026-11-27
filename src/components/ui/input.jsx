import { cn } from '@/lib/utils'

// 16 px text so iOS doesn't zoom in on focus.
function Input({ className, type = 'text', ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'm-0 h-11 w-full min-w-0 appearance-none rounded-control border border-input bg-card px-3 py-0 text-body text-foreground transition-colors outline-none placeholder:text-muted-foreground sm:h-10',
        'focus-visible:border-border-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
        '[&::-webkit-inner-spin-button]:appearance-none',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
