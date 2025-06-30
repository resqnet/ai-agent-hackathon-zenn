"use client";
import { Home, MessageCircle, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

export const BottomNavigation = () => {
  const pathname = usePathname();

  // 個別チャットページではBottomNavigationを非表示（一覧ページでは表示）
  const hiddenPaths = ['/dinner-consultation'];
  const shouldHide = hiddenPaths.some(path => pathname?.startsWith(path)) || 
                   (pathname?.startsWith('/chat/') && pathname.length > 6); // /chat/[sessionId]の場合のみ非表示

  // 非表示対象のページでは何も表示しない
  if (shouldHide) {
    return null;
  }

  const navItems = [
    { href: "/", icon: Home, label: "ホーム" },
    { href: "/chat", icon: MessageCircle, label: "会話" },
    { href: "/settings", icon: Settings, label: "設定" },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t shadow-md z-50 pb-safe">
      <ul className="flex justify-around">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex flex-col items-center justify-center py-2 h-14 text-xs transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-foreground/50 hover:text-foreground/60"
                }`}
              >
                <Icon size={24} className="mb-0.5" aria-hidden />
                <span className="font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};
