import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, queryKeys, handleApiError } from '@/utils/api-client';
import type { 
  UserPreferences, 
  FoodAnalysis
} from '@/types';

// ヘルスチェック
export function useHealthCheck() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => apiClient.healthCheck(),
    staleTime: 5 * 60 * 1000, // 5分
    retry: 1,
  });
}

// ユーザー設定の取得
export function useUserPreferences() {
  return useQuery({
    queryKey: queryKeys.userPreferences,
    queryFn: () => apiClient.getUserPreferences(),
    staleTime: 10 * 60 * 1000, // 10分
  });
}

// ユーザー設定の更新
export function useUpdateUserPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (preferences: Partial<UserPreferences>) =>
      apiClient.updateUserPreferences(preferences),
    onSuccess: (data) => {
      // キャッシュを更新
      queryClient.setQueryData(queryKeys.userPreferences, data);
    },
    onError: handleApiError,
  });
}

// 食材画像解析
export function useAnalyzeFood() {
  return useMutation({
    mutationFn: ({ image, progressCallback }: { image: File; progressCallback?: (progress: number) => void }) => 
      apiClient.analyzeFood(image, progressCallback),
    onError: handleApiError,
  });
}

// ストリーミングチャット用のカスタムフック
export function useChatStream() {
  return useMutation({
    mutationFn: ({ message, sessionId }: { message: string; sessionId: string }) =>
      apiClient.createChatStream(message, sessionId),
    onError: handleApiError,
  });
}

// 画像解析結果のキャッシュ管理
export function useCachedFoodAnalysis(imageId: string) {
  const queryClient = useQueryClient();

  const getCachedAnalysis = (): FoodAnalysis | undefined => {
    return queryClient.getQueryData(queryKeys.foodAnalysis(imageId));
  };

  const setCachedAnalysis = (data: FoodAnalysis) => {
    queryClient.setQueryData(queryKeys.foodAnalysis(imageId), data);
  };

  const removeCachedAnalysis = () => {
    queryClient.removeQueries({ queryKey: queryKeys.foodAnalysis(imageId) });
  };

  return {
    getCachedAnalysis,
    setCachedAnalysis,
    removeCachedAnalysis,
  };
}

// 接続状態チェック
export function useConnectionStatus() {
  return useQuery({
    queryKey: ['connection', 'status'],
    queryFn: () => apiClient.healthCheck(),
    refetchInterval: 30000, // 30秒ごとにチェック
    retry: false,
    staleTime: 0,
  });
}

// オフライン検出
export function useOfflineStatus() {
  const { data, isError } = useConnectionStatus();
  return {
    isOnline: !isError && data?.status === 'ok',
    isOffline: isError || data?.status !== 'ok',
  };
}