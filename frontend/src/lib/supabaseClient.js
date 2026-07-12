// Single Supabase connection for the whole app.
// Backend teammate provides the real URL + anon key via a .env file:
//   VITE_SUPABASE_URL=...
//   VITE_SUPABASE_ANON_KEY=...
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Until backend is wired up, env vars may be empty — that's fine for
// building the UI with mock data. We guard so the app never crashes.
export const supabaseReady = Boolean(url && anonKey)

export const supabase = supabaseReady
  ? createClient(url, anonKey)
  : null

if (!supabaseReady) {
  // eslint-disable-next-line no-console
  console.warn('[TransitOps] Supabase env not set — running on mock data.')
}
