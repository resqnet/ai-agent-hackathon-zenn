'use client'

/**
 * Firebase認証プロバイダー
 */

import { GoogleAuthProvider, User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { ReactNode, createContext, useContext, useEffect, useState } from 'react'
import { auth } from '@/config/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  getIdToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface FirebaseAuthProviderProps {
  children: ReactNode
}

export function FirebaseAuthProvider({ children }: FirebaseAuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    try {
      setLoading(true)
      const provider = new GoogleAuthProvider()
      
      // スコープの追加（必要に応じて）
      provider.addScope('email')
      provider.addScope('profile')
      
      const result = await signInWithPopup(auth, provider)
      console.log('Google サインイン成功:', result.user.email)
    } catch (error) {
      console.error('Google サインインエラー:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      setLoading(true)
      await signOut(auth)
      console.log('サインアウト成功')
    } catch (error) {
      console.error('サインアウトエラー:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getIdToken = async (): Promise<string | null> => {
    if (!user) {
      return null
    }
    
    try {
      const token = await user.getIdToken()
      return token
    } catch (error) {
      console.error('IDトークン取得エラー:', error)
      return null
    }
  }

  const contextValue: AuthContextType = {
    user,
    loading,
    signInWithGoogle,
    signOut: handleSignOut,
    getIdToken,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a FirebaseAuthProvider')
  }
  return context
}