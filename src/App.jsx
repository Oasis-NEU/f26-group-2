import { Route, Routes } from 'react-router'

import RedirectIfSignedIn from './auth/RedirectIfSignedIn'
import RequireAuth from './auth/RequireAuth'
import Dashboard from './pages/Dashboard'
import DesignSystem from './pages/DesignSystem'
import ForgotPassword from './pages/ForgotPassword'
import HomeFeed from './pages/HomeFeed'
import Landing from './pages/Landing'
import ListingDetail from './pages/ListingDetail'
import Login from './pages/Login'
import Logout from './pages/Logout'
import Profile from './pages/Profile'
import ResetPassword from './pages/ResetPassword'
import Sell from './pages/Sell'
import Signup from './pages/Signup'

function App() {
  return (
    <Routes>
      {/* Public: anyone can see these */}
      {/* Home page is for logged-out visitors; logged-in users go to /browse */}
      <Route
        path="/"
        element={
          <RedirectIfSignedIn>
            <Landing />
          </RedirectIfSignedIn>
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/logout" element={<Logout />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      {/* Not wrapped in RequireAuth: the reset link logs the user in on arrival,
          and the page shows its own message when the link is bad. */}
      <Route path="/reset-password" element={<ResetPassword />} />
      {/* Logged-out visitors see card info only; details need a login. */}
      <Route path="/browse" element={<HomeFeed />} />
      {/* Component reference for the team; not linked from the app. */}
      <Route path="/design-system" element={<DesignSystem />} />

      {/* Protected: only logged-in, verified users */}
      <Route
        path="/sell"
        element={
          <RequireAuth>
            <Sell />
          </RequireAuth>
        }
      />
      <Route
        path="/listings/:id"
        element={
          <RequireAuth>
            <ListingDetail />
          </RequireAuth>
        }
      />
      {/* Same form as /sell, filled in with the listing's current values. */}
      <Route
        path="/listings/:id/edit"
        element={
          <RequireAuth>
            <Sell />
          </RequireAuth>
        }
      />
      {/* Seller dashboard: manage your own listings. */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <Dashboard />
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Profile />
          </RequireAuth>
        }
      />
    </Routes>
  )
}

export default App
