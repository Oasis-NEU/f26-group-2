data = await supabase.auth.sign_up({
  'email': 'valid.email@supabase.io',
  'password': 'example-password',
  'options': {
    'email_redirect_to': 'https://example.com/welcome',
  },
})

data = client.auth.sign_in_with_password({
  'email': 'valid.email@supabase.io',
  'password': 'example-password',
})