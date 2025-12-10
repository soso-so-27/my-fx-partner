import type { Metadata } from "next";
import { Noto_Sans_JP, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { MobileNav } from "@/components/ui/mobile-nav";
import { DesktopNav } from "@/components/ui/desktop-nav";
import { UserMenu } from "@/components/ui/user-menu";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";
import { NextAuthProvider } from "@/components/auth/next-auth-provider";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "SOLO - 個人投資家の成長OS",
  description: "自分と向き合い、成長を積み上げるためのトレード記録アプリ",
  manifest: "/manifest.json",
  themeColor: "#C8A85F",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SOLO",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body
        className={`${notoSansJP.variable} ${jetBrainsMono.variable} antialiased pb-16 md:pb-0 md:pt-16`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NextAuthProvider>
            <AuthProvider>
              <DesktopNav />
              {children}
              <MobileNav />
              <Toaster />
            </AuthProvider>
          </NextAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
