# MarketHub: real backend

Right now MarketHub runs entirely in the browser — the six listings are hard-coded in `src/lib/market.tsx`, and favourites plus anything you post live in `localStorage`, so they vanish on another device. No backend is connected yet.

This plan moves listings, favourites, and seller messages into Lovable Cloud with real user accounts.

## What changes for the user

- **Sign in / sign up** — email + password on a new `/auth` page. Browsing stays public and open to everyone.
- **Listings are shared** — anything posted is visible to every visitor, not just the person who posted it. The current six items are seeded into the database so the app isn't empty.
- **Post an item while signed in** — the sell form requires an account, fills the seller from your profile, and supports a real photo upload.
- **Favourites follow your account** — saved items sync across devices. Signed-out visitors can still browse but get a "sign in to save" prompt.
- **Contact seller actually sends** — messages are stored and the seller sees them in a new "Messages" area; today the form just shows a confirmation.
- **My listings** — see and delete the items you posted.

## Data model

- `profiles` — display name, contact email, one row per user, created automatically on signup.
- `listings` — title, price, category, location, description, image path, `seller_id`, `created_at`, `is_sold`.
- `favourites` — `user_id` + `listing_id`, unique pair.
- `messages` — `listing_id`, `sender_id`, seller recipient, body, `created_at`.
- Storage bucket `listing-photos` for uploaded images.

## Security rules

- Listings: readable by anyone; insert/update/delete only by the owning seller.
- Favourites and messages: each user reads and writes only their own rows; a seller can read messages addressed to them.
- Profiles: public display name readable; only the owner can edit.
- Every table gets explicit grants alongside row-level security so the rules are actually enforced.

## Technical notes

- Enable Lovable Cloud (Postgres + auth + storage), then one migration creating the four tables, their grants, RLS policies, the signup trigger for `profiles`, the storage bucket with owner-scoped write policies, and INSERT statements seeding the six existing listings.
- Reads and writes go through `createServerFn` handlers in `src/lib/*.functions.ts`; user-scoped ones use `requireSupabaseAuth`. Public browse/detail reads use a publishable-key server client so listing pages keep server-rendering with proper metadata.
- `src/lib/market.tsx` is replaced: seed array and localStorage removed, data fetched with TanStack Query (`ensureQueryData` in loaders + `useSuspenseQuery`), a small `useAuth`-style hook exposes the current session for the header.
- New routes: `/auth`, `/messages`, `/my-listings` under the `_authenticated` layout. `/`, `/listing/$id` stay public.
- Header gains a sign-in / account control; the cream-and-green design system stays as it is.

## Not included

Password reset emails, social sign-in, in-app reply threads, and payments — say the word if any of those should be in scope.
