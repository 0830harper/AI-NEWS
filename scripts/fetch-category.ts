// Debug: check env vars before any imports
console.log('ENV CHECK:')
console.log('  SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? `set (${process.env.NEXT_PUBLIC_SUPABASE_URL.length} chars)` : 'MISSING')
console.log('  SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? `set (${process.env.SUPABASE_SERVICE_ROLE_KEY.length} chars)` : 'MISSING')

import { fetchByCategory } from '../fetchers/index'

const category = process.argv[2]
if (!category) {
  console.error('Usage: tsx scripts/fetch-category.ts <app|design|uxui|tech>')
  process.exit(1)
}

async function main() {
  console.log(`=== Fetching category: ${category} ===`)
  await fetchByCategory(category)
  console.log(`=== Done: ${category} ===`)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
