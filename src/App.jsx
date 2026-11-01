import { Route, Routes } from 'react-router'

import HomeFeed from './pages/HomeFeed'
import Landing from './pages/Landing'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/browse" element={<HomeFeed />} />
    </Routes>
  )
}

export default App
