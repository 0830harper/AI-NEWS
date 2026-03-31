import { fetchByCategory } from '../fetchers/index'

const category = process.argv[2]
if (!category) {
  console.error('Usage: tsx scripts/fetch-category.ts <app|design|uxui|tech>')
  process.exit(1)
}

console.log(`=== Fetching category: ${category} ===`)
await fetchByCategory(category)
console.log(`=== Done: ${category} ===`)
