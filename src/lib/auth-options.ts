import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: any) {
    try {
        const url =
            "https://oauth2.googleapis.com/token?" +
            new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                grant_type: "refresh_token",
                refresh_token: token.refreshToken,
            })

        const response = await fetch(url, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            method: "POST",
        })

        const refreshedTokens = await response.json()

        if (!response.ok) {
            throw refreshedTokens
        }

        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
        }
    } catch (error) {
        console.log("RefreshAccessTokenError", error)

        return {
            ...token,
            error: "RefreshAccessTokenError",
        }
    }
}

import { getSupabaseAdmin, getOrCreateUserProfile } from '@/lib/supabase-admin'
import { AnalyticsService } from '@/lib/analytics-service'

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: "https://www.googleapis.com/auth/gmail.readonly openid email profile",
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (user.email) {
                try {
                    const supabaseAdmin = getSupabaseAdmin()
                    const userId = await getOrCreateUserProfile(supabaseAdmin, user.email, user.name || undefined)
                    await AnalyticsService.trackEvent(supabaseAdmin, userId, 'login', { provider: account?.provider })
                } catch (error) {
                    console.error('Login tracking failed:', error)
                }
            }
            return true
        },
        async jwt({ token, account, user }) {
            // Initial sign in
            if (account && user) {
                return {
                    accessToken: account.access_token,
                    accessTokenExpires: Date.now() + (account.expires_in as number) * 1000,
                    refreshToken: account.refresh_token,
                    user: {
                        email: user.email,
                        name: user.name,
                        image: user.image,
                    },
                }
            }

            // Return previous token if the access token has not expired yet
            if (Date.now() < (token.accessTokenExpires as number)) {
                return token
            }

            // Access token has expired, try to update it
            return refreshAccessToken(token)
        },
        async session({ session, token }: any) {
            session.accessToken = token.accessToken
            session.error = token.error
            // Include user info from token
            if (token.user) {
                session.user = {
                    email: token.user.email,
                    name: token.user.name,
                    image: token.user.image,
                }
            }
            return session
        },
    },
}
