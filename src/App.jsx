import { Route, Routes } from 'react-router'

import RequireAuth from './auth/RequireAuth'
import ForgotPassword from './pages/ForgotPassword'
import HomeFeed from './pages/HomeFeed'
import Landing from './pages/Landing'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Sell from './pages/Sell'
import Signup from './pages/Signup'

function App() {
  return (
    <Routes>
      {/* Public: anyone can see these */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      {/* Not wrapped in RequireAuth: the reset link logs the user in on arrival,
          and the page shows its own message when the link is bad. */}
      <Route path="/reset-password" element={<ResetPassword />} />
      {/* Logged-out visitors see card info only; details need a login. */}
      <Route path="/browse" element={<HomeFeed />} />

      {/* Protected: only logged-in, verified users */}
      <Route
        path="/sell"
        element={
          <RequireAuth>
            <Sell />
          </RequireAuth>
        }
      />
    </Routes>
  )
}

export default App
