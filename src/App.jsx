import { useEffect, useState } from 'react'

import { supabase } from './supabaseClient'

function App() {
  const [listings, setListings] = useState([])

  useEffect(() => {
    async function getListings() {
      const { data, error } = await supabase.from('listings').select('id, title')

      if (error) {
        console.error(error)
        return
      }

      setListings(data)
    }

    getListings()
  }, [])

  return (
    <ul>
      {listings.map((listing) => (
        <li key={listing.id}>{listing.title}</li>
      ))}
    </ul>
  )
}

export default App
