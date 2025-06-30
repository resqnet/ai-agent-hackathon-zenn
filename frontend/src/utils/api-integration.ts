/**
 * 既存APIクライアントとOrval生成APIの統合レイヤー
 * 段階的移行を支援するハイブリッドAPIクライアント
 */

import { apiClient } from './api-client';
import {
  useKidsFoodChat,
  useKidsFoodImageAnalysis,
  useKidsUserSettings,
  useHealthCheck,
} from '@/hooks/useOrvalApi';
import type { FoodAnalysis, UserPreferences as LegacyUserPreferences } from '@/types';
import type { UserPreferences as OrvalUserPreferences } from '@/generated/api';

// =============================================================================
// 型マッピング（既存型 ⇄ Orval生成型）
// =============================================================================

/**
 * 既存UserPreferences型をOrval型に変換
 */
export const mapLegacyToOrvalUserPreferences = (
  legacy: LegacyUserPreferences
): OrvalUserPreferences => ({
  child_age_months: legacy.childInfo.age,
  allergies: legacy.allergies.map(a => a.name),
  dietary_restrictions: legacy.dietaryRestrictions,
});

/**
 * Orval型を既存UserPreferences型に変換
 */
export const mapOrvalToLegacyUserPreferences = (
  orval: OrvalUserPreferences
): Partial<LegacyUserPreferences> => ({
  childInfo: {
    age: orval.child_age_months || 24,
  },
  allergies: (orval.allergies || []).map(name => ({
    id: name,
    name,
    severity: 'mild' as const,
    type: 'food' as const,
  })),
  dietaryRestrictions: orval.dietary_restrictions || [],
});

// =============================================================================
// ハイブリッドAPIクライアント
// =============================================================================

export class HybridApiClient {
  // 既存APIクライアント（後方互換性）
  private legacy = apiClient;

  // Orval生成フックアクセス用
  public useOrvalHooks() {
    return {
      useChat: useKidsFoodChat,
      useImageAnalysis: useKidsFoodImageAnalysis,
      useUserSettings: useKidsUserSettings,
      useHealthCheck: useHealthCheck,
    };
  }

  // =============================================================================
  // 移行済み機能（Orval使用推奨）
  // =============================================================================

  /**
   * チャット機能（Orval推奨）
   * 新規実装はOrvalフックを使用
   */
  async sendChatMessage(message: string, sessionId: string) {
    console.warn('⚠️  Consider using useKidsFoodChat hook for better React integration');
    // フォールバック: 既存実装
    return this.legacy.sendChatMessage(message, sessionId);
  }

  /**
   * ユーザー設定（Orval推奨）
   * 新規実装はOrvalフックを使用
   */
  async getUserPreferences() {
    console.warn('⚠️  Consider using useKidsUserSettings hook for better React integration');
    // フォールバック: 既存実装
    return this.legacy.getUserPreferences();
  }

  // =============================================================================
  // 従来機能（既存APIクライアント継続使用）
  // =============================================================================

  /**
   * 画像解析（既存実装継続）
   * プログレス機能が重要なため既存実装を維持
   */
  async analyzeFood(image: File, progressCallback?: (progress: number) => void): Promise<FoodAnalysis> {
    return this.legacy.analyzeFood(image, progressCallback);
  }

  /**
   * ストリーミングチャット（既存実装継続）
   * 複雑なSSE処理は既存実装を維持
   */
  async createChatStream(message: string, sessionId?: string) {
    return this.legacy.createChatStream(message, sessionId);
  }

  /**
   * ヘルスチェック（既存実装継続）
   * シンプルな機能は既存実装で十分
   */
  async healthCheck() {
    return this.legacy.healthCheck();
  }

  // =============================================================================
  // 型統合ユーティリティ
  // =============================================================================

  /**
   * 既存型とOrval型の統合使用例
   */
  async updateUserPreferencesWithMapping(preferences: LegacyUserPreferences) {
    // const orvalPrefs = mapLegacyToOrvalUserPreferences(preferences); // 未使用のためコメントアウト
    console.warn('⚠️  Consider using useKidsUserSettings hook for direct Orval integration');
    
    // 既存APIを使用（フォールバック）
    const legacyUpdate = await this.legacy.updateUserPreferences(preferences);
    return legacyUpdate;
  }
}

// =============================================================================
// 使用ガイド
// =============================================================================

/**
 * API使用ガイド
 * 
 * 【新規実装】
 * - Orvalフック使用を強く推奨
 * - 型安全性、React Query統合、自動キャッシュの恩恵
 * 
 * 【既存機能】
 * - 複雑な機能（画像解析プログレス、SSE）は既存実装継続
 * - シンプルな機能は段階的にOrval移行
 * 
 * 【移行戦略】
 * 1. 新機能開発時はOrvalフック使用
 * 2. 既存機能は動作確認後にOrval移行検討
 * 3. 型マッピング関数で互換性確保
 */

// シングルトンエクスポート
export const hybridApiClient = new HybridApiClient();

// 推奨使用パターンのエクスポート
export const recommendedApiUsage = {
  // React Component内での推奨使用法
  hooks: {
    chat: useKidsFoodChat,
    imageAnalysis: useKidsFoodImageAnalysis,
    userSettings: useKidsUserSettings,
    healthCheck: useHealthCheck,
  },
  
  // 非React環境での使用法
  client: hybridApiClient,
  
  // 型変換
  mappers: {
    legacyToOrval: mapLegacyToOrvalUserPreferences,
    orvalToLegacy: mapOrvalToLegacyUserPreferences,
  },
};