import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

import Nav from '../components/Nav'
import {
  SELL_CATEGORIES,
  SELL_CONDITIONS,
  SELL_PAYMENT_METHODS,
  SELL_PICKUP_SPOTS,
} from '../data/sellOptions'
import './Sell.css'

const MAX_PHOTOS = 6
const MAX_PHOTO_MB = 5
const MAX_TITLE = 80
const MAX_DESCRIPTION = 1000
const MAX_TAGS = 5
const MAX_TAG_LENGTH = 24

// Whole dollars (up to $999,999) with an optional 1–2 digit cents part.
const PRICE_PATTERN = /^\d{1,6}(\.\d{1,2})?$/
// Subject letters plus a 4-digit course number, e.g. "CS 2500" or "math1341".
const COURSE_CODE_PATTERN = /^([a-z]{2,4})\s*(\d{4})$/i

const EMPTY_FORM = {
  title: '',
  description: '',
  price: '',
  category: '',
  courseCode: '',
  condition: '',
  paymentMethods: [],
  pickupSpot: '',
  tags: [],
}

// In page order: after a failed submit, focus moves to the first field with an error.
const FIELD_IDS = {
  title: 'sell-title',
  description: 'sell-description',
  price: 'sell-price',
  category: 'sell-category',
  courseCode: 'sell-course-code',
  condition: 'sell-condition-0',
  paymentMethods: 'sell-payment-0',
  pickupSpot: 'sell-pickup',
}

function errorId(field) {
  return `sell-${field}-error`
}

// Joins the ids that exist into an aria-describedby value.
function describedBy(...ids) {
  return ids.filter(Boolean).join(' ') || undefined
}

function toggle(list, value) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}

// Accepts "12.50", "$12.50" and "1,200".
function normalizePrice(value) {
  return value.trim().replace(/^\$/, '').replace(/,/g, '')
}

// Works on the string so 19.99 becomes exactly 1999 cents.
function priceToCents(price) {
  const [dollars, cents = ''] = price.split('.')
  return Number(dollars) * 100 + Number(cents.padEnd(2, '0'))
}

function validate(form) {
  const errors = {}

  const title = form.title.trim()
  if (!title) errors.title = 'Add a title.'
  else if (title.length > MAX_TITLE) errors.title = `Keep the title to ${MAX_TITLE} characters.`

  const description = form.description.trim()
  if (!description) errors.description = 'Add a description.'
  else if (description.length > MAX_DESCRIPTION) {
    errors.description = `Keep the description to ${MAX_DESCRIPTION} characters.`
  }

  const price = normalizePrice(form.price)
  if (!price) errors.price = 'Enter a price. Use 0 if it’s free.'
  else if (!PRICE_PATTERN.test(price)) {
    errors.price = 'Enter an amount like 25 or 12.50 (0 or more, up to 2 decimals).'
  }

  if (!form.category) errors.category = 'Choose a category.'

  const courseCode = form.courseCode.trim()
  if (form.category === 'Textbooks' && courseCode && !COURSE_CODE_PATTERN.test(courseCode)) {
    errors.courseCode = 'Use a course code like CS 2500.'
  }

  if (!form.condition) errors.condition = 'Choose a condition.'
  if (!form.paymentMethods.length) errors.paymentMethods = 'Pick at least one payment method.'
  if (!form.pickupSpot) errors.pickupSpot = 'Choose a pickup spot.'

  return errors
}

/** @returns {import('../types/newListing').NewListing} */
function buildListing(form, photos) {
  const course = form.courseCode.trim().match(COURSE_CODE_PATTERN)

  return {
    photos: photos.map((photo) => photo.file),
    title: form.title.trim(),
    description: form.description.trim(),
    price_cents: priceToCents(normalizePrice(form.price)),
    category: form.category,
    course_code:
      form.category === 'Textbooks' && course ? `${course[1].toUpperCase()} ${course[2]}` : null,
    condition: form.condition,
    payment_methods: SELL_PAYMENT_METHODS.filter((method) => form.paymentMethods.includes(method)),
    pickup_spot: form.pickupSpot,
    tags: form.tags,
  }
}

function Required() {
  return (
    <span className="field__required" aria-hidden="true">
      *
    </span>
  )
}

function FieldError({ field, message, live = false }) {
  if (!message) return null
  return (
    <p className="field__error" id={errorId(field)} role={live ? 'alert' : undefined}>
      {message}
    </p>
  )
}

function Sell() {
  const [form, setForm] = useState(EMPTY_FORM)
  const [photos, setPhotos] = useState([]) // [{ id, file, url }]
  const [tagDraft, setTagDraft] = useState('')
  const [errors, setErrors] = useState({})
  const [summary, setSummary] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const nextPhotoId = useRef(0)
  const photoInputRef = useRef(null)
  const tagInputRef = useRef(null)
  const doneHeadingRef = useRef(null)

  // Free the thumbnail URLs when leaving the page.
  const photosRef = useRef(photos)
  useEffect(() => {
    photosRef.current = photos
  }, [photos])
  useEffect(() => () => photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url)), [])

  useEffect(() => {
    if (submitted) doneHeadingRef.current?.focus()
  }, [submitted])

  function setFieldError(field, message) {
    setErrors((current) => ({ ...current, [field]: message }))
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    if (errors[field]) setFieldError(field, '')
  }

  function handlePhotos(event) {
    const files = Array.from(event.target.files)
    event.target.value = '' // lets the same file be picked again after removing it

    const problems = []
    const accepted = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) problems.push(`${file.name} isn’t an image.`)
      else if (file.size > MAX_PHOTO_MB * 1024 * 1024) {
        problems.push(`${file.name} is over ${MAX_PHOTO_MB} MB.`)
      } else accepted.push(file)
    }

    const room = MAX_PHOTOS - photos.length
    const skipped = accepted.length - room
    if (skipped > 0) {
      problems.push(
        `You can add up to ${MAX_PHOTOS} photos, so ${skipped} ${skipped === 1 ? 'wasn’t' : 'weren’t'} added.`,
      )
    }

    const added = accepted.slice(0, room).map((file) => ({
      id: nextPhotoId.current++,
      file,
      url: URL.createObjectURL(file),
    }))
    setPhotos([...photos, ...added])
    setFieldError('photos', problems.join(' '))
  }

  function removePhoto(id) {
    const photo = photos.find((item) => item.id === id)
    URL.revokeObjectURL(photo.url)
    setPhotos(photos.filter((item) => item.id !== id))
    setFieldError('photos', '')
    // The input may have been disabled at the limit, so focus it after React re-renders.
    requestAnimationFrame(() => photoInputRef.current?.focus())
  }

  function addTag() {
    const tag = tagDraft.trim().replace(/^#/, '').toLowerCase()
    if (!tag) return
    if (form.tags.length >= MAX_TAGS) {
      setFieldError('tags', `You can add up to ${MAX_TAGS} tags.`)
      return
    }
    if (form.tags.includes(tag)) {
      setFieldError('tags', `“${tag}” is already added.`)
      return
    }
    update('tags', [...form.tags, tag])
    setTagDraft('')
  }

  function handleTagKeyDown(event) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      addTag()
    }
  }

  function removeTag(tag) {
    update(
      'tags',
      form.tags.filter((item) => item !== tag),
    )
    tagInputRef.current?.focus()
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return

    const nextErrors = validate(form)
    setErrors(nextErrors)
    const invalid = Object.keys(FIELD_IDS).filter((field) => nextErrors[field])
    if (invalid.length) {
      setSummary(
        `Fix the ${invalid.length === 1 ? 'highlighted field' : `${invalid.length} highlighted fields`} to continue.`,
      )
      document.getElementById(FIELD_IDS[invalid[0]])?.focus()
      return
    }

    setSummary('')
    setSubmitting(true)
    const listing = buildListing(form, photos)

    // Front end only for now: nothing is saved. Replace this delay with the
    // Supabase photo uploads and listings insert.
    await new Promise((resolve) => setTimeout(resolve, 600))
    console.log('New listing', listing)

    setSubmitting(false)
    setSubmitted(true)
  }

  function startOver() {
    photos.forEach((photo) => URL.revokeObjectURL(photo.url))
    setPhotos([])
    setForm(EMPTY_FORM)
    setTagDraft('')
    setErrors({})
    setSubmitted(false)
  }

  const price = normalizePrice(form.price)
  const isFree = PRICE_PATTERN.test(price) && priceToCents(price) === 0
  const photosFull = photos.length >= MAX_PHOTOS

  if (submitted) {
    return (
      <>
        <Nav variant="app" />
        <main className="container sell">
          <section className="sell__card sell__done" aria-labelledby="sell-done-title">
            <span className="sell__done-icon" aria-hidden="true">
              ✓
            </span>
            <h1 className="sell__title sell__done-title" id="sell-done-title" tabIndex={-1} ref={doneHeadingRef}>
              Your listing is ready
            </h1>
            <p className="sell__subtitle">
              Posting isn’t connected yet, so nothing was saved. The listing data is in the browser
              console.
            </p>
            <div className="sell__done-actions">
              <button className="btn btn--primary" type="button" onClick={startOver}>
                List another item
              </button>
              <Link className="btn btn--secondary" to="/browse">
                Back to browse
              </Link>
            </div>
          </section>
        </main>
      </>
    )
  }

  return (
    <>
      <Nav variant="app" />

      <main className="container sell">
        <form className="sell__form" onSubmit={handleSubmit} noValidate>
          <header className="sell__header">
            <h1 className="sell__title">Sell an item</h1>
            <p className="sell__subtitle">Fields marked * are required.</p>
          </header>

          <section className="sell__card" aria-labelledby="sell-photos-heading">
            <h2 className="sell__section-title" id="sell-photos-heading">
              Photos
            </h2>
            <p className="field__hint" id="sell-photos-hint">
              Up to {MAX_PHOTOS} photos, {MAX_PHOTO_MB} MB each. The first one is the cover.
            </p>

            <ul className="photo-grid">
              {photos.map((photo, index) => (
                <li key={photo.id} className="photo-grid__item">
                  <img src={photo.url} alt={`Photo ${index + 1}: ${photo.file.name}`} />
                  {index === 0 && <span className="photo-grid__cover">Cover</span>}
                  <button
                    className="photo-grid__remove"
                    type="button"
                    aria-label={`Remove photo ${index + 1} (${photo.file.name})`}
                    onClick={() => removePhoto(photo.id)}
                  >
                    ×
                  </button>
                </li>
              ))}
              <li className="photo-grid__add">
                <label
                  className={`photo-picker${photosFull ? ' photo-picker--disabled' : ''}`}
                  htmlFor="sell-photos"
                >
                  <span className="photo-picker__plus" aria-hidden="true">
                    +
                  </span>
                  {photosFull ? 'Limit reached' : 'Add photos'}
                  <span className="photo-picker__count">
                    {photos.length}/{MAX_PHOTOS}
                  </span>
                </label>
                <input
                  id="sell-photos"
                  ref={photoInputRef}
                  className="visually-hidden"
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={photosFull}
                  aria-describedby={describedBy('sell-photos-hint', errors.photos && errorId('photos'))}
                  onChange={handlePhotos}
                />
              </li>
            </ul>
            <FieldError field="photos" message={errors.photos} live />
          </section>

          <section className="sell__card" aria-labelledby="sell-details-heading">
            <h2 className="sell__section-title" id="sell-details-heading">
              Details
            </h2>

            <div className="field">
              <div className="field__label-row">
                <label className="field__label" htmlFor="sell-title">
                  Title <Required />
                </label>
                <span className="field__count" id="sell-title-count">
                  {form.title.length}/{MAX_TITLE}
                </span>
              </div>
              <input
                id="sell-title"
                className="text-input"
                type="text"
                placeholder="e.g. IKEA desk lamp, barely used"
                maxLength={MAX_TITLE}
                required
                aria-invalid={Boolean(errors.title)}
                aria-describedby={describedBy('sell-title-count', errors.title && errorId('title'))}
                value={form.title}
                onChange={(event) => update('title', event.target.value)}
              />
              <FieldError field="title" message={errors.title} />
            </div>

            <div className="field">
              <div className="field__label-row">
                <label className="field__label" htmlFor="sell-description">
                  Description <Required />
                </label>
                <span className="field__count" id="sell-description-count">
                  {form.description.length}/{MAX_DESCRIPTION}
                </span>
              </div>
              <textarea
                id="sell-description"
                className="text-input"
                rows={5}
                placeholder="Size, how long you’ve had it, any wear or missing parts…"
                maxLength={MAX_DESCRIPTION}
                required
                aria-invalid={Boolean(errors.description)}
                aria-describedby={describedBy(
                  'sell-description-count',
                  errors.description && errorId('description'),
                )}
                value={form.description}
                onChange={(event) => update('description', event.target.value)}
              />
              <FieldError field="description" message={errors.description} />
            </div>

            <div className="field">
              <label className="field__label" htmlFor="sell-category">
                Category <Required />
              </label>
              <select
                id="sell-category"
                className="text-input"
                required
                aria-invalid={Boolean(errors.category)}
                aria-describedby={describedBy(errors.category && errorId('category'))}
                value={form.category}
                onChange={(event) => update('category', event.target.value)}
              >
                <option value="" disabled>
                  Choose a category
                </option>
                {SELL_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <FieldError field="category" message={errors.category} />
            </div>

            {form.category === 'Textbooks' && (
              <div className="field">
                <label className="field__label" htmlFor="sell-course-code">
                  Course code <span className="field__optional">optional</span>
                </label>
                <input
                  id="sell-course-code"
                  className="text-input"
                  type="text"
                  placeholder="e.g. CS 2500"
                  maxLength={12}
                  autoComplete="off"
                  aria-invalid={Boolean(errors.courseCode)}
                  aria-describedby={describedBy(
                    'sell-course-code-hint',
                    errors.courseCode && errorId('courseCode'),
                  )}
                  value={form.courseCode}
                  onChange={(event) => update('courseCode', event.target.value)}
                />
                <p className="field__hint" id="sell-course-code-hint">
                  Helps classmates find the book for their class.
                </p>
                <FieldError field="courseCode" message={errors.courseCode} />
              </div>
            )}

            <fieldset className="field" aria-describedby={describedBy(errors.condition && errorId('condition'))}>
              <legend className="field__label">
                Condition <Required />
                <span className="visually-hidden"> (required)</span>
              </legend>
              <div className="option-row">
                {SELL_CONDITIONS.map((condition, index) => (
                  <label key={condition} className="option-pill">
                    <input
                      id={`sell-condition-${index}`}
                      type="radio"
                      name="condition"
                      value={condition}
                      checked={form.condition === condition}
                      onChange={() => update('condition', condition)}
                    />
                    {condition}
                  </label>
                ))}
              </div>
              <FieldError field="condition" message={errors.condition} />
            </fieldset>

            <div className="field">
              <label className="field__label" htmlFor="sell-tags">
                Tags <span className="field__optional">optional</span>
              </label>
              <div className="tag-entry">
                <input
                  id="sell-tags"
                  ref={tagInputRef}
                  className="text-input"
                  type="text"
                  placeholder="e.g. ikea, mini fridge"
                  maxLength={MAX_TAG_LENGTH}
                  autoComplete="off"
                  aria-describedby={describedBy('sell-tags-hint', errors.tags && errorId('tags'))}
                  value={tagDraft}
                  onChange={(event) => {
                    setTagDraft(event.target.value)
                    if (errors.tags) setFieldError('tags', '')
                  }}
                  onKeyDown={handleTagKeyDown}
                />
                <button
                  className="btn btn--secondary"
                  type="button"
                  disabled={!tagDraft.trim()}
                  onClick={addTag}
                >
                  Add
                </button>
              </div>
              <p className="field__hint" id="sell-tags-hint">
                Press Enter or comma to add a tag. {form.tags.length}/{MAX_TAGS} added.
              </p>
              {form.tags.length > 0 && (
                <ul className="tag-list" aria-label="Added tags">
                  {form.tags.map((tag) => (
                    <li key={tag} className="tag">
                      {tag}
                      <button
                        className="tag__remove"
                        type="button"
                        aria-label={`Remove tag ${tag}`}
                        onClick={() => removeTag(tag)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <FieldError field="tags" message={errors.tags} live />
            </div>
          </section>

          <section className="sell__card" aria-labelledby="sell-price-heading">
            <h2 className="sell__section-title" id="sell-price-heading">
              Price &amp; pickup
            </h2>

            <div className="field">
              <label className="field__label" htmlFor="sell-price">
                Price <Required />
              </label>
              <div className="price-field">
                <span className="price-field__prefix" aria-hidden="true">
                  $
                </span>
                <input
                  id="sell-price"
                  className="text-input price-field__input"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  autoComplete="off"
                  required
                  aria-invalid={Boolean(errors.price)}
                  aria-describedby={describedBy('sell-price-hint', errors.price && errorId('price'))}
                  value={form.price}
                  onChange={(event) => update('price', event.target.value)}
                />
              </div>
              <p className="field__hint" id="sell-price-hint">
                {isFree ? 'This will be listed as free.' : 'In US dollars. Enter 0 to give it away for free.'}
              </p>
              <FieldError field="price" message={errors.price} />
            </div>

            <fieldset
              className="field"
              aria-describedby={describedBy(errors.paymentMethods && errorId('paymentMethods'))}
            >
              <legend className="field__label">
                Payment methods accepted <Required />
                <span className="visually-hidden"> (required, pick at least one)</span>
              </legend>
              <div className="option-row">
                {SELL_PAYMENT_METHODS.map((method, index) => (
                  <label key={method} className="option-pill option-pill--check">
                    <input
                      id={`sell-payment-${index}`}
                      type="checkbox"
                      value={method}
                      checked={form.paymentMethods.includes(method)}
                      onChange={() => update('paymentMethods', toggle(form.paymentMethods, method))}
                    />
                    {method}
                  </label>
                ))}
              </div>
              <FieldError field="paymentMethods" message={errors.paymentMethods} />
            </fieldset>

            <div className="field">
              <label className="field__label" htmlFor="sell-pickup">
                Pickup spot <Required />
              </label>
              <select
                id="sell-pickup"
                className="text-input"
                required
                aria-invalid={Boolean(errors.pickupSpot)}
                aria-describedby={describedBy('sell-pickup-hint', errors.pickupSpot && errorId('pickupSpot'))}
                value={form.pickupSpot}
                onChange={(event) => update('pickupSpot', event.target.value)}
              >
                <option value="" disabled>
                  Choose a spot
                </option>
                {SELL_PICKUP_SPOTS.map((spot) => (
                  <option key={spot} value={spot}>
                    {spot}
                  </option>
                ))}
              </select>
              <p className="field__hint" id="sell-pickup-hint">
                A general spot on campus. Never share your exact address.
              </p>
              <FieldError field="pickupSpot" message={errors.pickupSpot} />
            </div>
          </section>

          <div className="sell__actions">
            {summary && (
              <p className="sell__form-error" role="alert">
                {summary}
              </p>
            )}
            <button className="btn btn--primary sell__submit" type="submit" disabled={submitting}>
              {submitting ? 'Posting…' : 'Post listing'}
            </button>
          </div>
        </form>
      </main>
    </>
  )
}

export default Sell
