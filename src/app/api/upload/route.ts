import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getSupabaseAdmin, getOrCreateUserProfile } from '@/lib/supabase-admin'

// POST /api/upload - Upload image to Supabase Storage
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get user profile UUID
        const supabase = getSupabaseAdmin()
        const userId = await getOrCreateUserProfile(supabase, session.user.email, session.user.name || undefined)

        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const bucket = (formData.get('bucket') as string) || 'patterns'

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({
                error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP'
            }, { status: 400 })
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024
        if (file.size > maxSize) {
            return NextResponse.json({
                error: 'File too large. Maximum size: 5MB'
            }, { status: 400 })
        }

        // Generate unique filename
        const timestamp = Date.now()
        const ext = file.name.split('.').pop() || 'jpg'
        const filename = `${userId}/${timestamp}.${ext}`

        // Convert File to ArrayBuffer for upload
        const arrayBuffer = await file.arrayBuffer()
        const buffer = new Uint8Array(arrayBuffer)

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false
            })

        if (error) {
            console.error('Upload error:', error)
            return NextResponse.json({
                error: 'Failed to upload file: ' + error.message
            }, { status: 500 })
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(bucket)
            .getPublicUrl(filename)

        return NextResponse.json({
            url: urlData.publicUrl,
            path: data.path,
            fullPath: data.fullPath
        }, { status: 201 })

    } catch (error) {
        console.error('Error in POST /api/upload:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
