export interface GmailMessage {
    id: string
    threadId: string
    snippet: string
    payload: {
        headers: { name: string; value: string }[]
        body: { data: string }
        parts?: { mimeType: string; body: { data: string } }[]
    }
}

export const gmailService = {
    async getRecentEmails(accessToken: string, query: string = 'subject:(order OR trade OR position OR 約定 OR XMTrading OR Test) after:2024/01/01'): Promise<GmailMessage[]> {
        const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })

        if (!response.ok) {
            throw new Error('Failed to fetch messages')
        }

        const data = await response.json()
        if (!data.messages) return []

        const messages: GmailMessage[] = []
        for (const msg of data.messages) {
            const details = await this.getEmailDetails(accessToken, msg.id)
            if (details) messages.push(details)
        }

        return messages
    },

    async getEmailDetails(accessToken: string, messageId: string): Promise<GmailMessage | null> {
        const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })

        if (!response.ok) return null
        return await response.json()
    }
}
