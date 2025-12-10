import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"

export async function GET() {
    const session = await getServerSession(authOptions) as any

    return NextResponse.json({
        hasSession: !!session,
        sessionKeys: session ? Object.keys(session) : [],
        hasAccessToken: !!session?.accessToken,
        accessTokenLength: session?.accessToken?.length || 0,
        hasError: !!session?.error,
        error: session?.error || null,
        userEmail: session?.user?.email || null,
    })
}
