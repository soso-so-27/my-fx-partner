import { CreateTradeInput } from "@/types/trade"
import OpenAI from "openai"

export interface ParsedTrade extends CreateTradeInput {
    broker: string
    originalEmailId?: string
}

export const emailParser = {
    async parse(subject: string, body: string, emailId: string): Promise<ParsedTrade | null> {
        // 1. ブローカー検出
        const broker = this.detectBroker(subject, body)

        let result: ParsedTrade | null = null

        // 2. ブローカー別パーサーに振り分け
        switch (broker) {
            case 'XMTrading':
                result = this.parseXM(body, emailId)
                break
            case 'Exness':
                result = this.parseExness(body, emailId)
                break
            case 'OANDA':
                result = this.parseOANDA(body, emailId)
                break
            case 'IC Markets':
                result = this.parseICMarkets(body, emailId)
                break
            case 'Pepperstone':
                result = this.parsePepperstone(body, emailId)
                break
            case 'GMO':
                result = this.parseGMO(body, emailId)
                break
            case 'DMM':
                result = this.parseDMM(body, emailId)
                break
            case 'SBI':
                result = this.parseSBI(body, emailId)
                break
            default:
                // 汎用パーサー（フォールバック1）
                result = this.parseGeneric(body, emailId)
                break
        }

        // 3. LLMフォールバック (RegExで失敗した場合)
        if (!result) {
            console.log("Regex parsing failed, trying LLM fallback...")
            result = await this.parseWithLLM(subject, body, emailId)
        }

        return result
    },

    detectBroker(subject: string, body: string): string | null {
        const text = `${subject} ${body}`.toLowerCase()

        // キーワードマッチング（優先度順）
        // GMOクリック証券を優先検出
        if (text.includes('gmoクリック証券') || text.includes('fxネオ') ||
            text.includes('gmo') || text.includes('クリック証券')) {
            return 'GMO'
        }
        if (text.includes('xmtrading') || text.includes('xm trading') || subject.includes('Test')) {
            return 'XMTrading'
        }
        if (text.includes('exness')) {
            return 'Exness'
        }
        if (text.includes('oanda')) {
            return 'OANDA'
        }
        if (text.includes('ic markets') || text.includes('icmarkets')) {
            return 'IC Markets'
        }
        if (text.includes('pepperstone')) {
            return 'Pepperstone'
        }
        if (text.includes('dmm') || text.includes('dmm fx')) {
            return 'DMM'
        }
        if (text.includes('sbi') || text.includes('fxトレード')) {
            return 'SBI'
        }

        return null
    },

    // ===================
    // 汎用パーサー
    // ===================
    parseGeneric(body: string, emailId: string): ParsedTrade | null {
        try {
            // 一般的なパターンで抽出を試みる

            // 売買方向の検出
            let direction: 'BUY' | 'SELL' = 'BUY'
            const directionPatterns = [
                /(?:type|direction|売買|方向)[:：\s]*(buy|sell|long|short|買い|売り)/i,
                /(buy|sell|long|short|買い|売り)\s*(?:order|position|ポジション)/i
            ]

            for (const pattern of directionPatterns) {
                const match = body.match(pattern)
                if (match) {
                    const dir = match[1].toLowerCase()
                    if (dir === 'sell' || dir === 'short' || dir === '売り') {
                        direction = 'SELL'
                    }
                    break
                }
            }

            // 通貨ペアの検出
            const pairPatterns = [
                /(?:symbol|pair|通貨ペア|銘柄)[:：\s]*([A-Z]{6}|[A-Z]{3}\/[A-Z]{3}|[A-Z]{3}-[A-Z]{3})/i,
                /\b([A-Z]{6}|[A-Z]{3}\/[A-Z]{3})\b/
            ]

            let pair: string | null = null
            for (const pattern of pairPatterns) {
                const match = body.match(pattern)
                if (match) {
                    pair = match[1].replace(/[\/\-]/g, '') // USDJPY形式に統一
                    break
                }
            }

            if (!pair) return null

            // 価格の検出（エントリー）
            const pricePatterns = [
                /(?:price|rate|約定価格|レート|執行価格|open\s*price)[:：\s]*([0-9]+\.?[0-9]*)/i,
                /([0-9]+\.[0-9]{2,5})/  // 数値のみ（小数点2-5桁）
            ]

            let entryPrice: number | null = null
            for (const pattern of pricePatterns) {
                const match = body.match(pattern)
                if (match) {
                    entryPrice = parseFloat(match[1])
                    if (entryPrice > 0) break
                }
            }

            if (!entryPrice) return null

            // 決済価格の検出
            const exitPricePatterns = [
                /(?:close\s*price|exit\s*price|決済価格|終了価格)[:：\s]*([0-9]+\.?[0-9]*)/i,
            ]
            let exitPrice: number | undefined
            for (const pattern of exitPricePatterns) {
                const match = body.match(pattern)
                if (match) {
                    exitPrice = parseFloat(match[1])
                    break
                }
            }

            // PnL（損益）の検出
            const pnlPatterns = [
                /(?:profit|loss|pnl|p\/l|損益|利益|損失|収益)[:：\s]*([+-]?[0-9,]+\.?[0-9]*)\s*(?:円|yen|jpy|usd|\$)?/i,
                /(?:profit|loss|pnl|p\/l|損益|利益|損失)[:：\s]*(?:円|yen|jpy|usd|\$)?\s*([+-]?[0-9,]+\.?[0-9]*)/i,
                /([+-][0-9,]+\.?[0-9]*)\s*(?:円|yen|jpy|pips)/i,
            ]
            let pnlAmount: number | undefined
            let pnlPips: number | undefined
            for (const pattern of pnlPatterns) {
                const match = body.match(pattern)
                if (match) {
                    const value = parseFloat(match[1].replace(/,/g, ''))
                    if (!isNaN(value)) {
                        // pipsかamountかを判断
                        if (body.toLowerCase().includes('pips') && Math.abs(value) < 1000) {
                            pnlPips = value
                        } else {
                            pnlAmount = value
                        }
                        break
                    }
                }
            }

            // ロット数の検出（オプション）
            const lotMatch = body.match(/(?:lot|volume|数量|ロット)[:：\s]*([0-9]+\.?[0-9]*)/i)
            const lotSize = lotMatch ? parseFloat(lotMatch[1]) : undefined

            return {
                pair,
                direction,
                entryPrice,
                exitPrice,
                lotSize,
                entryTime: new Date().toISOString(),
                pnl: (pnlAmount !== undefined || pnlPips !== undefined) ? {
                    amount: pnlAmount,
                    pips: pnlPips,
                    currency: 'JPY'
                } : undefined,
                pnlSource: (pnlAmount !== undefined || pnlPips !== undefined) ? 'email' : undefined,
                notes: "Auto-imported via generic parser",
                broker: "Generic",
                originalEmailId: emailId,
                isVerified: true,
                verificationSource: "gmail_import",
                tags: ["AutoImport", "Generic"]
            }
        } catch (e) {
            console.error("Generic Parsing Error", e)
            return null
        }
    },

    // ===================
    // XMTrading パーサー
    // ===================
    parseXM(body: string, emailId: string): ParsedTrade | null {
        try {
            const typeMatch = body.match(/(?:Type|タイプ)[:：]?\s*(Buy|Sell|買い|売り)/i)
            const symbolMatch = body.match(/(?:Symbol|Pair|銘柄|通貨)[:：]?\s*([A-Z0-9]+)/i)
            const priceMatch = body.match(/(?:Price|Rate|価格)[:：]?\s*([0-9.]+)/i)

            if (!typeMatch || !symbolMatch || !priceMatch) return null

            let direction: 'BUY' | 'SELL' = 'BUY'
            const typeStr = typeMatch[1].toLowerCase()
            if (typeStr === 'sell' || typeStr === '売り') direction = 'SELL'

            return {
                pair: symbolMatch[1],
                direction,
                entryPrice: parseFloat(priceMatch[1]),
                entryTime: new Date().toISOString(),
                notes: "Auto-imported from XMTrading email",
                broker: "XMTrading",
                originalEmailId: emailId,
                isVerified: true,
                verificationSource: "gmail_import",
                tags: ["XM", "AutoImport"]
            }
        } catch (e) {
            console.error("XM Parsing Error", e)
            return null
        }
    },

    // ===================
    // Exness パーサー
    // ===================
    parseExness(body: string, emailId: string): ParsedTrade | null {
        try {
            // Exnessの一般的なフォーマット
            // "Direction: Buy", "Symbol: EURUSD", "Price: 1.0850"
            const directionMatch = body.match(/(?:Direction|Type)[:：]?\s*(Buy|Sell)/i)
            const symbolMatch = body.match(/(?:Symbol|Instrument)[:：]?\s*([A-Z]{6})/i)
            const priceMatch = body.match(/(?:Price|Open Price)[:：]?\s*([0-9.]+)/i)

            if (!directionMatch || !symbolMatch || !priceMatch) {
                // フォールバック: 汎用パーサーを試す
                const generic = this.parseGeneric(body, emailId)
                if (generic) {
                    generic.broker = "Exness"
                    generic.tags = ["Exness", "AutoImport"]
                }
                return generic
            }

            const direction = directionMatch[1].toLowerCase() === 'buy' ? 'BUY' : 'SELL'

            return {
                pair: symbolMatch[1],
                direction,
                entryPrice: parseFloat(priceMatch[1]),
                entryTime: new Date().toISOString(),
                notes: "Auto-imported from Exness email",
                broker: "Exness",
                originalEmailId: emailId,
                isVerified: true,
                verificationSource: "gmail_import",
                tags: ["Exness", "AutoImport"]
            }
        } catch (e) {
            console.error("Exness Parsing Error", e)
            return null
        }
    },

    // ===================
    // OANDA パーサー
    // ===================
    parseOANDA(body: string, emailId: string): ParsedTrade | null {
        try {
            // OANDAフォーマット: "EUR/USD", "Buy", "1.0850"
            const pairMatch = body.match(/([A-Z]{3}\/[A-Z]{3})/i)
            const directionMatch = body.match(/(Buy|Sell|Long|Short)/i)
            const priceMatch = body.match(/([0-9]+\.[0-9]{4,5})/i)

            if (!pairMatch || !directionMatch || !priceMatch) {
                const generic = this.parseGeneric(body, emailId)
                if (generic) {
                    generic.broker = "OANDA"
                    generic.tags = ["OANDA", "AutoImport"]
                }
                return generic
            }

            const pair = pairMatch[1].replace('/', '')
            const dir = directionMatch[1].toLowerCase()
            const direction = (dir === 'buy' || dir === 'long') ? 'BUY' : 'SELL'

            return {
                pair,
                direction,
                entryPrice: parseFloat(priceMatch[1]),
                entryTime: new Date().toISOString(),
                notes: "Auto-imported from OANDA email",
                broker: "OANDA",
                originalEmailId: emailId,
                isVerified: true,
                verificationSource: "gmail_import",
                tags: ["OANDA", "AutoImport"]
            }
        } catch (e) {
            console.error("OANDA Parsing Error", e)
            return null
        }
    },

    // ===================
    // IC Markets パーサー
    // ===================
    parseICMarkets(body: string, emailId: string): ParsedTrade | null {
        try {
            const generic = this.parseGeneric(body, emailId)
            if (generic) {
                generic.broker = "IC Markets"
                generic.tags = ["ICMarkets", "AutoImport"]
            }
            return generic
        } catch (e) {
            console.error("IC Markets Parsing Error", e)
            return null
        }
    },

    // ===================
    // Pepperstone パーサー
    // ===================
    parsePepperstone(body: string, emailId: string): ParsedTrade | null {
        try {
            const generic = this.parseGeneric(body, emailId)
            if (generic) {
                generic.broker = "Pepperstone"
                generic.tags = ["Pepperstone", "AutoImport"]
            }
            return generic
        } catch (e) {
            console.error("Pepperstone Parsing Error", e)
            return null
        }
    },

    // ===================
    // GMOクリック証券 パーサー
    // ===================
    parseGMO(body: string, emailId: string): ParsedTrade | null {
        try {

            // 約定内容セクションから情報を抽出
            // 通貨ペアの検出
            const pairMatch = body.match(/通貨ペア[：:]\s*([A-Z]{3}\/[A-Z]{3})/i)
            if (!pairMatch) {
                return null
            }
            const pair = pairMatch[1].replace('/', '')

            // 取引種類の検出（新規 or 決済）
            const tradeTypeMatch = body.match(/取引種類[：:]\s*(新規|決済)/i)
            const isSettlement = tradeTypeMatch && tradeTypeMatch[1] === '決済'

            // 売買区分の検出
            const directionMatch = body.match(/売買区分[：:]\s*(買|売)/i)
            if (!directionMatch) {
                return null
            }
            const direction: 'BUY' | 'SELL' = directionMatch[1] === '買' ? 'BUY' : 'SELL'

            // 約定レートの検出
            const rateMatch = body.match(/約定レート[：:]\s*([0-9.]+)/i)
            if (!rateMatch) {
                return null
            }
            const rate = parseFloat(rateMatch[1])

            // 約定数量の検出（単位: 通貨）
            const quantityMatch = body.match(/約定数量[：:]\s*([0-9,]+)/i)
            let lotSize: number | undefined
            if (quantityMatch) {
                const quantity = parseInt(quantityMatch[1].replace(/,/g, ''))
                // GMOは通貨単位（例: 400,000）なので、標準ロット（100,000通貨）に変換
                lotSize = quantity / 100000
            }

            // 約定日時の検出
            const dateTimeMatch = body.match(/約定日時[：:]\s*(\d{2})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})/i)
            let entryTime = new Date().toISOString()
            if (dateTimeMatch) {
                const [_, yy, mm, dd, hh, min] = dateTimeMatch
                const year = 2000 + parseInt(yy)
                entryTime = new Date(year, parseInt(mm) - 1, parseInt(dd), parseInt(hh), parseInt(min)).toISOString()
            }

            // 決済の場合: 損益を抽出
            let pnl: { amount?: number; pips?: number; currency: string } | undefined
            let exitPrice: number | undefined

            if (isSettlement) {
                // 決済価格
                exitPrice = rate

                // 損益の検出（複数パターン対応）
                const pnlPatterns = [
                    /(?:決済損益|実現損益|損益)[：:]\s*([+-]?[0-9,]+)\s*円/i,
                    /(?:決済損益|実現損益|損益)[：:]\s*円?\s*([+-]?[0-9,]+)/i,
                    /(?:スワップ込み損益|合計損益)[：:]\s*([+-]?[0-9,]+)\s*円/i,
                ]

                for (const pattern of pnlPatterns) {
                    const pnlMatch = body.match(pattern)
                    if (pnlMatch) {
                        const amount = parseInt(pnlMatch[1].replace(/,/g, ''))
                        pnl = {
                            amount,
                            currency: 'JPY'
                        }
                        break
                    }
                }

                // 決済の場合でも pnl が見つからない場合がある（スワップのみなど）
                if (!pnl) {
                }
            }


            // 新規注文の場合はエントリー情報として保存
            // 決済注文の場合はexitPriceとpnlを含める
            return {
                pair,
                direction,
                entryPrice: isSettlement ? 0 : rate, // 決済の場合、元のエントリー価格は別途必要
                exitPrice: isSettlement ? rate : undefined,
                lotSize,
                entryTime,
                exitTime: isSettlement ? entryTime : undefined,
                pnl,
                pnlSource: pnl ? 'email' : undefined,
                notes: isSettlement
                    ? `GMO決済通知から自動取込 (約定レート: ${rate})`
                    : `GMO新規注文通知から自動取込`,
                broker: "GMOクリック証券",
                originalEmailId: emailId,
                isVerified: true,
                verificationSource: "gmail_import",
                tags: ["GMO", "AutoImport", isSettlement ? "決済" : "新規"]
            }
        } catch (e) {
            console.error("GMO Parsing Error", e)
            return null
        }
    },

    // ===================
    // DMM FX パーサー
    // ===================
    parseDMM(body: string, emailId: string): ParsedTrade | null {
        try {
            const generic = this.parseGeneric(body, emailId)
            if (generic) {
                generic.broker = "DMM FX"
                generic.tags = ["DMM", "AutoImport"]
            }
            return generic
        } catch (e) {
            console.error("DMM Parsing Error", e)
            return null
        }
    },

    // ===================
    // SBI FXトレード パーサー
    // ===================
    parseSBI(body: string, emailId: string): ParsedTrade | null {
        try {
            const generic = this.parseGeneric(body, emailId)
            if (generic) {
                generic.broker = "SBI FXトレード"
                generic.tags = ["SBI", "AutoImport"]
            }
            return generic
        } catch (e) {
            console.error("SBI Parsing Error", e)
            return null
        }
    },

    // ===================
    // LLM Fallback (GPT-4o-mini)
    // ===================
    async parseWithLLM(subject: string, body: string, emailId: string): Promise<ParsedTrade | null> {
        try {
            const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            })

            const systemPrompt = `
You are a specialized FX trade email parser.
Your task is to extract trade details from a trade confirmation email and return them in a strict JSON format.
If the email does not contain valid trade confirmation data, return null.

Required JSON Structure:
{
  "pair": string (e.g. "USDJPY", "EURUSD"),
  "direction": "BUY" | "SELL",
  "entryPrice": number (if new entry),
  "exitPrice": number (if settlement/exit),
  "lotSize": number,
  "entryTime": string (ISO 8601),
  "exitTime": string (ISO 8601, only if settlement),
  "pnl": { "amount": number, "currency": "JPY" | "USD" } (only if settlement),
  "broker": string (inferred from email),
  "isSettlement": boolean
}

Rules:
- If it is a "New Order" (Entry), exitPrice and pnl should be null.
- If it is a "Settlement" (Exit), entryPrice should be 0 (or extracted if available as 'open price'), and exitPrice/pnl must be present.
- Normalize pairs to "USDJPY" format (no slashes).
- If cannot parse, return null JSON.
`
            const userPrompt = `
Subject: ${subject}
Body:
${body}
`
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                temperature: 0,
                response_format: { type: "json_object" }
            })

            const content = response.choices[0].message.content
            if (!content) return null

            const data = JSON.parse(content)
            if (!data || !data.pair) return null

            // Map to ParsedTrade interface
            return {
                pair: data.pair,
                direction: data.direction,
                entryPrice: data.entryPrice || 0,
                exitPrice: data.exitPrice || undefined,
                lotSize: data.lotSize,
                entryTime: data.entryTime || new Date().toISOString(),
                exitTime: data.exitTime || undefined,
                pnl: data.pnl?.amount ? {
                    amount: data.pnl.amount,
                    currency: data.pnl.currency || 'JPY',
                    pips: 0 // Cannot reliably calc pips without knowing entry in settlement sometimes
                } : undefined,
                pnlSource: data.pnl?.amount ? 'email' : undefined,
                notes: `Auto-imported via AI Fallback (${data.broker || 'Unknown'})`,
                broker: data.broker || "Unknown",
                originalEmailId: emailId,
                isVerified: true,
                verificationSource: "gmail_import_ai",
                tags: ["AI_Import", data.broker || "Unknown", data.isSettlement ? "決済" : "新規"]
            }

        } catch (e) {
            console.error("LLM Parsing Error", e)
            return null
        }
    }
}

