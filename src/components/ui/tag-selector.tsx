"use client"

import { useState } from "react"
import { PREDEFINED_TAGS, getTagColor } from "@/lib/tag-constants"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface TagSelectorProps {
    selectedTags: string[]
    onChange: (tags: string[]) => void
}

export function TagSelector({ selectedTags, onChange }: TagSelectorProps) {
    const toggleTag = (tag: string) => {
        if (selectedTags.includes(tag)) {
            onChange(selectedTags.filter(t => t !== tag))
        } else {
            onChange([...selectedTags, tag])
        }
    }

    const clearAll = () => {
        onChange([])
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">🏷️ タグを選択</h3>
                {selectedTags.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAll}>
                        クリア
                    </Button>
                )}
            </div>

            {Object.entries(PREDEFINED_TAGS).map(([category, { label, tags }]) => (
                <div key={category} className="space-y-2">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => {
                            const isSelected = selectedTags.includes(tag)
                            return (
                                <Badge
                                    key={tag}
                                    variant={isSelected ? "default" : "outline"}
                                    className={`cursor-pointer transition-all ${isSelected ? getTagColor(tag) : ''
                                        }`}
                                    onClick={() => toggleTag(tag)}
                                >
                                    {tag}
                                    {isSelected && <X className="ml-1 h-3 w-3" />}
                                </Badge>
                            )
                        })}
                    </div>
                </div>
            ))}

            {selectedTags.length > 0 && (
                <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">選択中のタグ ({selectedTags.length})</p>
                    <div className="flex flex-wrap gap-2">
                        {selectedTags.map((tag) => (
                            <Badge key={tag} className={getTagColor(tag)}>
                                {tag}
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
