"use client";

/**
 * Firebase Auth と API Client の統合を管理するコンポーネント
 * ユーザー認証状態をZustandストアと同期し、APIクライアントに認証トークンを設定
 */

import { useEffect } from "react";
import { useAuth } from "@/providers/FirebaseAuthProvider";
import { useAuthActions } from "@/stores/app-store";
import { apiClient } from "@/utils/api-client";

export function AuthIntegration() {
  const { user, loading, getIdToken } = useAuth();
  const { setAuthUser, setAuthLoading } = useAuthActions();

  // Firebase認証状態をZustandストアに同期
  useEffect(() => {
    setAuthLoading(loading);
    if (user) {
      setAuthUser({
        uid: user.uid,
        email: user.email ?? "",
        displayName: user.displayName ?? "",
        photoURL: user.photoURL ?? "",
        emailVerified: user.emailVerified,
      });
    }
  }, [user, loading, setAuthUser, setAuthLoading]);

  // APIクライアントに認証トークン取得関数を設定
  useEffect(() => {
    apiClient.setAuthTokenProvider(getIdToken);
  }, [getIdToken]);

  return null; // UIを持たないロジックコンポーネント
}
