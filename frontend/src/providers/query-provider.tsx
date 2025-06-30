'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 5分間キャッシュ
            staleTime: 5 * 60 * 1000,
            // ネットワークエラー時のリトライ
            retry: (failureCount, error: Error) => {
              // 4xx エラーはリトライしない
              if ('response' in error && typeof error.response === 'object' && error.response !== null) {
                const response = error.response as { status?: number };
                if (response.status && response.status >= 400 && response.status < 500) {
                  return false;
                }
              }
              return failureCount < 3;
            },
            // ウィンドウフォーカス時の再取得を無効化（モバイル向け）
            refetchOnWindowFocus: false,
          },
          mutations: {
            // ミューテーションのリトライ設定
            retry: (failureCount, error: Error) => {
              if ('response' in error && typeof error.response === 'object' && error.response !== null) {
                const response = error.response as { status?: number };
                if (response.status && response.status >= 400 && response.status < 500) {
                  return false;
                }
              }
              return failureCount < 2;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}