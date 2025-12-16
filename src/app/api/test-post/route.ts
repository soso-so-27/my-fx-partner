import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    return NextResponse.json({ status: 'ok', method: 'GET', service: 'email-test' })
}

export async function POST(request: NextRequest) {
    const body = await request.json()
    return NextResponse.json({
        status: 'ok',
        method: 'POST',
        received: body
    })
}
