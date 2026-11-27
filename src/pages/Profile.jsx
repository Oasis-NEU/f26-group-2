import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { useAuth } from '../auth/AuthContext'
import Nav from '../components/Nav'
import {
  changePassword,
  deleteMyAccount,
  fetchMyProfile,
  updateMyProfile,
  uploadAvatar,
} from '../data/profile'
import { getInitials } from '../utils/initials'
import './Sell.css'
import './Profile.css'

const MAX_NAME = 50
const MAX_PHOTO_MB = 5
const MIN_PASSWORD_LENGTH = 8
const MIN_GRAD_YEAR = 1950
const MAX_GRAD_YEAR = new Date().getFullYear() + 8
const DELETE_WORD = 'DELETE'

const AFFILIATIONS = [
  { value: 'student', label: 'Current student' },
  { value: 'alum', label: 'Alum' },
]

// ── Profile details ─────────────────────────────────────────────────────────

function ProfileForm({ userId, profile, onSaved }) {
  const [name, setName] = useState(profile.display_name)
  const [gradYear, setGradYear] = useState(profile.grad_year ? String(profile.grad_year) : '')
  const [affiliation, setAffiliation] = useState(profile.affiliation)
  const [photo, setPhoto] = useState(null) // { file, url } for a newly picked photo
  const [removePhoto, setRemovePhoto] = useState(false) // true = clear the photo on save
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Free the preview URL when it's replaced or the page closes.
  useEffect(() => () => photo && URL.revokeObjectURL(photo.url), [photo])

  function handlePhoto(event) {
    const file = event.target.files[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors({ photo: `${file.name} isn’t an image.` })
      return
    }
    if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
      setErrors({ photo: `Choose a photo under ${MAX_PHOTO_MB} MB.` })
      return
    }
    setErrors((current) => ({ ...current, photo: '' }))
    setRemovePhoto(false)
    setPhoto({ file, url: URL.createObjectURL(file) })
  }

  function handleRemovePhoto() {
    setPhoto(null)
    setRemovePhoto(true)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    const nextErrors = {}
    const trimmedName = name.trim()
    if (!trimmedName) nextErrors.name = 'Add your name.'
    else if (trimmedName.length > MAX_NAME) nextErrors.name = `Keep your name to ${MAX_NAME} characters.`

    const year = gradYear.trim() ? Number(gradYear) : null
    if (year !== null && (!Number.isInteger(year) || year < MIN_GRAD_YEAR || year > MAX_GRAD_YEAR)) {
      nextErrors.gradYear = `Enter a year between ${MIN_GRAD_YEAR} and ${MAX_GRAD_YEAR}, or leave it blank.`
    }

    setErrors(nextErrors)
    if (nextErrors.name) return document.getElementById('profile-name').focus()
    if (nextErrors.gradYear) return document.getElementById('profile-grad-year').focus()

    setSaving(true)
    try {
      let avatarUrl = profile.avatar_url
      if (photo) avatarUrl = await uploadAvatar(userId, photo.file)
      else if (removePhoto) avatarUrl = null
      const saved = await updateMyProfile(
        userId,
        { display_name: trimmedName, grad_year: year, affiliation, avatar_url: avatarUrl },
        profile.avatar_url,
      )
      setPhoto(null)
      setRemovePhoto(false)
      onSaved(saved)
      setMessage('Profile saved.')
    } catch (error) {
      console.error(error)
      setMessage('')
      setErrors({ form: 'Couldn’t save your profile. Check your connection and try again.' })
    } finally {
      setSaving(false)
    }
  }

  const previewUrl = photo?.url ?? (removePhoto ? null : profile.avatar_url)
  const photoChanged = Boolean(photo) || removePhoto

  return (
    <section className="sell__card" aria-labelledby="profile-details-heading">
      <h2 className="sell__section-title" id="profile-details-heading">
        Profile
      </h2>

      <form className="profile__form" onSubmit={handleSubmit} noValidate>
        <div className="profile__photo-row">
          <div className="profile__avatar" aria-hidden="true">
            {previewUrl ? <img src={previewUrl} alt="" /> : getInitials(name)}
          </div>
          <div className="profile__photo-actions">
            <div className="profile__photo-buttons">
              <label className="btn btn--secondary" htmlFor="profile-photo">
                {previewUrl ? 'Change photo' : 'Add photo'}
              </label>
              {previewUrl && (
                <button className="btn btn--secondary" type="button" onClick={handleRemovePhoto}>
                  Remove
                </button>
              )}
            </div>
            <input
              id="profile-photo"
              className="visually-hidden"
              type="file"
              accept="image/*"
              aria-describedby="profile-photo-hint"
              onChange={handlePhoto}
            />
            <p className="field__hint" id="profile-photo-hint">
              {photoChanged
                ? 'Save your profile to apply this change.'
                : `JPG or PNG, up to ${MAX_PHOTO_MB} MB.`}
            </p>
          </div>
        </div>
        {errors.photo && (
          <p className="field__error" role="alert">
            {errors.photo}
          </p>
        )}

        <div className="field">
          <div className="field__label-row">
            <label className="field__label" htmlFor="profile-name">
              Display name
            </label>
            <span className="field__count">
              {name.length}/{MAX_NAME}
            </span>
          </div>
          <input
            id="profile-name"
            className="text-input"
            type="text"
            autoComplete="name"
            maxLength={MAX_NAME}
            required
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'profile-name-error' : undefined}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          {errors.name && (
            <p className="field__error" id="profile-name-error">
              {errors.name}
            </p>
          )}
        </div>

        <fieldset className="field">
          <legend className="field__label">Status</legend>
          <div className="option-row">
            {AFFILIATIONS.map((option) => (
              <label key={option.value} className="option-pill">
                <input
                  type="radio"
                  name="affiliation"
                  value={option.value}
                  checked={affiliation === option.value}
                  onChange={() => setAffiliation(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="field">
          <label className="field__label" htmlFor="profile-grad-year">
            Graduation year <span className="field__optional">optional</span>
          </label>
          <input
            id="profile-grad-year"
            className="text-input profile__year"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 2027"
            maxLength={4}
            aria-invalid={Boolean(errors.gradYear)}
            aria-describedby={errors.gradYear ? 'profile-grad-year-error' : undefined}
            value={gradYear}
            onChange={(event) => setGradYear(event.target.value.replace(/\D/g, ''))}
          />
          {errors.gradYear && (
            <p className="field__error" id="profile-grad-year-error">
              {errors.gradYear}
            </p>
          )}
        </div>

        {errors.form && (
          <p className="field__error" role="alert">
            {errors.form}
          </p>
        )}
        {message && (
          <p className="profile__success" role="status">
            {message}
          </p>
        )}

        <button className="btn btn--primary profile__submit" type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
      </form>
    </section>
  )
}

// ── Listings ────────────────────────────────────────────────────────────────

// Listings are managed on the seller dashboard. The nav link to it is hidden
// on phones, so the profile links there too.
function ListingsLink() {
  return (
    <section className="sell__card" aria-labelledby="profile-listings-heading">
      <div className="profile__section-head">
        <div>
          <h2 className="sell__section-title" id="profile-listings-heading">
            Your listings
          </h2>
          <p className="field__hint profile__section-hint">
            Edit, change status, or remove listings on your seller dashboard.
          </p>
        </div>
        <Link className="btn btn--secondary" to="/dashboard">
          Open dashboard
        </Link>
      </div>
    </section>
  )
}

// ── Password ────────────────────────────────────────────────────────────────

function PasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`)
      return
    }
    if (password !== confirm) {
      setError('Passwords don’t match.')
      return
    }

    setSaving(true)
    try {
      await changePassword(password)
      setPassword('')
      setConfirm('')
      setMessage('Password updated.')
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="sell__card" aria-labelledby="profile-password-heading">
      <h2 className="sell__section-title" id="profile-password-heading">
        Password
      </h2>
      <form className="profile__form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label className="field__label" htmlFor="profile-new-password">
            New password
          </label>
          <input
            id="profile-new-password"
            className="text-input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>
        <div className="field">
          <label className="field__label" htmlFor="profile-confirm-password">
            Confirm new password
          </label>
          <input
            id="profile-confirm-password"
            className="text-input"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
          />
        </div>
        {error && (
          <p className="field__error" role="alert">
            {error}
          </p>
        )}
        {message && (
          <p className="profile__success" role="status">
            {message}
          </p>
        )}
        <button className="btn btn--secondary profile__submit" type="submit" disabled={saving}>
          {saving ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </section>
  )
}

// ── Delete account ──────────────────────────────────────────────────────────

function DeleteAccount({ userId, avatarUrl }) {
  const navigate = useNavigate()
  const [typed, setTyped] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  async function handleDelete(event) {
    event.preventDefault()
    if (typed !== DELETE_WORD) return

    setError('')
    setDeleting(true)
    try {
      await deleteMyAccount(userId, avatarUrl)
      // The account is gone; /logout clears the leftover session and goes home.
      navigate('/logout', { replace: true })
    } catch (error) {
      console.error(error)
      setError('Couldn’t delete your account. Try again, or log out and back in first.')
      setDeleting(false)
    }
  }

  return (
    <section className="sell__card profile__danger" aria-labelledby="profile-delete-heading">
      <h2 className="sell__section-title" id="profile-delete-heading">
        Delete account
      </h2>
      <p className="field__hint">
        This permanently deletes your profile, your listings and their photos, and your messages. It
        can’t be undone.
      </p>
      <form className="profile__form" onSubmit={handleDelete}>
        <div className="field">
          <label className="field__label" htmlFor="profile-delete-confirm">
            Type {DELETE_WORD} to confirm
          </label>
          <input
            id="profile-delete-confirm"
            className="text-input"
            type="text"
            autoComplete="off"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
          />
        </div>
        {error && (
          <p className="field__error" role="alert">
            {error}
          </p>
        )}
        <button
          className="btn btn--primary profile__submit"
          type="submit"
          disabled={typed !== DELETE_WORD || deleting}
        >
          {deleting ? 'Deleting…' : 'Delete my account'}
        </button>
      </form>
    </section>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────

function Profile() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    fetchMyProfile(user.id)
      .then(setProfile)
      .catch((error) => {
        console.error(error)
        setLoadError(true)
      })
  }, [user.id])

  return (
    <>
      <Nav variant="app" />

      <main className="container sell">
        <div className="sell__form">
          <header className="sell__header profile__header">
            <div>
              <h1 className="sell__title">Your profile</h1>
              <p className="sell__subtitle">{user.email}</p>
            </div>
            <button className="btn btn--secondary" type="button" onClick={() => navigate('/logout')}>
              Log out
            </button>
          </header>

          {loadError ? (
            <p className="field__error" role="alert">
              Couldn’t load your profile. Refresh the page to try again.
            </p>
          ) : !profile ? (
            <p className="field__hint">Loading your profile…</p>
          ) : (
            <>
              <ProfileForm userId={user.id} profile={profile} onSaved={setProfile} />
              <ListingsLink />
              <PasswordForm />
              <DeleteAccount userId={user.id} avatarUrl={profile.avatar_url} />
            </>
          )}
        </div>
      </main>
    </>
  )
}

export default Profile
