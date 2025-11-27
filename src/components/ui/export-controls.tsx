"use client"

import { Trade } from "@/types/trade"
import { AnalysisStats } from "@/lib/analysis-engine"
import { exportToCSV, exportToPDF } from "@/lib/export-utils"
import { Button } from "@/components/ui/button"
import { Download, FileText } from "lucide-react"

interface ExportControlsProps {
    trades: Trade[]
    stats?: AnalysisStats | null
    disabled?: boolean
}

export function ExportControls({ trades, stats, disabled = false }: ExportControlsProps) {
    const handleCSVExport = () => {
        const filename = `trades_${new Date().toISOString().split('T')[0]}.csv`
        exportToCSV(trades, filename)
    }

    const handlePDFExport = () => {
        const filename = `trades_${new Date().toISOString().split('T')[0]}.pdf`
        exportToPDF(trades, stats, filename)
    }

    const hasData = trades.length > 0

    return (
        <div className="flex gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={handleCSVExport}
                disabled={disabled || !hasData}
                className="gap-2"
            >
                <Download className="h-4 w-4" />
                CSV
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={handlePDFExport}
                disabled={disabled || !hasData}
                className="gap-2"
            >
                <FileText className="h-4 w-4" />
                PDF
            </Button>
        </div>
    )
}
