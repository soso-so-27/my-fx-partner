"use client"

import { useState } from "react"
import { PenSquare } from "lucide-react"
import { QuickRecordDialog } from "@/components/trade/quick-record-dialog"

export function FABButton() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="absolute left-1/2 -translate-x-1/2 -top-6 w-12 h-12 rounded-full bg-solo-navy dark:bg-solo-gold text-white dark:text-solo-black shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center z-50 border-4 border-background"
                aria-label="手動でトレードを記録"
            >
                <PenSquare className="h-5 w-5" />
            </button>

            <QuickRecordDialog open={open} onOpenChange={setOpen} />
        </>
    )
}

