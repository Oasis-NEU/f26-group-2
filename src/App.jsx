import { Route, Routes } from 'react-router'

import HomeFeed from './pages/HomeFeed'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Sell from './pages/Sell'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/browse" element={<HomeFeed />} />
      <Route path="/login" element={<Login />} />
      <Route path="/sell" element={<Sell />} />
    </Routes>
  )
}

export default App
