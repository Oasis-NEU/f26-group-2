---
name: nu-exchange
description: Theme, branding, logo, and UI conventions for Husky Exchange (formerly NU Exchange), the Northeastern student marketplace in this repo. Load before building or restyling any page, component, or form so new work matches the existing dark theme, color tokens, typography, layout, copy voice, and accessibility rules.
---

# Husky Exchange: theme and branding

Husky Exchange (renamed from "NU Exchange" in November 2026) is a campus-only marketplace where
verified Northeastern students buy, sell, and trade in person. The look is a **simple, clean, dark marketplace**: content and photos first, very little
decoration, with one red accent. The design should come from the content, not from effects.

Before building, read `src/index.css` (tokens and shared classes) and one existing page that is close
to what you're making (`src/pages/Login.jsx`, `HomeFeed.jsx`, or `Sell.jsx`). Follow those patterns.
Don't restructure existing files, and ask before adding dependencies.

## Theme: dark only

The whole app is dark (`color-scheme: dark`). Don't add light sections or a light-mode toggle unless
the team asks for one. Always use the CSS variables from `src/index.css`. Never hard-code a color
that a token already covers.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#121212` | Page background |
| `--bg-alt` | `#181818` | Form cards, auth card |
| `--surface` | `#1c1c1c` | Inputs, chips, listing cards |
| `--surface-2` | `#262626` | Image placeholders, tag chips |
| `--border` | `#2a2a2a` | Default borders, dividers |
| `--border-strong` | `#3a3a3a` | Hover/focus borders, secondary buttons |
| `--control-border` | `#4a4a4a` | Checkbox outlines, dashed drop zones |
| `--text` | `#f5f5f5` | Body text, headings |
| `--text-muted` | `#a3a3a3` | Secondary text, hints, meta |
| `--text-subtle` | `#8a8a8a` | Tertiary text ("optional", counts) |
| `--accent` | `#c8102e` | Logo red: primary buttons, checked states, active borders, fills |
| `--accent-soft` | `rgba(200,16,46,.2)` | Tinted background for selected options |
| `--accent-text` | `#ff5a6a` | Red **text** on dark (links like "See all", step numbers) |
| error text | `#ff6b6b` | Validation messages (readable on dark) |

**Red is the only brand color.** Use it for the primary button, selected/checked states, the logo
mark, and small accents. Don't use it for body text, large backgrounds, or decoration.

The brand red is the logo's **`#C8102E`**, set once as `--accent` in `src/index.css` and used
app-wide (Tailwind `bg-primary`). Don't override it per page or hard-code it in components. It's too
dark to read as text on the dark background (3.2:1 contrast), so any red *text* uses `--accent-text`
(Tailwind `text-primary-text`) instead; keep red text rare and short. The ink color `#1C1F26` is for
light backgrounds only (it's the logo's ink, shown on the logo's white tile).

## Logo

- The site is called **Husky Exchange**. Use that name in all UI text, never "NU Exchange".
- The mark is the "HE" logo: a husky inside a dark ink **H** (`#1C1F26`) and a red **E** with an
  arrow (`#C8102E`), from the team's Figma file "Logo and UI HE". In React, use the
  `src/components/LogoMark.jsx` component; the plain file is `public/logo.svg`. The browser tab icon
  is `public/favicon.svg`, the same mark on a white rounded square.
- **Always put the mark on a white tile** (`.logo__mark` in `src/components/Nav.css`). Its ink is
  nearly the same color as the dark background and disappears without the tile. Don't recolor the
  mark or make a light version without checking with the designer.
- In the nav, the mark sits next to the name "Husky Exchange" as live text (Inter, not part of the
  image). On the logged-out nav below 480px only the mark shows; the name stays visually hidden for
  screen readers.
- The full stacked logo with "HUSKY EXCHANGE" lettering exists only as a PNG in Figma. Ask for an
  SVG export before using it anywhere.

## Typography

- **Inter** (loaded in `index.html`, weights 400–800) through `--sans`. Don't add other fonts.
- Page title: 26px mobile / 32px desktop, weight 700, slight negative letter-spacing.
  Hero: 36px / 56px. Section title: 24px / 28px, or 17px inside a card.
- Body 14–16px. Hints and meta text 13px in `--text-muted`. Labels 14px, weight 600.
- Prices: bold (700). Use `font-variant-numeric: tabular-nums` for counters.
- Form inputs use **16px** text on the page so iOS doesn't zoom in on focus.

## Shape, spacing, layout

- Corners: **12px cards** (`--radius-card`), **8px buttons and inputs** (`--radius-btn`).
  Fully rounded (999px) only for category chips, tag chips, and avatars.
- No shadows or gradients. Separate things with `--border` lines and surface steps.
- **Mobile-first.** Design at 375px wide, then add `@media (min-width: 768px)` and `1024px`
  overrides (native CSS nesting is used inside rules). Never cause horizontal scroll at 375px.
- `.container` gives the page gutter (`--gutter`: 16px mobile, 64px desktop) and a 1440px max width.
  Forms sit in a single centered column, about 400px for auth and 640px for longer forms.
- Tap targets at least 44px tall on mobile.
- Listing grids use `.listing-grid` (2 columns under 640px, 3 from 640px, 4 from 1024px).

## Shared building blocks (reuse them)

- Buttons: `.btn` plus `.btn--primary` (red, white text) or `.btn--secondary` (outlined).
  Use one primary button per view.
- Inputs and selects: `.text-input` (defined in `HomeFeed.css` and loaded app-wide; Login uses it too).
- Category chips: `.chip` / `.chip--active`.
- Screen-reader-only text: `.visually-hidden`.
- Navigation: `<Nav variant="app" />` for signed-in pages, `<Nav variant="public" />` for logged-out ones.
- Option lists (categories, conditions, payment methods, pickup spots) live in constants files
  (`src/data/sellOptions.ts`, `src/data/sampleListings.js`). Don't inline them in components.

## Design-system components (Tailwind + shadcn/ui)

Tailwind v4 and shadcn/ui-style components are set up for the core UI. See every component and
state at **`/design-system`** (`src/pages/DesignSystem.jsx`). Prefer these over writing new CSS:

| Need | Use |
|---|---|
| Button (primary / secondary / destructive / ghost / link, `loading`, `disabled`) | `@/components/ui/button` |
| Text input | `@/components/ui/input` |
| Checkbox | `@/components/ui/checkbox` |
| Modal (Esc and click outside close it) | `@/components/ui/dialog` |
| Bottom sheet | `@/components/ui/sheet` |
| Toast | `import { toast } from 'sonner'` (`<Toaster />` is already in `main.jsx`) |
| Listing card (default / hover / sold) | `@/components/ListingCard` |
| Tag chip (clickable, removable) | `@/components/TagChip` |
| Seller badge | `@/components/SellerBadge` |
| Filter panel (side panel ≥1024px, bottom sheet below) | `@/components/FilterPanel` |
| Empty state | `@/components/EmptyState` |

- Tailwind tokens map onto the CSS variables above (`bg-primary` → `--accent`, `bg-card` →
  `--surface`, `text-muted-foreground` → `--text-muted`, `border-border`, `bg-success`, …).
  Type scale: `text-page` 28, `text-section` 20, `text-price` 18, `text-body` 16, `text-small` 13.
  Radius: `rounded-card` 12px, `rounded-control` 8px, `rounded-full`. Use even spacing steps
  (`p-2` = 8px, `p-4` = 16px) to stay on the 8px grid. Breakpoints: `sm` 640px, `lg` 1024px.
- Tailwind runs **without its preflight reset** so existing pages are unchanged. Components must
  reset browser defaults themselves (for example `m-0 border-0 bg-transparent p-0` on a bare
  `<button>`, `block` on images), and set a border color whenever they add a border.
- Existing pages keep their `.css` files. Moving a page to Tailwind is fine, but do it one page at a
  time and delete the old CSS only when nothing else uses it.
- `npx shadcn add <name>` works (`components.json`, JS, `@/` alias). The CLI may write CSS variables
  such as `--accent` and `--border` into `src/index.css`, which would break the dark theme. Revert
  those lines and keep only the new component file.

## Code conventions

- React function components (`function Name() {}` with `export default Name` at the bottom), plain
  JSX, and one `.css` file per page or component imported next to it.
- BEM-style class names: `.block`, `.block__element`, `.block--modifier`.
- No semicolons, single quotes, 2-space indent, imports grouped (libraries, then local, then CSS).
- Data shapes for the backend go in `src/types/*.ts` as TypeScript types, with snake_case field
  names that match the Supabase tables (`price_cents`, `payment_methods`).
- Money is stored as integer cents (`price_cents`). `0` means free; show it as "Free".

## Accessibility (required)

- Every input has a **visible** `<label>`. Groups of radios or checkboxes use `<fieldset>` and `<legend>`.
- Everything works by keyboard. Custom controls wrap a real (visually hidden) `input` or `button`
  and show a visible focus ring: `outline: 2px solid var(--text)`.
- Validation errors appear next to the field, linked with `aria-describedby`, and the field gets
  `aria-invalid`. On a failed submit, move focus to the first invalid field.
- Icon-only buttons need an `aria-label` (e.g. "Remove photo 2").
- Images need meaningful `alt` text, or `alt=""` if decorative.

## Voice and copy

- Plain, short, and friendly, written for students. Buttons say exactly what they do:
  "Post listing", "Message seller", "Mark as sold", "Log in".
- Use sentence case everywhere (not Title Case). Use curly apostrophes (’) and the ellipsis
  character (…) in UI text.
- Error messages say how to fix the problem: "Enter a price. Use 0 if it’s free."

## Product and safety rules that affect UI

- Users are verified Northeastern students (`@northeastern.edu`). Exchanges happen **in person**,
  except tickets and other things sent online (the "Online transfer" pickup option). Payment happens off-platform (Venmo, Zelle, cash, or trade); the app never takes payment.
- **Never ask for or show an exact address.** Location is a general campus spot (Curry Student
  Center, Snell Library, ISEC, Marino Center, …) or "Online transfer".
- Show trust signals (verified badge, rating, member since) wherever a seller appears.
- Lead with photos: cards show a large image, then price, then title, then meta text.
- Footer note: "Student project, not an official Northeastern University service." Don't use
  official Northeastern logos or imply the site is official.
