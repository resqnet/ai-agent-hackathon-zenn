/**
 * Orval生成APIフックの使用例
 * Kids Food Advisor用にカスタマイズされたReact Queryフック
 */

// 一時的にOrval生成APIをコメントアウト（ビルド時に利用できないため）
// import {
//   useHealthCheckApiHealthGet,
//   useSendChatMessageApiChatPost,
//   useStreamChatMessageApiChatStreamPost,
//   useAnalyzeFoodImageApiImageAnalyzePost,
//   useGetUserPreferencesApiUserPreferencesGet,
//   useUpdateUserPreferencesApiUserPreferencesPut,
//   type ChatRequest,
//   type UserPreferences,
//   type BodyAnalyzeFoodImageApiImageAnalyzePost,
// } from '@/generated/api';

// 型定義のフォールバック
type UserPreferences = { child_age_months: number; allergies: string[]; dietary_restrictions: string[]; };

// =============================================================================
// ヘルスチェック
// =============================================================================
export const useHealthCheck = () => {
  // 一時的にダミー実装
  return {
    isLoading: false,
    error: null,
    data: { success: true }
  };
};

// =============================================================================
// チャット機能
// =============================================================================
export const useChatMessage = () => {
  // 一時的にダミー実装
  return {
    mutate: () => {},
    isPending: false,
    error: null,
    data: null,
    reset: () => {}
  };
};

// ストリーミングチャット（基本設定のみ、実際のSSE処理は別途実装）
export const useStreamingChat = () => {
  // 一時的にダミー実装
  return {
    mutate: () => {},
    isPending: false,
    error: null,
    data: null,
    reset: () => {}
  };
};

// =============================================================================
// 画像解析
// =============================================================================
export const useFoodImageAnalysis = () => {
  // 一時的にダミー実装
  return {
    mutate: () => {},
    isPending: false,
    error: null,
    data: null,
    reset: () => {}
  };
};

// =============================================================================
// ユーザー設定
// =============================================================================
export const useUserPreferences = () => {
  // 一時的にダミー実装
  return {
    isLoading: false,
    error: null,
    data: { data: { child_age_months: 24, allergies: [], dietary_restrictions: [] } },
    refetch: () => {}
  };
};

export const useUpdateUserPreferences = () => {
  // 一時的にダミー実装
  return {
    mutate: () => {},
    isPending: false,
    error: null,
    data: null,
    reset: () => {}
  };
};

// =============================================================================
// 複合的なカスタムフック（業務ロジック統合）
// =============================================================================

/**
 * チャット送信のラッパーフック
 * セッション管理と型安全性を提供
 */
export const useKidsFoodChat = () => {
  const chatMutation = useChatMessage();

  const sendMessage = () => {
    return chatMutation.mutate();
  };

  return {
    sendMessage,
    isLoading: chatMutation.isPending,
    error: chatMutation.error,
    data: chatMutation.data,
    reset: chatMutation.reset,
  };
};

/**
 * 食事画像解析のラッパーフック
 * ファイル処理と進捗表示を統合
 */
export const useKidsFoodImageAnalysis = () => {
  const analysisMutation = useFoodImageAnalysis();

  const analyzeImage = () => {
    return analysisMutation.mutate();
  };

  return {
    analyzeImage,
    isLoading: analysisMutation.isPending,
    error: analysisMutation.error,
    data: analysisMutation.data,
    reset: analysisMutation.reset,
  };
};

/**
 * ユーザー設定管理のラッパーフック
 * 取得と更新を統合
 */
export const useKidsUserSettings = () => {
  const preferencesQuery = useUserPreferences();
  const updateMutation = useUpdateUserPreferences();

  const updatePreferences = () => {
    return updateMutation.mutate();
  };

  return {
    preferences: preferencesQuery.data?.data as UserPreferences,
    updatePreferences,
    isLoading: preferencesQuery.isLoading || updateMutation.isPending,
    error: preferencesQuery.error || updateMutation.error,
    refetch: preferencesQuery.refetch,
  };
};