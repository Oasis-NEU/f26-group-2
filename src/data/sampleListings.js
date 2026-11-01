// Placeholder data matching the Figma mockups. Swap for Supabase queries once
// the listings UI is wired to the backend.
export const CATEGORIES = [
  'Textbooks',
  'Furniture',
  'Electronics',
  'Tickets',
  'Bikes',
  'Clothing',
  'Free',
]

export const CONDITIONS = ['New', 'Like new', 'Good', 'Fair']

export const PAYMENT_METHODS = ['Venmo', 'Zelle', 'Cash', 'Open to trade']

export const PICKUP_SPOTS = [
  'Curry Student Center',
  'Snell Library',
  'ISEC',
  'Anywhere on campus',
]

export const sampleListings = [
  {
    id: 1,
    title: 'Calculus: Early Transcendentals, 8th ed.',
    price_cents: 4500,
    category: 'Textbooks',
    condition: 'Good',
    payment_methods: ['Venmo', 'Cash', 'Open to trade'],
    pickup_spot: 'Snell Library',
    location_label: 'Snell Library',
    posted_ago: '2h ago',
  },
  {
    id: 2,
    title: 'IKEA desk lamp',
    price_cents: 1200,
    category: 'Furniture',
    condition: 'Like new',
    payment_methods: ['Venmo', 'Zelle'],
    pickup_spot: 'Anywhere on campus',
    location_label: 'West Village',
    posted_ago: '5h ago',
  },
  {
    id: 3,
    title: 'Trek FX 2 hybrid bike',
    price_cents: 28000,
    category: 'Bikes',
    condition: 'Good',
    payment_methods: ['Venmo', 'Cash'],
    pickup_spot: 'Anywhere on campus',
    location_label: 'Mission Hill',
    posted_ago: '1d ago',
  },
  {
    id: 4,
    title: '2 hockey tickets vs. BU',
    price_cents: 4000,
    category: 'Tickets',
    condition: 'New',
    payment_methods: ['Venmo', 'Zelle'],
    pickup_spot: 'Curry Student Center',
    location_label: 'Matthews Arena',
    posted_ago: '3h ago',
  },
  {
    id: 5,
    title: 'Mini fridge, 3.1 cu ft',
    price_cents: 6000,
    category: 'Appliances',
    condition: 'Good',
    payment_methods: ['Cash', 'Open to trade'],
    pickup_spot: 'Anywhere on campus',
    location_label: 'Stetson East',
    posted_ago: '6h ago',
  },
  {
    id: 6,
    title: 'Dell 27" monitor',
    price_cents: 9500,
    category: 'Electronics',
    condition: 'Like new',
    payment_methods: ['Venmo', 'Zelle', 'Cash'],
    pickup_spot: 'Curry Student Center',
    location_label: 'Curry Center',
    posted_ago: '1d ago',
  },
  {
    id: 7,
    title: 'Northeastern crewneck (M)',
    price_cents: 2000,
    category: 'Clothing',
    condition: 'Like new',
    payment_methods: ['Venmo', 'Cash'],
    pickup_spot: 'ISEC',
    location_label: 'ISEC',
    posted_ago: '8h ago',
  },
  {
    id: 8,
    title: 'TI-84 Plus CE calculator',
    price_cents: 7000,
    category: 'Electronics',
    condition: 'Good',
    payment_methods: ['Venmo', 'Open to trade'],
    pickup_spot: 'ISEC',
    location_label: 'Richards Hall',
    posted_ago: '2d ago',
  },
]
