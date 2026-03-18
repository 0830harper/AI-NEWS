import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// 前端用（anon key）
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 服务端/脚本用（service role key，有写权限）
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
