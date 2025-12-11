"use client"

import { useState, useEffect } from "react"
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

const STORAGE_KEY = 'solo-chat-history'

// Helper function to convert File to base64
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => {
            const result = reader.result as string
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

    // Load conversation history from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                setMessages(parsed.messages || [])
                setCurrentMode(parsed.mode || null)
            } catch (e) {
                // Ignore parse errors
            }
        }
    }, [])

    // Save conversation history to localStorage on change
    useEffect(() => {
        if (messages.length > 0 || currentMode) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                messages,
                mode: currentMode
            }))
        }
    }, [messages, currentMode])

    const handleClearHistory = () => {
        setMessages([])
        setCurrentMode(null)
        localStorage.removeItem(STORAGE_KEY)
    }

    const handleModeSelect = (mode: 'pre-trade' | 'post-trade' | 'review') => {
        setCurrentMode(mode)
        let initialMessage = ""
        switch (mode) {
            case 'pre-trade':
                initialMessage = "エントリー前チェックですね。「通貨ペア」と「根拠」を教えてください。"
                break
            case 'post-trade':
                initialMessage = "お疲れ様でした。チャート画像か、結果と感情を教えてください。"
                break
            case 'review':
                initialMessage = "振り返りを行いましょう。最近のトレードで気になることはありますか？"
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

    const getAIResponse = async (content: string, mode: InsightMode | null) => {
        const conversationHistory: ChatMessage[] = messages.map(msg => ({
            role: msg.role === 'ai' ? 'assistant' : 'user',
            content: msg.content
        }))

        if (mode) {
            return await generateCoachingResponse(content, mode as any, conversationHistory)
        }
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
                const file = files[0]
                const base64 = await fileToBase64(file)
                const imageAnalysis = await analyzeChartImage(base64, content || 'このチャートを分析してください')
                responseContent += imageAnalysis
            }

            if (content.trim()) {
                if (currentMode) {
                    const coachingResponse = await getAIResponse(content, currentMode)
                    if (responseContent) responseContent += "\n---\n"
                    responseContent += coachingResponse
                } else {
                    const textResult = await analyzeTrade(content)
                    if (responseContent) responseContent += "\n---\n"
                    responseContent += textResult.summary

                    const rules = user ? await tradeRuleService.getRules(user.id) : []
                    const activeRules = rules.filter(r => r.isActive)

                    if (activeRules.length > 0) {
                        const reviewResult = await reviewTrade(content, activeRules)
                        responseContent += "\n\n---\n" + reviewResult.feedback
                    }
                }

                if (user && !currentMode) {
                    await tradeService.createTrade({
                        pair: 'Unknown',
                        direction: 'BUY',
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
                content: responseContent || "入力を受け取りました。",
                timestamp: new Date().toLocaleTimeString()
            }

            setMessages(prev => [...prev, aiResponse])
        } catch (error) {
            console.error("Error processing trade:", error)
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'ai',
                content: "申し訳ありません。エラーが発生しました。",
                timestamp: new Date().toLocaleTimeString()
            }])
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header with safe-area */}
            <header className="sticky top-0 z-50 pt-[env(safe-area-inset-top)] px-4 pb-2 bg-background border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-solo-gold flex items-center justify-center">
                        <span className="text-solo-black text-xs font-bold">S</span>
                    </div>
                    <span className="font-semibold text-sm">AIパートナー</span>
                </div>
                {messages.length > 0 && (
                    <button
                        onClick={handleClearHistory}
                        className="text-xs text-muted-foreground hover:text-foreground"
                    >
                        クリア
                    </button>
                )}
            </header>

            {/* Messages Area */}
            <ScrollArea className="flex-1 min-h-0">
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-4 pt-8">
                        {/* Compact Welcome */}
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 rounded-xl bg-solo-gold mx-auto flex items-center justify-center mb-3">
                                <span className="text-solo-black text-lg font-bold">S</span>
                            </div>
                            <h1 className="text-base font-semibold">何かお手伝いできますか？</h1>
                        </div>

                        {/* Compact Mode Selection - Horizontal */}
                        <div className="w-full max-w-sm grid grid-cols-3 gap-2">
                            <button
                                onClick={() => handleModeSelect('pre-trade')}
                                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-card hover:border-solo-gold/50 transition-all"
                            >
                                <div className="w-10 h-10 rounded-lg bg-solo-gold/10 flex items-center justify-center">
                                    <CrosshairIcon className="h-5 w-5 text-solo-gold" />
                                </div>
                                <span className="text-xs font-medium text-center">エントリー前</span>
                            </button>

                            <button
                                onClick={() => handleModeSelect('post-trade')}
                                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-card hover:border-solo-gold/50 transition-all"
                            >
                                <div className="w-10 h-10 rounded-lg bg-solo-gold/10 flex items-center justify-center">
                                    <PenLine className="h-5 w-5 text-solo-gold" />
                                </div>
                                <span className="text-xs font-medium text-center">振り返り</span>
                            </button>

                            <button
                                onClick={() => handleModeSelect('review')}
                                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border bg-card hover:border-solo-gold/50 transition-all"
                            >
                                <div className="w-10 h-10 rounded-lg bg-solo-gold/10 flex items-center justify-center">
                                    <BarChart3 className="h-5 w-5 text-solo-gold" />
                                </div>
                                <span className="text-xs font-medium text-center">分析</span>
                            </button>
                        </div>

                        <p className="text-xs text-muted-foreground mt-4">
                            または下から直接メッセージを入力
                        </p>
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
                            <div className="w-full py-4 px-4">
                                <div className="flex gap-3 items-center">
                                    <div className="w-7 h-7 rounded-lg bg-solo-gold flex items-center justify-center animate-pulse">
                                        <span className="text-solo-black text-xs font-bold">S</span>
                                    </div>
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </ScrollArea>

            {/* Input Area with safe-area */}
            <div className="shrink-0 border-t bg-background pb-[env(safe-area-inset-bottom)]">
                <ChatInput onSend={handleSend} disabled={isProcessing} />
            </div>
        </div>
    )
}
