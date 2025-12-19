"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { InstallPrompt } from "@/components/pwa/install-prompt"

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const { resolvedTheme } = useTheme()

    // 動的にtheme-colorを更新（PWAステータスバー対応）
    useEffect(() => {
        const themeColor = resolvedTheme === 'dark' ? '#0B1220' : '#F7F8FB'

        // 既存のtheme-colorメタタグを更新
        const metaThemeColor = document.querySelector('meta[name="theme-color"]:not([media])')
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', themeColor)
        } else {
            // media属性なしのtheme-colorを追加（PWA用）
            const meta = document.createElement('meta')
            meta.name = 'theme-color'
            meta.content = themeColor
            document.head.appendChild(meta)
        }

        // media付きのメタタグも更新
        const lightMeta = document.querySelector('meta[name="theme-color"][media*="light"]')
        const darkMeta = document.querySelector('meta[name="theme-color"][media*="dark"]')

        if (lightMeta) lightMeta.setAttribute('content', '#F7F8FB')
        if (darkMeta) darkMeta.setAttribute('content', '#0B1220')
    }, [resolvedTheme])

    return (
        <>
            {children}
            <InstallPrompt />
        </>
    )
}
