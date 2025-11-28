import NextAuth from "next-auth"

declare module "next-auth" {
    /**
     * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
     */
    interface Session {
        accessToken?: string
        user: {
            /** The user's name. */
            name?: string | null
            /** The user's email address. */
            email?: string | null
            /** The user's image. */
            image?: string | null
        }
    }
}

declare module "next-auth/jwt" {
    /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
    interface JWT {
        accessToken?: string
    }
}
