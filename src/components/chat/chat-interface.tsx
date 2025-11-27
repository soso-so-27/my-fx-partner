"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageBubble } from "./message-bubble"
import { ChatInput } from "./chat-input"
import { analyzeTrade, reviewTrade } from "@/lib/ai-service"
import { analyzeChartImage } from "@/lib/image-analysis"
import { tradeService } from "@/lib/trade-service"
import { tradeRuleService } from "@/lib/trade-rule-service"
import { useAuth } from "@/contexts/auth-context"

interface Message {
    id: string
    role: 'user' | 'ai'
    content: string
    timestamp: string
}

export function ChatInterface() {
    const { user } = useAuth()
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            role: 'ai',
            content: 'こんにちは！あなたのFXパートナーです。スクリーンショットをアップロードするか、今日のトレードについて教えてください。',
            timestamp: new Date().toLocaleTimeString()
        }
    ])
    const [isProcessing, setIsProcessing] = useState(false)

    const handleSend = async (content: string, files?: File[]) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: content + (files?.length ? ` [${files.length} ファイル添付]` : ''),
            timestamp: new Date().toLocaleTimeString()
        }

        setMessages(prev => [...prev, newMessage])
        setIsProcessing(true)

        try {
            let responseContent = ""

            if (files && files.length > 0) {
                // Analyze the first image for now
                const imageResult = await analyzeChartImage(files[0])
                responseContent += `チャート画像を解析しました。\n`
                responseContent += `**通貨ペア:** ${imageResult.pair} (${imageResult.timeframe})\n`
                responseContent += `**方向:** ${imageResult.direction}\n`
                responseContent += `**パターン:** ${imageResult.chartPattern}\n`
                responseContent += `**エントリー:** ${imageResult.entryPoint} | **SL:** ${imageResult.stopLoss} | **TP:** ${imageResult.takeProfit}\n`
            }

            if (content.trim()) {
                const textResult = await analyzeTrade(content)
                if (responseContent) responseContent += "\n---\n"
                responseContent += textResult.summary

                // AI Review against Rules
                const rules = user ? await tradeRuleService.getRules(user.id) : []
                const activeRules = rules.filter(r => r.isActive)

                if (activeRules.length > 0) {
                    const reviewResult = await reviewTrade(content, activeRules)
                    responseContent += "\n\n---\n" + reviewResult.feedback
                }

                // Save trade to mock DB
                if (user) {
                    await tradeService.createTrade({
                        pair: 'Unknown', // In real app, extract from analysis
                        direction: textResult.tradeType as any,
                        entryPrice: 0,
                        stopLoss: 0,
                        takeProfit: 0,
                        lotSize: 0.1,
                        entryTime: new Date().toISOString(),
                        notes: content,
                        tags: ['Chat Entry']
                    }, user.id)
                }
            }

            const aiResponse: Message = {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: responseContent || "入力を受け取りましたが、具体的な分析を生成できませんでした。",
                timestamp: new Date().toLocaleTimeString()
            }

            setMessages(prev => [...prev, aiResponse])
        } catch (error) {
            console.error("Error processing trade:", error)
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: "申し訳ありません。トレードの分析中にエラーが発生しました。",
                timestamp: new Date().toLocaleTimeString()
            }])
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto border rounded-xl overflow-hidden bg-background shadow-sm">
            <div className="bg-muted/50 p-4 border-b">
                <h2 className="font-semibold">トレードセッション</h2>
                <p className="text-xs text-muted-foreground">AIがあなたのトレードを分析し、ルール遵守をチェックします。</p>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-4">
                    {messages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            role={msg.role}
                            content={msg.content}
                            timestamp={msg.timestamp}
                        />
                    ))}
                    {isProcessing && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
                            <span className="animate-pulse">考え中...</span>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <ChatInput onSend={handleSend} disabled={isProcessing} />
        </div>
    )
}
