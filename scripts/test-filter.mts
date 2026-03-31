// @ts-ignore
const { fetchByCategory } = await import('../fetchers/index.ts')

console.log('=== Testing AI filter: app ===')
await fetchByCategory('app')
console.log('=== Done! ===')
