import 'dotenv/config'
import { fetchAll } from '../fetchers/index'

async function main() {
  console.log('Starting fetch...')
  await fetchAll()
  console.log('Done.')
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
