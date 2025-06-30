// 全体コンテナレイアウト

import React from 'react';
import { cn } from '@/utils/cn';

interface AppLayoutProps {
  children: React.ReactNode;
  backgroundColor?: 'default' | 'muted';
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, backgroundColor = 'default' }) => {
  const bgClass = backgroundColor === 'muted' ? 'bg-muted' : 'bg-background';

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-yellow-50">
      <div className={cn('max-w-md w-full min-h-screen rounded-3xl p-2 shadow-2xl mx-auto', bgClass)}>
        <div className="w-full rounded-3xl relative">
          <div className="flex flex-col">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};