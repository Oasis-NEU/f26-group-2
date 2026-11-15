import { Navigate } from 'react-router'
import { useAuth } from './AuthContext'

// The opposite of RequireAuth: for pages only logged-out visitors should see,
// like the home page. Logged-in users go straight to the feed.
function RedirectIfSignedIn({ children }) {
  const { session, loading } = useAuth()

  // Wait until we know, so logged-in users don't see a flash of the page.
  if (loading) return null

  if (session) return <Navigate to="/browse" replace />

  return children
}

export default RedirectIfSignedIn
