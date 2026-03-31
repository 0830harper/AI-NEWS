import { createClient } from '@supabase/supabase-js'

// Lazy initialization: clients are created on first property access,
// not at module load time. This ensures env vars are available.
let _admin: ReturnType<typeof createClient> | null = null
let _client: ReturnType<typeof createClient> | null = null

function getAdmin() {
  if (!_admin) {
    _admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _admin
}

function getClient() {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return _client
}

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop: string) {
    const val = (getAdmin() as any)[prop]
    return typeof val === 'function' ? val.bind(getAdmin()) : val
  }
})

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop: string) {
    const val = (getClient() as any)[prop]
    return typeof val === 'function' ? val.bind(getClient()) : val
  }
})
