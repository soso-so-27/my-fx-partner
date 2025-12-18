import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { startOfWeek, endOfWeek, format } from 'date-fns'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // User Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Determine target week
    let date = new Date()
    const dateParam = searchParams.get('date')
    if (dateParam) {
        date = new Date(dateParam)
        if (isNaN(date.getTime())) {
            return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
        }
    }

    // Calculate Week Start (Monday) and End (Sunday)
    // weekStartsOn: 1 (Monday)
    const weekStart = startOfWeek(date, { weekStartsOn: 1 })
    // const weekEnd = endOfWeek(date, { weekStartsOn: 1 })

    const startDateStr = format(weekStart, 'yyyy-MM-dd')

    try {
        const { data, error } = await supabase
            .from('weekly_strategies')
            .select('*')
            .eq('user_id', user.email)
            .eq('start_date', startDateStr)
            .single()

        if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
            throw error
        }

        return NextResponse.json({
            strategy: data || null,
            weekStart: startDateStr
        })

    } catch (error) {
        console.error('Error fetching strategy:', error)
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
        const { date, plan, review } = body

        if (!date) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 })
        }

        const targetDate = new Date(date)
        const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 })
        const weekEnd = endOfWeek(targetDate, { weekStartsOn: 1 })

        const startDateStr = format(weekStart, 'yyyy-MM-dd')
        const endDateStr = format(weekEnd, 'yyyy-MM-dd')

        const upsertData: any = {
            user_id: user.email,
            start_date: startDateStr,
            end_date: endDateStr,
        }

        if (plan !== undefined) upsertData.plan = plan
        if (review !== undefined) upsertData.review = review

        // Use UPSERT
        const { data, error } = await supabase
            .from('weekly_strategies')
            .upsert(upsertData, {
                onConflict: 'user_id,start_date'
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, strategy: data })

    } catch (error) {
        console.error('Error saving strategy:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
