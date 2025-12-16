import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { emailParser } from '@/lib/email-parser'

/**
 * Cloudflare Worker からのメール転送を受け取るエンドポイント
 * POST /api/webhooks/email-inbound
 *
 * Headers:
 *   - x-webhook-secret: 認証用のシークレット
 *
 * Body (JSON):
 *   - to: string (例: "import+<email>@domain.com")
 *   - from: string
 *   - subject: string
 *   - body: string (テキスト)
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Secret 検証
        const secret = request.headers.get('x-webhook-secret')
        const expectedSecret = process.env.EMAIL_INGEST_SECRET

        if (!expectedSecret || secret !== expectedSecret) {
            console.error('[email-inbound] Unauthorized: secret mismatch')
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 2. リクエストボディ取得
        const payload = await request.json() as {
            to?: string
            from?: string
            subject?: string
            body?: string
        }

        console.log('[email-inbound] Received payload:', {
            to: payload.to,
            from: payload.from,
            subject: payload.subject,
            bodyLength: payload.body?.length ?? 0
        })

        if (!payload.to || !payload.body) {
            return NextResponse.json({ error: 'Missing required fields: to, body' }, { status: 400 })
        }

        // 3. "to" アドレスからユーザーメールを抽出
        // 形式: import+<email with @ replaced by .>@domain.com
        // 例: import+nakanishisoya.gmail.com@trade-solo.com
        const userIdentifierMatch = payload.to.match(/import\+(.+)@trade-solo\.com/i)
        if (!userIdentifierMatch) {
            console.error('[email-inbound] Could not extract user identifier from "to":', payload.to)
            return NextResponse.json({ error: 'Invalid forwarding address format' }, { status: 400 })
        }
        // Convert back from "name.domain.com" to "name@domain.com"
        const userIdentifier = userIdentifierMatch[1]
        const userEmail = userIdentifier.replace(/\.(?=[^.]*$)/, '@') // Replace last . with @

        // 4. ユーザー存在確認 (emailで検索)
        const supabase = getSupabaseAdmin()
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', userEmail)
            .single()

        if (profileError || !profile) {
            console.error('[email-inbound] User not found by email:', userEmail)
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        const userId = profile.id

        // 5. メール解析 (既存のパーサーを使用)
        const emailId = `email-forward-${Date.now()}`
        const parsedTrade = await emailParser.parse(
            payload.subject || '',
            payload.body,
            emailId
        )

        if (!parsedTrade) {
            console.log('[email-inbound] Failed to parse trade from email')
            return NextResponse.json({
                success: false,
                message: 'Could not extract trade data from email',
                suggestion: 'Please check if the email format is supported'
            }, { status: 200 })
        }

        // 6. データベースに保存
        const { data: insertedTrade, error: insertError } = await supabase
            .from('trades')
            .insert({
                user_id: userId,
                pair: parsedTrade.pair,
                direction: parsedTrade.direction,
                entry_price: parsedTrade.entryPrice,
                entry_time: parsedTrade.entryTime || new Date().toISOString(),
                exit_price: parsedTrade.exitPrice,
                exit_time: parsedTrade.exitTime,
                pnl_amount: parsedTrade.pnl?.amount,
                pnl_pips: parsedTrade.pnl?.pips,
                pnl_source: parsedTrade.pnlSource,
                lot_size: parsedTrade.lotSize,
                notes: parsedTrade.notes,
                broker: parsedTrade.broker,
                is_verified: true,
                verification_source: 'email_forward',
                data_source: 'gmail', // Treated same as Gmail for filtering
                tags: [...(parsedTrade.tags || []), 'Forwarded'],
            })
            .select('id')
            .single()

        if (insertError) {
            console.error('[email-inbound] Failed to insert trade:', insertError)
            return NextResponse.json({ error: 'Failed to save trade' }, { status: 500 })
        }

        console.log('[email-inbound] Trade saved successfully:', insertedTrade?.id)

        return NextResponse.json({
            success: true,
            tradeId: insertedTrade?.id,
            pair: parsedTrade.pair,
            direction: parsedTrade.direction,
            broker: parsedTrade.broker
        })

    } catch (error) {
        console.error('[email-inbound] Unexpected error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// GETはヘルスチェック用
export async function GET() {
    return NextResponse.json({ status: 'ok', service: 'email-inbound-webhook' })
}
