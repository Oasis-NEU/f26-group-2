import { Route, Routes, useLocation } from 'react-router'

import RedirectIfSignedIn from './auth/RedirectIfSignedIn'
import RequireAuth from './auth/RequireAuth'
import Footer from './components/Footer'
import Conversation from './pages/Conversation'
import Dashboard from './pages/Dashboard'
import DesignSystem from './pages/DesignSystem'
import ForgotPassword from './pages/ForgotPassword'
import HomeFeed from './pages/HomeFeed'
import Inbox from './pages/Inbox'
import Landing from './pages/Landing'
import ListingDetail from './pages/ListingDetail'
import Login from './pages/Login'
import Logout from './pages/Logout'
import Profile from './pages/Profile'
import ResetPassword from './pages/ResetPassword'
import Sell from './pages/Sell'
import Signup from './pages/Signup'
import Terms from './pages/Terms'

// Log-in and account pages stay focused on the form, so they skip the footer.
const NO_FOOTER_PATHS = ['/login', '/logout', '/signup', '/forgot-password', '/reset-password']

function App() {
  const { pathname } = useLocation()
  const showFooter = !NO_FOOTER_PATHS.includes(pathname)

  return (
    <>
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
        <Route path="/terms" element={<Terms />} />
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
        {/* Messaging: the inbox, one conversation, and a buyer's first message
            about a listing (the conversation is created when it's sent). */}
        <Route
          path="/messages"
          element={
            <RequireAuth>
              <Inbox />
            </RequireAuth>
          }
        />
        <Route
          path="/messages/:id"
          element={
            <RequireAuth>
              <Conversation />
            </RequireAuth>
          }
        />
        <Route
          path="/messages/new/:listingId"
          element={
            <RequireAuth>
              <Conversation />
            </RequireAuth>
          }
        />
      </Routes>
      {showFooter && <Footer />}
    </>
  )
}

export default App
