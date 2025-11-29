"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { QuickRecordDialog } from "@/components/trade/quick-record-dialog"

export function FABButton() {
    const [open, setOpen] = useState(false)

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="absolute left-1/2 -translate-x-1/2 -top-6 w-14 h-14 rounded-full bg-solo-gold text-solo-black shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-50 border-4 border-background"
                aria-label="クイック記録"
            >
                <Plus className="h-6 w-6" />
            </button>

            <QuickRecordDialog open={open} onOpenChange={setOpen} />
        </>
    )
}
