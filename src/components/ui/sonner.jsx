import { Toaster as Sonner } from 'sonner'

// Toast. <Toaster /> is mounted once in main.jsx; fire toasts from anywhere:
//   import { toast } from 'sonner'
//   toast.success('Listing posted')  ·  toast.error('Couldn’t upload photo')  ·  toast('Draft saved')
function Toaster(props) {
  return (
    <Sonner
      theme="dark"
      position="bottom-center"
      style={{
        '--normal-bg': 'var(--bg-alt)',
        '--normal-text': 'var(--text)',
        '--normal-border': 'var(--border-strong)',
        '--border-radius': 'var(--radius-card)',
        fontFamily: 'var(--sans)',
      }}
      toastOptions={{
        classNames: {
          toast: 'text-[15px] !shadow-none',
          description: '!text-muted-foreground',
          actionButton: '!bg-primary !text-primary-foreground !font-semibold',
          success: '[&_[data-icon]]:text-success',
          warning: '[&_[data-icon]]:text-warning',
          error: '[&_[data-icon]]:text-destructive',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
