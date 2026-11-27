-- Sellers can accept PayPal and Apple Cash.
-- Labels in the app: src/data/sellOptions.ts, createListing.js, listings.js.
alter type public.payment_method add value if not exists 'paypal';
alter type public.payment_method add value if not exists 'apple_cash';
