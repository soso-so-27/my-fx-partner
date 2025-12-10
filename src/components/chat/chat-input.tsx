"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Paperclip, ArrowUp, Image } from "lucide-react"

interface ChatInputProps {
    onSend: (message: string, files?: File[]) => void
    disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [input, setInput] = useState("")
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleSend = () => {
        if (input.trim() || selectedFiles.length > 0) {
            onSend(input, selectedFiles.length > 0 ? selectedFiles : undefined)
            setInput("")
            setSelectedFiles([])
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setSelectedFiles(Array.from(e.target.files))
        }
    }

    const adjustTextareaHeight = () => {
        const textarea = textareaRef.current
        if (textarea) {
            textarea.style.height = 'auto'
            textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
        }
    }

    return (
        <div className="p-4">
            {/* File Preview */}
            {selectedFiles.length > 0 && (
                <div className="flex gap-2 mb-3 flex-wrap">
                    {selectedFiles.map((file, index) => (
                        <div key={index} className="relative group">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm">
                                <Image className="h-4 w-4 text-muted-foreground" />
                                <span className="max-w-[100px] truncate">{file.name}</span>
                                <button
                                    onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    ×
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Input Container - ChatGPT Style */}
            <div className="relative flex items-end gap-2 bg-muted/50 rounded-2xl border border-border/50 focus-within:border-solo-gold/50 transition-colors">
                {/* File Attach Button */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                />
                <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 h-10 w-10 rounded-xl ml-1 mb-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled}
                >
                    <Paperclip className="h-5 w-5 text-muted-foreground" />
                </Button>

                {/* Textarea */}
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value)
                        adjustTextareaHeight()
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="メッセージを入力..."
                    className="flex-1 bg-transparent border-0 py-3 px-1 text-sm resize-none focus:outline-none placeholder:text-muted-foreground min-h-[44px] max-h-[200px]"
                    disabled={disabled}
                    rows={1}
                />

                {/* Send Button */}
                <Button
                    onClick={handleSend}
                    disabled={disabled || (!input.trim() && selectedFiles.length === 0)}
                    size="icon"
                    className="shrink-0 h-8 w-8 rounded-lg mr-2 mb-2 bg-solo-gold hover:bg-solo-gold/80 text-solo-black disabled:bg-muted disabled:text-muted-foreground"
                >
                    <ArrowUp className="h-4 w-4" />
                </Button>
            </div>

            {/* Hint Text */}
            <p className="text-xs text-muted-foreground text-center mt-2">
                Shift + Enter で改行
            </p>
        </div>
    )
}
