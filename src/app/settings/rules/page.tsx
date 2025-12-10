"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ProtectedRoute } from "@/components/auth/protected-route"
import Link from "next/link"
import { TradeRuleManager } from "@/components/journal/trade-rule-manager"

export default function RulesPage() {
    return (
        <ProtectedRoute>
            <div className="container mx-auto p-4 pb-20 max-w-2xl">
                <div className="flex items-center gap-2 mb-6">
                    <Link href="/settings">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold">トレードルール</h1>
                </div>

                <TradeRuleManager />
            </div>
        </ProtectedRoute>
    )
}
