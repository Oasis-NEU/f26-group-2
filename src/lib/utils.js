import { clsx } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// tailwind-merge has to know our custom type-scale names, otherwise it treats
// `text-price` (a size) and `text-ink` (a color) as the same group and drops one.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['page', 'section', 'price', 'body', 'small'] }],
    },
  },
})

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
