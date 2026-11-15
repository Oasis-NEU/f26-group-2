// "Maya Chen" → "MC", "Priya" → "P", "maya.test" → "MT".
export function getInitials(name) {
  const words = (name ?? '').trim().split(/[\s._-]+/).filter(Boolean)
  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('')
}

// Initials for a logged-in Supabase user: the name saved at sign-up (or on
// the profile page), else the part of their email before the @.
export function getUserInitials(user) {
  return getInitials(user?.user_metadata?.display_name || user?.email?.split('@')[0])
}
