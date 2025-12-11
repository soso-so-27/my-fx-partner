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
    // 汎用的な検索クエリ - 日本・海外のFXブローカーに幅広く対応
    // 約定通知で一般的に使われるキーワードを網羅
    defaultQuery: [
        // 日本語キーワード
        '約定', '取引', '決済', '注文確定', 'FX',
        // 英語キーワード  
        'order executed', 'trade confirmation', 'position opened', 'position closed',
        // ブローカー名
        'GMOクリック証券', 'XMTrading', 'Exness', 'OANDA', 'DMM FX', 'SBI FX',
        'IC Markets', 'Pepperstone', 'FXCM', 'IG証券', 'みんなのFX', 'LION FX'
    ].map(k => `"${k}"`).join(' OR '),

    async getRecentEmails(accessToken: string, query?: string): Promise<GmailMessage[]> {
        const searchQuery = query || `(${this.defaultQuery}) after:2024/01/01`


        const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(searchQuery)}&maxResults=100`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })


        if (!response.ok) {
            const errorBody = await response.text()
            console.error(`Gmail API Error: ${response.status} ${response.statusText}`, errorBody)
            throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`)
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
