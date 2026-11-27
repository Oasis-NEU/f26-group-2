import { Navigate, useLocation } from 'react-router'
import { useAuth } from './AuthContext'

// Wrap any page that only logged-in (and therefore verified) users may see:
//   <RequireAuth><HomeFeed /></RequireAuth>
function RequireAuth({ children }) {
  const { session, loading } = useAuth()
  const location = useLocation()

  // Still checking localStorage for a saved session: render nothing, or a
  // logged-in user would be bounced to /login on every refresh.
  if (loading) return null

  // Not logged in. `replace` keeps the Back button from looping back here.
  // `from` lets the login page send them back here afterwards (for example,
  // someone opening a shared listing link).
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  return children
}

export default RequireAuth
