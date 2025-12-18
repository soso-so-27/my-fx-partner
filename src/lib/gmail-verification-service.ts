/**
 * Gmail Verification Service
 * 
 * Detects Gmail forwarding verification emails, extracts the confirmation URL,
 * and manages pending verification records for users.
 */

// Gmail verification email patterns
const GMAIL_VERIFICATION_SUBJECTS = [
    'Gmail の転送の確認',
    'Gmail forwarding confirmation',
    'Confirm your forwarding address'
]

const GMAIL_VERIFICATION_SENDER = 'forwarding-noreply@google.com'

/**
 * Check if an email is a Gmail forwarding verification email
 */
export function isGmailVerificationEmail(from: string, subject: string): boolean {
    // Check sender
    if (!from.toLowerCase().includes(GMAIL_VERIFICATION_SENDER)) {
        return false
    }

    // Check subject patterns
    return GMAIL_VERIFICATION_SUBJECTS.some(pattern =>
        subject.includes(pattern)
    )
}

/**
 * Extract the confirmation URL from Gmail verification email body
 * The body is often Base64 encoded, so we need to decode it first
 */
export function extractConfirmationUrl(body: string): string | null {
    try {
        let decodedBody = body

        // Try to decode if it looks like Base64
        if (/^[A-Za-z0-9+/=\r\n]+$/.test(body.replace(/\s/g, ''))) {
            try {
                decodedBody = Buffer.from(body.replace(/\s/g, ''), 'base64').toString('utf-8')
            } catch {
                // Not base64, use original
            }
        }

        // Look for Gmail verification URL pattern
        // Format: https://mail.google.com/mail/vf-[token]-[suffix]
        const urlPattern = /https:\/\/mail\.google\.com\/mail\/vf-[^\s\r\n]+/gi
        const matches = decodedBody.match(urlPattern)

        if (matches && matches.length > 0) {
            // Return the first match, URL decoded
            let url = matches[0]

            // Clean up URL - remove any trailing characters that aren't part of the URL
            url = url.replace(/["\s\r\n<>]+$/, '')

            // Decode URL-encoded characters
            // %5B -> [, %5D -> ]
            url = url.replace(/%5B/gi, '[').replace(/%5D/gi, ']')

            return url
        }

        return null
    } catch (error) {
        console.error('[gmail-verification] Error extracting confirmation URL:', error)
        return null
    }
}

/**
 * Types for pending verification records
 */
export interface PendingVerification {
    id: string
    userId: string
    verificationType: string
    confirmationUrl: string
    rawEmailSubject?: string
    createdAt: string
    confirmedAt?: string
}

/**
 * Convert email identifier to actual email
 * e.g., "nakanishisoya.gmail.com" -> "nakanishisoya@gmail.com"
 */
export function emailIdentifierToEmail(identifier: string): string {
    // Replace the last dot before the domain with @
    return identifier.replace(/\.(?=[^.]*$)/, '@')
}
