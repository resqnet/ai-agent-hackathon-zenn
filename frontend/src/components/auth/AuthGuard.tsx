'use client'

/**
 * 認証ガードコンポーネント
 * 認証状態に応じてコンテンツを表示/非表示にする
 */

import { ReactNode } from 'react'
import { useAuth } from '@/providers/FirebaseAuthProvider'
import { LoginForm } from './LoginForm'

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, loading } = useAuth()

  // ローディング中
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600">アプリを読み込み中...</p>
        </div>
      </div>
    )
  }

  // 未認証の場合
  if (!user) {
    return fallback || <LoginForm />
  }

  // 認証済みの場合
  return <>{children}</>
}

/**
 * オプショナル認証ガード
 * 認証していなくてもコンテンツを表示するが、認証状態によって表示を変える場合に使用
 */
export function OptionalAuthGuard({ children }: { children: ReactNode }) {
  const { loading } = useAuth()

  // ローディング中は何も表示しない（または最小限のローディング表示）
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}