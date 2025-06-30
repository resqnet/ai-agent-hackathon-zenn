import type { Metadata, Viewport } from "next";
import { QueryProvider } from "@/providers/query-provider";
import { FirebaseAuthProvider } from "@/providers/FirebaseAuthProvider";
import { AuthIntegration } from "@/components/auth/AuthIntegration";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kids Food Advisor",
  description: "1歳半〜3歳幼児向け栄養相談アプリ",
  keywords: ["幼児", "栄養", "食事", "相談", "アレルギー", "離乳食"],
  authors: [{ name: "Kids Food Advisor Team" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // モバイル向けピンチズーム無効化
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f5" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className="font-sans">
        <FirebaseAuthProvider>
          <AuthIntegration />
          <QueryProvider>
            {children}
          </QueryProvider>
        </FirebaseAuthProvider>
      </body>
    </html>
  );
}
