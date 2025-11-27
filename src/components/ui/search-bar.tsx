"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

interface SearchBarProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = "通貨ペアまたはキーワードで検索..." }: SearchBarProps) {
    const [localValue, setLocalValue] = useState(value)

    const handleClear = () => {
        setLocalValue("")
        onChange("")
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value
        setLocalValue(newValue)
        onChange(newValue)
    }

    return (
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
                type="text"
                placeholder={placeholder}
                value={localValue}
                onChange={handleChange}
                className="pl-10 pr-10"
            />
            {localValue && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                    onClick={handleClear}
                >
                    <X className="h-4 w-4" />
                </Button>
            )}
        </div>
    )
}
