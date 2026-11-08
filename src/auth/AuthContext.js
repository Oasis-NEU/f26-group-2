import { createContext, useContext } from 'react'

// Lives in its own file (not AuthProvider.jsx) because the linter wants
// component files to export only components, so fast refresh keeps working.
export const AuthContext = createContext(null)

// Any component can call useAuth() to get { session, user, loading }.
export function useAuth() {
  return useContext(AuthContext)
}
