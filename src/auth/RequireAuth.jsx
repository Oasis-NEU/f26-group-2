import { Navigate } from 'react-router'
import { useAuth } from './AuthContext'

// Wrap any page that only logged-in (and therefore verified) users may see:
//   <RequireAuth><HomeFeed /></RequireAuth>
function RequireAuth({ children }) {
  const { session, loading } = useAuth()

  // Still checking localStorage for a saved session: render nothing, or a
  // logged-in user would be bounced to /login on every refresh.
  if (loading) return null

  // Not logged in. `replace` keeps the Back button from looping back here.
  if (!session) return <Navigate to="/login" replace />

  return children
}

export default RequireAuth
