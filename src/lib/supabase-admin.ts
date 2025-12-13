import { createClient } from '@supabase/supabase-js'

export const getSupabaseAdmin = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Missing Supabase configuration')
    }

    return createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

export async function getOrCreateUserProfile(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>, rawEmail: string, name?: string) {
    const email = rawEmail.trim().toLowerCase()

    // First try to find existing profile using maybeSingle (ilike for case-insensitive)
    const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .ilike('email', email)
        .maybeSingle()

    if (existingProfile) {
        return existingProfile.id
    }

    // Profile not found, create one
    const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
            email,
            display_name: name || email.split('@')[0],
            created_at: new Date().toISOString()
        })
        .select('id')
        .single()

    if (createError) {
        // Retry logic for race condition (unique constraint)
        if (createError.code === '23505') {
            const { data: retryProfile } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .ilike('email', email)
                .maybeSingle()
            if (retryProfile) return retryProfile.id
        }
        throw new Error(`Failed to create user profile: ${createError.message}`)
    }

    return newProfile.id
}
