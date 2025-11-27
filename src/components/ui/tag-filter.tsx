"use client"

import { PREDEFINED_TAGS, getTagColor } from "@/lib/tag-constants"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface TagFilterProps {
    selectedTags: string[]
    onChange: (tags: string[]) => void
}

export function TagFilter({ selectedTags, onChange }: TagFilterProps) {
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

    const allTags = Object.values(PREDEFINED_TAGS).flatMap(({ tags }) => tags)

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">🏷️ タグで絞り込み</h3>
                {selectedTags.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAll} className="h-8">
                        <X className="h-3 w-3 mr-1" />
                        クリア ({selectedTags.length})
                    </Button>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag)
                    return (
                        <Badge
                            key={tag}
                            variant={isSelected ? "default" : "outline"}
                            className={`cursor-pointer transition-all ${isSelected ? getTagColor(tag) : 'hover:bg-muted'
                                }`}
                            onClick={() => toggleTag(tag)}
                        >
                            {tag}
                        </Badge>
                    )
                })}
            </div>
        </div>
    )
}
