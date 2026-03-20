import { supabaseAdmin } from '../lib/supabase'

const deadSlugs = [
  'wired-ai', 'jiqizhixin', 'aibase',
  'dribbble', 'zcool', 'huaban', 'notefolio', 'itsnicethat',
  'lapa-ninja', 'bubbbly', '60fps', 'figma-community', 'aiuxpatterns',
  'koreawebdesign', 'siteinspire', 'pageflows', 'mobbin', 'awwwards', 'ux-booth',
  'openrouter', 'modelzoo', 'mlflow', 'kaggle',
]

async function main() {
  for (const slug of deadSlugs) {
    const { data: src } = await supabaseAdmin.from('sources').select('id').eq('slug', slug).single()
    if (!src) { console.log(`skip: ${slug}`); continue }
    await supabaseAdmin.from('articles').delete().eq('source_id', src.id)
    await supabaseAdmin.from('sources').delete().eq('slug', slug)
    console.log(`✓ removed ${slug}`)
  }
  console.log('Done!')
  process.exit(0)
}
main()
