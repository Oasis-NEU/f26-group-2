import type {
  SELL_CATEGORIES,
  SELL_CONDITIONS,
  SELL_PAYMENT_METHODS,
  SELL_PICKUP_SPOTS,
} from '../data/sellOptions'

export type ListingCategory = (typeof SELL_CATEGORIES)[number]
export type ListingCondition = (typeof SELL_CONDITIONS)[number]
export type PaymentMethod = (typeof SELL_PAYMENT_METHODS)[number]
export type PickupSpot = (typeof SELL_PICKUP_SPOTS)[number]

// What the Sell form (src/pages/Sell.jsx) produces on submit. Field names use
// snake_case to line up with the listings table. Values are the display labels
// from src/data/sellOptions.ts; the backend maps them to its enum values.
export interface NewListing {
  // Images in display order; the first one is the cover. 0–6 files, each
  // 5 MB or less. Not uploaded yet.
  photos: File[]
  // 1–80 characters, trimmed.
  title: string
  // Required. 1–1000 characters, trimmed.
  description: string
  // Whole cents, 0 or more. 0 means the item is free.
  price_cents: number
  category: ListingCategory
  // Only set for Textbooks, normalized like "CS 2500". Otherwise null.
  course_code: string | null
  condition: ListingCondition
  // At least one.
  payment_methods: PaymentMethod[]
  pickup_spot: PickupSpot
  // 0–5 tags, trimmed, lowercase, no duplicates.
  tags: string[]
}
