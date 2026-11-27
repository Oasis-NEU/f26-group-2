import { supabase } from '../supabaseClient'
import { fetchMyListings, removeListingPhotos } from './myListings'
import { fileExtension, pathFromPublicUrl } from './storagePaths'

const AVATAR_BUCKET = 'avatars'

// The columns a user may read and change on their own profile. The database
// only lets users update display_name, avatar_url, grad_year, and affiliation.
const PROFILE_COLUMNS = 'id, display_name, avatar_url, grad_year, affiliation, created_at'

export async function fetchMyProfile(userId) {
  const { data, error } = await supabase
    .from('users')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

// Uploads a new profile photo and returns its public URL. Each upload gets a
// new file name so browsers don't keep showing a cached old photo.
export async function uploadAvatar(userId, file) {
  const path = `${userId}/avatar-${Date.now()}.${fileExtension(file)}`
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { contentType: file.type })
  if (error) throw error
  return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl
}

// Saves profile changes. Also copies the name and photo onto the login
// session (user_metadata), which the nav bar reads for the avatar.
export async function updateMyProfile(userId, changes, previousAvatarUrl) {
  const { data, error } = await supabase
    .from('users')
    .update(changes)
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .single()
  if (error) throw error

  await supabase.auth.updateUser({
    data: { display_name: data.display_name, avatar_url: data.avatar_url },
  })

  // Clean up the old photo once the new one is saved.
  if (previousAvatarUrl && previousAvatarUrl !== data.avatar_url) {
    const oldPath = pathFromPublicUrl(AVATAR_BUCKET, previousAvatarUrl)
    if (oldPath) await supabase.storage.from(AVATAR_BUCKET).remove([oldPath])
  }

  return data
}

// Permanently deletes the account: photos first (only the owner can remove
// them), then the account itself, which also removes the profile, listings,
// and messages in the database. The caller should then go to /logout to
// clear the now-useless session.
export async function deleteMyAccount(userId, avatarUrl) {
  const listings = await fetchMyListings(userId)
  await removeListingPhotos(listings.flatMap((listing) => listing.image_urls))
  const avatarPath = pathFromPublicUrl(AVATAR_BUCKET, avatarUrl)
  if (avatarPath) await supabase.storage.from(AVATAR_BUCKET).remove([avatarPath])

  const { error } = await supabase.rpc('delete_my_account')
  if (error) throw error
}

export async function changePassword(password) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error
}
