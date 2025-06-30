/**
 * Firebase設定
 */

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// 設定の検証
const requiredEnvVars = [
  'apiKey' as const,
  'authDomain' as const,
  'projectId' as const,
  'storageBucket' as const,
  'messagingSenderId' as const,
  'appId' as const,
]

const missingVars = requiredEnvVars.filter(
  (varName) => !firebaseConfig[varName]
)

if (missingVars.length > 0) {
  console.warn(
    `Firebase設定が不完全です。以下の環境変数が設定されていません: ${missingVars.join(', ')}`
  )
}

// Firebase アプリの初期化
export const app = initializeApp(firebaseConfig)

// Firebase Authentication の初期化
export const auth = getAuth(app)

export default app