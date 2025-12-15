import sharp from 'sharp'

interface OHLC {
    open: number
    high: number
    low: number
    close: number
    timestamp?: number
}

export const chartRenderer = {
    /**
     * Convert OHLC data to an image buffer (PNG) using SVG and Sharp
     * This allows us to compare "Apple to Apple" with user uploaded screenshots.
     */
    async renderToBuffer(data: OHLC[], width = 500, height = 300): Promise<Buffer> {
        if (data.length === 0) {
            throw new Error('No data to render')
        }

        // 1. Calculate scales
        const prices = data.flatMap(d => [d.high, d.low])
        const maxPrice = Math.max(...prices)
        const minPrice = Math.min(...prices)
        const priceRange = maxPrice - minPrice || 1

        const padding = 20
        const chartHeight = height - (padding * 2)
        const candleWidth = (width - (padding * 2)) / data.length
        const gap = candleWidth * 0.2 // 20% gap

        // 2. Generate SVG candles
        // Colors: Green for up, Red for down (Matching typical dark mode charts)
        const upColor = '#22c55e' // Tailwind green-500
        const downColor = '#ef4444' // Tailwind red-500
        const bgColor = '#0f172a' // Tailwind slate-900 (Dark background)

        const candleSvgs = data.map((d, i) => {
            const isUp = d.close >= d.open
            const color = isUp ? upColor : downColor

            const x = padding + (i * candleWidth) + (gap / 2)
            const bodyWidth = candleWidth - gap

            // Y coordinates (SVG 0 is top)
            const yHigh = padding + chartHeight * (1 - (d.high - minPrice) / priceRange)
            const yLow = padding + chartHeight * (1 - (d.low - minPrice) / priceRange)
            const yOpen = padding + chartHeight * (1 - (d.open - minPrice) / priceRange)
            const yClose = padding + chartHeight * (1 - (d.close - minPrice) / priceRange)

            // Wick
            const wick = `<line x1="${x + bodyWidth / 2}" y1="${yHigh}" x2="${x + bodyWidth / 2}" y2="${yLow}" stroke="${color}" stroke-width="1" />`

            // Body
            const bodyTop = Math.min(yOpen, yClose)
            const bodyHeight = Math.max(Math.abs(yClose - yOpen), 1) // Min 1px
            const body = `<rect x="${x}" y="${bodyTop}" width="${bodyWidth}" height="${bodyHeight}" fill="${color}" />`

            return wick + body
        }).join('')

        // 3. Construct full SVG
        const svg = `
            <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="${bgColor}" />
                ${candleSvgs}
            </svg>
        `

        // 4. Convert to Buffer using Sharp
        return await sharp(Buffer.from(svg)).png().toBuffer()
    }
}
