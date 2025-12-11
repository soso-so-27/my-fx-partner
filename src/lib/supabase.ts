import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Standard client with anon key (for read operations with RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin client with service role key (for write operations bypassing RLS)
// Only use on server-side or in API routes
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

// Check if admin client is available
export const hasAdminAccess = !!supabaseServiceKey && supabaseServiceKey !== ''
