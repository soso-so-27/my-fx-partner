"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageBubble } from "./message-bubble"
import { ChatInput } from "./chat-input"
import { CrosshairIcon, PenLine, BarChart3 } from "lucide-react"
import { analyzeTrade, reviewTrade, generateCoachingResponse, analyzeChartImage, ChatMessage } from "@/lib/ai-service"
import { tradeService } from "@/lib/trade-service"
import { tradeRuleService } from "@/lib/trade-rule-service"
import { useAuth } from "@/contexts/auth-context"
import { insightService } from "@/lib/insight-service"
import { InsightMode } from "@/types/insight"
import { useToast } from "@/components/ui/use-toast"

interface Message {
    id: string
    role: 'user' | 'ai'
    content: string
    timestamp: string
}

// Helper function to convert File to base64
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
            const result = reader.result as string
            // Remove data URL prefix (e.g., "data:image/png;base64,")
            const base64 = result.split(',')[1]
            resolve(base64)
        }
        reader.onerror = error => reject(error)
    })
}

export function ChatInterface() {
    const { user } = useAuth()
    const { toast } = useToast()
    const [messages, setMessages] = useState<Message[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [currentMode, setCurrentMode] = useState<InsightMode | null>(null)

    const handleModeSelect = (mode: 'pre-trade' | 'post-trade' | 'review') => {
        setCurrentMode(mode)
        let initialMessage = ""
        switch (mode) {
            case 'pre-trade':
                initialMessage = "エントリー前チェックですね。\n監視中の「通貨ペア」と「根拠（セットアップ）」を教えてください。\nあなたのルールに適合しているか一緒に確認しましょう。"
                break
            case 'post-trade':
                initialMessage = "トレードお疲れ様でした。\nまずはチャート画像をアップロードするか、トレードの結果と、今の「感情」を率直に教えてください。"
                break
            case 'review':
                initialMessage = "振り返りを行いましょう。\n最近のトレードで「うまくいったこと」や「課題」だと感じていることはありますか？"
                break
        }

        setMessages([
            {
                id: '1',
                role: 'ai',
                content: initialMessage,
                timestamp: new Date().toLocaleTimeString()
            }
        ])
    }

    const handleSaveInsight = async (content: string, mode: InsightMode) => {
        if (!user) return
        try {
            await insightService.createInsight({ content, mode }, user.id)
            toast({
                title: "気づきを保存しました",
                description: "ジャーナルページで確認できます。",
            })
        } catch (error) {
            toast({
                title: "保存に失敗しました",
                description: "もう一度お試しください。",
                variant: "destructive"
            })
        }
    }

    // Custom AI Response Logic based on mode
    const getAIResponse = async (content: string, mode: InsightMode | null) => {
        // Build conversation history for context
        const conversationHistory: ChatMessage[] = messages.map(msg => ({
            role: msg.role === 'ai' ? 'assistant' : 'user',
            content: msg.content
        }))

        if (mode) {
            return await generateCoachingResponse(content, mode as any, conversationHistory)
        }
        // Default fallback with context
        return await generateCoachingResponse(content, 'review', conversationHistory)
    }

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
                // Convert file to base64 and analyze
                const file = files[0]
                const base64 = await fileToBase64(file)
                const imageAnalysis = await analyzeChartImage(base64, content || 'このチャートを分析してください')
                responseContent += imageAnalysis
            }

            if (content.trim()) {
                // If in a specific mode, use coaching logic
                if (currentMode) {
                    const coachingResponse = await getAIResponse(content, currentMode)
                    if (responseContent) responseContent += "\n---\n"
                    responseContent += coachingResponse
                } else {
                    // Default analysis logic
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
                }

                // Save trade to mock DB (only if it looks like a trade entry)
                if (user && !currentMode) { // Don't auto-save in coaching modes for now
                    await tradeService.createTrade({
                        pair: 'Unknown', // In real app, extract from analysis
                        direction: 'BUY', // Mock
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
        <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
            {/* Minimal Header */}
            <div className="px-4 py-3 border-b shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-solo-gold flex items-center justify-center">
                        <span className="text-solo-black text-sm font-bold">S</span>
                    </div>
                    <div>
                        <h2 className="font-semibold text-sm">SOLO AIパートナー</h2>
                        <p className="text-xs text-muted-foreground">トレードの悩みや分析をサポート</p>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 min-h-0">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6 max-w-lg mx-auto min-h-[60vh]">
                        {/* Welcome Section */}
                        <div className="text-center space-y-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-solo-gold mx-auto flex items-center justify-center">
                                <span className="text-solo-black text-xl font-bold">S</span>
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold">何かお手伝いできますか？</h1>
                                <p className="text-sm text-muted-foreground mt-1">
                                    タップして会話を始めるか、下から入力してください
                                </p>
                            </div>
                        </div>

                        {/* Single Unified Action Cards */}
                        <div className="w-full space-y-3">
                            <button
                                onClick={() => handleModeSelect('pre-trade')}
                                className="w-full flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-solo-gold/50 hover:bg-solo-gold/5 transition-all text-left group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-solo-gold/10 flex items-center justify-center group-hover:bg-solo-gold/20 transition-colors">
                                    <CrosshairIcon className="h-5 w-5 text-solo-gold" />
                                </div>
                                <div>
                                    <div className="font-medium text-sm group-hover:text-solo-gold transition-colors">エントリー前チェック</div>
                                    <div className="text-xs text-muted-foreground">ルールに沿っているか確認</div>
                                </div>
                            </button>

                            <button
                                onClick={() => handleModeSelect('post-trade')}
                                className="w-full flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-solo-gold/50 hover:bg-solo-gold/5 transition-all text-left group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-solo-gold/10 flex items-center justify-center group-hover:bg-solo-gold/20 transition-colors">
                                    <PenLine className="h-5 w-5 text-solo-gold" />
                                </div>
                                <div>
                                    <div className="font-medium text-sm group-hover:text-solo-gold transition-colors">トレードを振り返る</div>
                                    <div className="text-xs text-muted-foreground">感情と結果を整理</div>
                                </div>
                            </button>

                            <button
                                onClick={() => handleModeSelect('review')}
                                className="w-full flex items-center gap-4 p-4 rounded-xl border bg-card hover:border-solo-gold/50 hover:bg-solo-gold/5 transition-all text-left group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-solo-gold/10 flex items-center justify-center group-hover:bg-solo-gold/20 transition-colors">
                                    <BarChart3 className="h-5 w-5 text-solo-gold" />
                                </div>
                                <div>
                                    <div className="font-medium text-sm group-hover:text-solo-gold transition-colors">成績を分析</div>
                                    <div className="text-xs text-muted-foreground">傾向と改善点を発見</div>
                                </div>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col">
                        {messages.map((msg) => (
                            <MessageBubble
                                key={msg.id}
                                role={msg.role}
                                content={msg.content}
                                timestamp={msg.timestamp}
                                mode={currentMode || undefined}
                                onSaveInsight={handleSaveInsight}
                            />
                        ))}
                        {isProcessing && (
                            <div className="w-full py-4 px-4 md:px-8">
                                <div className="max-w-3xl mx-auto flex gap-4">
                                    <div className="w-8 h-8 rounded-lg bg-solo-gold flex items-center justify-center animate-pulse">
                                        <span className="text-solo-black text-sm font-bold">S</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>

            {/* Input Area */}
            <div className="shrink-0 border-t bg-background">
                <div className="max-w-3xl mx-auto">
                    <ChatInput onSend={handleSend} disabled={isProcessing} />
                </div>
            </div>
        </div>
    )
}

