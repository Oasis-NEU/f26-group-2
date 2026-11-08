import { Route, Routes } from 'react-router'

import RequireAuth from './auth/RequireAuth'
import HomeFeed from './pages/HomeFeed'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Sell from './pages/Sell'
import Signup from './pages/Signup'

function App() {
  return (
    <Routes>
      {/* Public: anyone can see these */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected: only logged-in, verified users */}
      <Route
        path="/browse"
        element={
          <RequireAuth>
            <HomeFeed />
          </RequireAuth>
        }
      />
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
