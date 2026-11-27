// Option lists for the Sell form. These are placeholders until the team
// settles them: change a list here and both the form and the NewListing type
// (src/types/newListing.ts) pick it up.

export const SELL_CATEGORIES = [
  'Textbooks',
  'Tickets',
  'Electronics',
  'Furniture',
  'Clothing',
  'Dorm & Kitchen',
  'Other',
] as const

export const SELL_CONDITIONS = ['New', 'Like new', 'Good', 'Fair', 'Old'] as const

export const SELL_PAYMENT_METHODS = ['Cash', 'Zelle', 'Cash App', 'Venmo', 'Open to trades'] as const

// No meetup: for tickets and other things the seller can send online.
export const ONLINE_PICKUP = 'Online transfer'

// General meeting spots only.
export const CAMPUS_PICKUP_SPOTS = [
  'Curry Student Center',
  'Snell Library',
  'ISEC',
  'EXP',
  'Krentzman Quad',
  'Centennial Commons',
  'Marino Center',
  'International Village',
  'Stetson East',
  'Stetson West',
  'Speare Hall',
  'West Village Quad',
  'Other',
] as const

export const SELL_PICKUP_SPOTS = [ONLINE_PICKUP, ...CAMPUS_PICKUP_SPOTS] as const