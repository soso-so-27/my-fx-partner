import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // User Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dateParam = searchParams.get('date')
    if (!dateParam) {
        return NextResponse.json({ error: 'Date is required' }, { status: 400 })
    }

    // Ensure format is YYYY-MM-DD
    const date = new Date(dateParam)
    if (isNaN(date.getTime())) {
        return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }
    const dateStr = format(date, 'yyyy-MM-dd')

    try {
        const { data, error } = await supabase
            .from('daily_reflections')
            .select('*')
            .eq('user_id', user.email)
            .eq('date', dateStr)
            .single()

        if (error && error.code !== 'PGRST116') {
            throw error
        }

        return NextResponse.json({ reflection: data || null })

    } catch (error) {
        console.error('Error fetching reflection:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    const supabase = await createClient()

    // User Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { date, biggest_mistake, tomorrow_focus, note } = body

        if (!date) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 })
        }

        // Validate date
        const targetDate = new Date(date)
        const dateStr = format(targetDate, 'yyyy-MM-dd')

        const upsertData: any = {
            user_id: user.email,
            date: dateStr,
        }

        if (biggest_mistake !== undefined) upsertData.biggest_mistake = biggest_mistake
        if (tomorrow_focus !== undefined) upsertData.tomorrow_focus = tomorrow_focus
        if (note !== undefined) upsertData.note = note

        // Use UPSERT
        const { data, error } = await supabase
            .from('daily_reflections')
            .upsert(upsertData, {
                onConflict: 'user_id,date'
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, reflection: data })

    } catch (error) {
        console.error('Error saving reflection:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
