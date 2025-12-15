"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Database } from "lucide-react"

export type DataSourceFilterType = 'all' | 'real' | 'gmail_sync' | 'manual' | 'demo'

interface DataSourceFilterProps {
    value: DataSourceFilterType
    onChange: (value: DataSourceFilterType) => void
}

export function DataSourceFilter({ value, onChange }: DataSourceFilterProps) {
    return (
        <Select value={value} onValueChange={(v) => onChange(v as DataSourceFilterType)}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
                <div className="flex items-center gap-2">
                    <Database className="h-3.5 w-3.5 text-muted-foreground" />
                    <SelectValue placeholder="データソース" />
                </div>
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="real">🟢 実データのみ</SelectItem>
                <SelectItem value="all">🌐 すべて表示</SelectItem>
                <SelectItem value="gmail_sync">📧 Gmail同期のみ</SelectItem>
                <SelectItem value="manual">✏️ 手動入力のみ</SelectItem>
                <SelectItem value="demo">🎭 デモデータのみ</SelectItem>
            </SelectContent>
        </Select>
    )
}
