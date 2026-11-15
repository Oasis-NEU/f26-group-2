// Turns a public Storage URL back into the file path inside its bucket, e.g.
// https://….supabase.co/storage/v1/object/public/avatars/<uid>/avatar-123.jpg
//   → "<uid>/avatar-123.jpg"
// Returns null for URLs that aren't in that bucket (like the seed data's
// picsum.photos images), so callers can skip them.
export function pathFromPublicUrl(bucket, url) {
  const marker = `/storage/v1/object/public/${bucket}/`
  const index = url?.indexOf(marker) ?? -1
  if (index === -1) return null
  return decodeURIComponent(url.slice(index + marker.length).split('?')[0])
}

export function fileExtension(file) {
  const fromName = file.name.includes('.') ? file.name.split('.').pop() : ''
  return (fromName || file.type.split('/')[1] || 'jpg').toLowerCase()
}
