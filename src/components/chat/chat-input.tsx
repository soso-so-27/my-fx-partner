"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Paperclip, Send } from "lucide-react"

interface ChatInputProps {
    onSend: (message: string, files?: File[]) => void
    disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [input, setInput] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSend = () => {
        if (input.trim() || (fileInputRef.current?.files?.length ?? 0) > 0) {
            onSend(input, fileInputRef.current?.files ? Array.from(fileInputRef.current.files) : undefined)
            setInput("")
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="flex items-end gap-2 p-4 border-t bg-background">
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                accept="image/*"
                onChange={() => {
                    // Optional: Show preview or count of selected files
                }}
            />
            <Button
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
            >
                <Paperclip className="h-5 w-5" />
                <span className="sr-only">Attach file</span>
            </Button>

            <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="トレードについて教えてください..."
                className="min-h-[2.5rem] max-h-32 resize-none"
                disabled={disabled}
            />

            <Button
                onClick={handleSend}
                disabled={disabled || (!input.trim() && (!fileInputRef.current?.files?.length))}
                className="shrink-0"
            >
                <Send className="h-5 w-5" />
                <span className="sr-only">Send message</span>
            </Button>
        </div>
    )
}
