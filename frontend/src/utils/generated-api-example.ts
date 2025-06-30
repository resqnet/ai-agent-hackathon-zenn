// Generated APIは現在ビルド時に利用できないため、一時的にコメントアウト
// import { 
//   ChatApi, 
//   UserApi, 
//   type ApiResponse, 
//   type ChatRequest, 
//   type UserPreferences 
// } from '@/generated';

// 型定義のフォールバック
type ApiResponse = { success: boolean; data?: unknown; };
type UserPreferences = { child_age_months: number; allergies: string[]; dietary_restrictions: string[]; };
type ChatApi = unknown;
type UserApi = unknown;

// 生成されたAPIクライアントの使用例
export class GeneratedApiClient {
  private chatApi: ChatApi;
  private userApi: UserApi;

  constructor() {
    // 一時的に無効化
    // const config = { basePath: baseUrl };
    // this.chatApi = new ChatApi(config);
    // this.userApi = new UserApi(config);
  }

  // 生成された型を使用したチャットメッセージ送信
  async sendChatMessage(): Promise<ApiResponse> {
    // 一時的にダミー実装
    return { success: false, data: null };
  }

  // 生成された型を使用したユーザー設定取得
  async getUserPreferences(): Promise<ApiResponse> {
    return { success: false, data: null };
  }

  // 生成された型を使用したユーザー設定更新
  async updateUserPreferences(): Promise<ApiResponse> {
    return { success: false, data: null };
  }

  // ストリーミングチャット（Server-Sent Events）
  async createChatStream(): Promise<Response> {
    return new Response('{}', { status: 200 });
  }
}

// 既存APIクライアントとの統合例
import { apiClient } from './api-client';

export class HybridApiClient {
  private generated: GeneratedApiClient;

  constructor() {
    this.generated = new GeneratedApiClient();
  }

  // 段階的移行: 新機能は生成された型を使用
  async sendChatWithGeneratedTypes() {
    return this.generated.sendChatMessage();
  }

  // 既存機能: 従来のAPIクライアントを継続使用
  async analyzeFood(image: File) {
    return apiClient.analyzeFood(image);
  }

  // 型の一貫性確保: 生成された型と手動型の統一
  async getUserPreferencesTypeSafe(): Promise<UserPreferences | null> {
    const response = await this.generated.getUserPreferences();
    
    if (response.success && response.data) {
      // 生成された型にキャストして型安全性を確保
      return response.data as UserPreferences;
    }
    
    return null;
  }
}

// シングルトンエクスポート（既存パターンとの一貫性）
export const generatedApiClient = new GeneratedApiClient();
export const hybridApiClient = new HybridApiClient();