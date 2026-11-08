-- Sellers can accept Cash App.
alter type public.payment_method add value if not exists 'cashapp';
