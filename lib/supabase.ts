import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 服务端/脚本用（service role key，有写权限）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

// 前端用（anon key）— 懒加载，避免服务端脚本因缺少 ANON_KEY 崩溃
export const supabase = createClient(
  supabaseUrl,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? supabaseServiceKey
)
