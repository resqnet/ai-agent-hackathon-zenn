import type { 
  ApiResponse, 
  FoodAnalysis, 
  ChatMessage, 
  UserPreferences,
  ApiClientConfig,
  ChatStreamEvent
} from '@/types';

// 環境判定
const API_MODE = process.env.NEXT_PUBLIC_API_MODE || 'local';
const AGENT_ENGINE_URL = process.env.NEXT_PUBLIC_AGENT_ENGINE_URL || 'http://localhost:8082';
const CLOUD_FUNCTIONS_URL = process.env.NEXT_PUBLIC_CLOUD_FUNCTIONS_URL || 'http://localhost:8081';
const SESSION_MANAGEMENT_URL = process.env.NEXT_PUBLIC_SESSION_MANAGEMENT_URL || 'http://localhost:8083';

// デバッグ情報をコンソールに出力
console.log('API Configuration:', {
  API_MODE,
  AGENT_ENGINE_URL,
  CLOUD_FUNCTIONS_URL,
  SESSION_MANAGEMENT_URL,
  isStaging: API_MODE === 'staging',
  willUseCloudFunctions: API_MODE === 'staging' && AGENT_ENGINE_URL.includes('cloudfunctions'),
  willUseLocalhost: API_MODE === 'local' && AGENT_ENGINE_URL.includes('localhost')
});

// API設定
const defaultConfig: ApiClientConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8082',
  timeout: 30000, // 30秒
  retryCount: 3,
  headers: {
    'Content-Type': 'application/json',
  },
};

// エラーハンドリング用のカスタムエラークラス
class ApiError extends Error {
  public status: number;
  public code: string;
  public details?: unknown;

  constructor(message: string, status: number, code: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// APIクライアントクラス
class ApiClient {
  private config: ApiClientConfig;
  private getIdToken?: () => Promise<string | null>;

  constructor(config: Partial<ApiClientConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // プログレス追跡用のコールバック型
  public onUploadProgress?: (progress: number) => void;
  
  // Firebase認証トークン取得関数を設定
  public setAuthTokenProvider(tokenProvider: () => Promise<string | null>) {
    this.getIdToken = tokenProvider;
  }

  // 基本的なfetchラッパー
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    // 常にbaseUrlを付加（backend_server.pyにアクセスするため）
    const url = `${this.config.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    
    console.log('API Request:', { endpoint, url, baseUrl: this.config.baseUrl });

    try {
      // 認証ヘッダーを取得
      const authHeaders: Record<string, string> = {};
      if (this.getIdToken) {
        try {
          const token = await this.getIdToken();
          if (token) {
            authHeaders.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('Firebase認証トークンの取得に失敗しました:', error);
        }
      }
      
      // FormDataの場合はContent-Typeを設定しない（ブラウザが自動設定）
      const headers = options.body instanceof FormData 
        ? { ...authHeaders, ...options.headers }
        : { ...this.config.headers, ...authHeaders, ...options.headers };

      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `HTTP Error: ${response.status}`,
          response.status,
          errorData.code || 'HTTP_ERROR',
          errorData
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      // リトライロジック
      if (
        retryCount < this.config.retryCount &&
        (error instanceof TypeError || // ネットワークエラー
          (error instanceof ApiError && error.status >= 500)) // サーバーエラー
      ) {
        // 指数バックオフでリトライ
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      throw error;
    }
  }

  // GET request
  private async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
    });
  }

  // POST request
  private async post<T>(
    endpoint: string,
    data?: unknown,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
  }

  // PUT request
  private async put<T>(
    endpoint: string,
    data?: unknown
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  private async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }


  // 画像解析API（プログレス追跡機能付き）
  async analyzeFood(image: File, progressCallback?: (progress: number) => void): Promise<FoodAnalysis> {
    // 統一されたFormData形式を使用（すべての環境で対応済み）
    return this.analyzeFoodWithFormData(image, progressCallback);
  }


  // 画像解析（FormData形式 - 全環境対応）
  private async analyzeFoodWithFormData(image: File, progressCallback?: (progress: number) => void): Promise<FoodAnalysis> {
    const formData = new FormData();
    formData.append('image', image);

    // staging環境でCloud Functions URLが設定されている場合は直接使用
    const isCloudFunctions = API_MODE === 'staging' && CLOUD_FUNCTIONS_URL;
    const baseUrl = isCloudFunctions ? CLOUD_FUNCTIONS_URL : this.config.baseUrl;
    const endpoint = isCloudFunctions ? '' : '/api/image/analyze';

    // XMLHttpRequestを使用してプログレス追跡
    return new Promise(async (resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      // 認証ヘッダーを取得
      const authHeaders: Record<string, string> = {};
      if (this.getIdToken) {
        try {
          const token = await this.getIdToken();
          if (token) {
            authHeaders.Authorization = `Bearer ${token}`;
          }
        } catch (error) {
          console.warn('Firebase認証トークンの取得に失敗しました:', error);
        }
      }
      
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && progressCallback) {
          const uploadProgress = Math.round((event.loaded / event.total) * 50); // アップロードは50%まで
          progressCallback(uploadProgress);
        }
      });

      xhr.addEventListener('load', async () => {
        if (progressCallback) {
          progressCallback(75); // 処理開始
        }

        try {
          if (xhr.status === 200) {
            const responseText = xhr.responseText.trim();
            if (!responseText) {
              throw new Error('Empty response from server');
            }
            
            // Content-Typeの確認
            const contentType = xhr.getResponseHeader('Content-Type');
            if (!contentType?.includes('application/json')) {
              console.warn(`期待されるJSON形式ではありません。Content-Type: ${contentType}`);
              console.warn('Response text:', responseText);
            }
            
            // BOMの除去とJSON解析
            const cleanText = responseText.replace(/^\uFEFF/, '');
            const response = JSON.parse(cleanText);
            
            if (progressCallback) {
              progressCallback(100); // 完了
            }

            if (!response.success || !response.data) {
              throw new ApiError(
                response.error || '画像解析に失敗しました',
                xhr.status,
                'ANALYSIS_FAILED'
              );
            }

            resolve(response.data);
          } else {
            let errorData: any = {};
            try {
              const responseText = (xhr.responseText || '{}').trim();
              const cleanText = responseText.replace(/^\uFEFF/, '');
              errorData = JSON.parse(cleanText);
            } catch (parseError) {
              console.error('Error response JSON parse failed:', parseError);
              console.error('Raw response:', xhr.responseText);
              errorData = {
                message: `JSON解析エラー: ${xhr.status} ${xhr.statusText}`,
                code: 'JSON_PARSE_ERROR',
                originalResponse: xhr.responseText
              };
            }
            reject(new ApiError(
              errorData.message || `HTTP Error: ${xhr.status}`,
              xhr.status,
              errorData.code || 'HTTP_ERROR',
              errorData
            ));
          }
        } catch (error) {
          console.error('画像解析レスポンスの解析エラー:', error);
          console.error('Response status:', xhr.status);
          console.error('Response text:', xhr.responseText);
          reject(new ApiError(
            `画像解析レスポンスの解析に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
            xhr.status,
            'RESPONSE_PARSE_FAILED',
            { originalError: error, responseText: xhr.responseText }
          ));
        }
      });

      xhr.addEventListener('error', () => {
        console.error('XHR Network Error');
        reject(new ApiError(
          'ネットワークエラーが発生しました',
          0,
          'NETWORK_ERROR'
        ));
      });

      xhr.addEventListener('timeout', () => {
        reject(new ApiError(
          'リクエストがタイムアウトしました',
          0,
          'TIMEOUT_ERROR'
        ));
      });

      const fullUrl = `${baseUrl}${endpoint}`;
      
      xhr.open('POST', fullUrl);
      xhr.timeout = this.config.timeout;
      
      // 認証ヘッダーを設定
      Object.entries(authHeaders).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      
      xhr.send(formData);
    });
  }

  // ストリーミングチャット（トークンストリーミング対応）
  async createChatStream(message: string, sessionId: string): Promise<ReadableStream<ChatStreamEvent>> {
    return this.createAgentEngineStream(message, sessionId);
  }

  // トークンストリーミングチャット
  async createTokenChatStream(message: string, sessionId: string): Promise<ReadableStream<ChatStreamEvent>> {
    const url = `${this.config.baseUrl}/api/chat/stream/token`;
    console.log('トークンストリーミングリクエスト開始:', url);
    console.log('リクエストボディ:', { message, sessionId });
    
    // 認証ヘッダーを取得
    const authHeaders: Record<string, string> = {};
    if (this.getIdToken) {
      try {
        const token = await this.getIdToken();
        if (token) {
          authHeaders.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn('Firebase認証トークンの取得に失敗しました:', error);
      }
    }
    
    const headers = { ...this.config.headers, ...authHeaders };
    console.log('リクエストヘッダー:', headers);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ message, sessionId }),
    });

    console.log('トークンストリーミングレスポンス:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('トークンストリーミングエラー応答:', errorText);
      throw new ApiError(
        `トークンストリーミングチャットの開始に失敗しました: ${response.status} ${response.statusText}`,
        response.status,
        'TOKEN_STREAM_FAILED'
      );
    }

    if (!response.body) {
      throw new ApiError(
        'レスポンスボディが存在しません',
        500,
        'NO_RESPONSE_BODY'
      );
    }

    return response.body
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TransformStream({
        start() {
          this.buffer = '';
        },
        transform(chunk, controller) {
          // バッファに蓄積してから処理
          this.buffer += chunk;
          const lines = this.buffer.split('\n');
          
          // 最後の行は不完全な可能性があるので残す
          this.buffer = lines.pop() || '';
          
          for (const line of lines) {
            console.log('トークン処理対象行:', line);
            if (line.startsWith('data: ')) {
              try {
                const data = line.slice(6); // "data: "を除去
                console.log('トークンパース対象データ:', data);
                if (data.trim()) {
                  const event = JSON.parse(data) as ChatStreamEvent;
                  console.log('トークンパース結果イベント:', event);
                  controller.enqueue(event);
                }
              } catch (error) {
                console.error('トークンSSEパースエラー:', error, 'Line:', line);
              }
            }
          }
        },
        flush(controller) {
          // 最後に残ったバッファを処理
          if (this.buffer.startsWith('data: ')) {
            try {
              const data = this.buffer.slice(6);
              if (data.trim()) {
                const event = JSON.parse(data) as ChatStreamEvent;
                controller.enqueue(event);
              }
            } catch (error) {
              console.error('トークンSSEフラッシュエラー:', error, 'Buffer:', this.buffer);
            }
          }
        }
      }));
  }

  // ユーザー設定の取得（agent_engine_streamでは未実装のため、デフォルト設定を返す）
  async getUserPreferences(): Promise<UserPreferences> {
    // TODO: agent_engine_streamでユーザー設定機能を実装後に有効化
    const defaultPreferences: UserPreferences = {
      children: [],
      activeChildId: null,
      allergies: [],
      dietaryRestrictions: {},
      notificationSettings: {
        mealReminders: false,
        nutritionTips: false,
        weeklyReports: false,
      },
      theme: 'light',
    };
    
    return defaultPreferences;
  }

  // ユーザー設定の更新（agent_engine_streamでは未実装のため、入力値をそのまま返す）
  async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    // TODO: agent_engine_streamでユーザー設定機能を実装後に有効化
    const defaultPreferences: UserPreferences = {
      children: [],
      activeChildId: null,
      allergies: [],
      dietaryRestrictions: {},
      notificationSettings: {
        mealReminders: false,
        nutritionTips: false,
        weeklyReports: false,
      },
      theme: 'light',
    };
    
    return { ...defaultPreferences, ...preferences };
  }

  // ヘルスチェック（agent_engine_streamでは未実装のため、デフォルト応答を返す）
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    // TODO: agent_engine_streamでヘルスチェック機能を実装後に有効化
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  }

  // Agent Engine ストリーミングチャット
  private async createAgentEngineStream(message: string, sessionId: string): Promise<ReadableStream<ChatStreamEvent>> {
    // ローカル環境ではbaseUrlを使用、staging環境ではAGENT_ENGINE_URLを使用
    const baseUrl = (API_MODE === 'staging' && AGENT_ENGINE_URL) ? AGENT_ENGINE_URL : this.config.baseUrl;

    // 認証ヘッダーを取得
    const authHeaders: Record<string, string> = {};
    if (this.getIdToken) {
      try {
        const token = await this.getIdToken();
        if (token) {
          authHeaders.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn('Firebase認証トークンの取得に失敗しました:', error);
      }
    }

    const headers = {
      'Content-Type': 'application/json',
      ...authHeaders,
    };

    const response = await fetch(baseUrl + '/api/chat/stream', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: message,
        sessionId: sessionId
      }),
    });

    if (!response.ok) {
      throw new ApiError(
        'Agent Engine ストリーミング接続に失敗しました',
        response.status,
        'AGENT_ENGINE_STREAM_FAILED'
      );
    }

    if (!response.body) {
      throw new ApiError(
        'Agent Engine レスポンスボディが存在しません',
        500,
        'NO_AGENT_ENGINE_RESPONSE_BODY'
      );
    }

    return response.body
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TransformStream({
        start() {
          this.buffer = '';
        },
        transform(chunk, controller) {
          // バッファに蓄積してから処理
          this.buffer += chunk;
          const lines = this.buffer.split('\n');
          
          // 最後の行は不完全な可能性があるので残す
          this.buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = line.slice(6); // "data: "を除去
                if (data.trim()) {
                  const parsed = JSON.parse(data);
                  // Vertex AI Agent Engine形式を内部形式に変換
                  const event: ChatStreamEvent = {
                    type: parsed.type || 'chunk',
                    agent_name: parsed.agent_name || 'Kids Food Advisor',
                    content: parsed.content || parsed.message || parsed.response || '',
                  };
                  controller.enqueue(event);
                }
              } catch (error) {
                console.error('Agent Engine SSEパースエラー:', error, 'Line:', line);
              }
            }
          }
        },
        flush(controller) {
          // 最後に残ったバッファを処理
          if (this.buffer.trim()) {
            let remaining = this.buffer;
            while (remaining.includes('data: {')) {
              const dataIndex = remaining.indexOf('data: {');
              if (dataIndex === -1) break;
              
              const jsonStart = dataIndex + 6; // "data: " の長さ
              let braceCount = 0;
              let jsonEnd = jsonStart;
              
              // ブレースの対応を確認してJSONの終端を見つける
              for (let i = jsonStart; i < remaining.length; i++) {
                if (remaining[i] === '{') braceCount++;
                else if (remaining[i] === '}') braceCount--;
                
                if (braceCount === 0) {
                  jsonEnd = i + 1;
                  break;
                }
              }
              
              if (braceCount === 0) {
                const jsonString = remaining.substring(jsonStart, jsonEnd);
                try {
                  const parsed = JSON.parse(jsonString);
                  const event: ChatStreamEvent = {
                    type: parsed.type || 'chunk',
                    agent_name: parsed.agent_name || 'Kids Food Advisor',
                    content: parsed.content || parsed.message || parsed.response || '',
                  };
                  controller.enqueue(event);
                } catch (error) {
                  console.error('Agent Engine SSEフラッシュエラー:', error, 'JSON:', jsonString);
                }
              }
              
              remaining = remaining.substring(jsonEnd);
            }
          }
        }
      }));
  }

  // 認証トークン取得
  private async getAuthToken(): Promise<string> {
    // ブラウザ環境でFirebase認証を使用
    if (typeof window !== 'undefined') {
      try {
        const { auth } = await import('@/config/firebase');
        const { getAuth } = await import('firebase/auth');
        const currentUser = getAuth().currentUser || auth.currentUser;
        
        if (currentUser) {
          const idToken = await currentUser.getIdToken();
          return `Bearer ${idToken}`;
        }
      } catch (error) {
        console.error('Firebase IDトークン取得エラー:', error);
      }
    }
    
    // Cloud Run環境では Identity Token を使用
    if (typeof window !== 'undefined' && window.location.hostname.includes('run.app')) {
      try {
        const response = await fetch('/metadata/computeMetadata/v1/instance/service-accounts/default/identity?audience=' + AGENT_ENGINE_URL, {
          headers: {
            'Metadata-Flavor': 'Google'
          }
        });
        if (response.ok) {
          const token = await response.text();
          return `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Identity Token取得エラー:', error);
      }
    }
    
    // フォールバック: 空の認証ヘッダー（開発用）
    console.warn('認証トークンを取得できませんでした。開発環境では認証をスキップします。');
    return '';
  }

  // セッション作成
  async createSession(): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    try {
      const authToken = await this.getAuthToken();
      
      const baseUrl = (API_MODE === 'staging' && AGENT_ENGINE_URL) ? AGENT_ENGINE_URL : this.config.baseUrl;
      const response = await fetch(`${baseUrl}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authToken,
        },
      });

      if (!response.ok) {
        throw new ApiError(
          `セッション作成に失敗しました (${response.status})`,
          response.status,
          'SESSION_CREATE_FAILED'
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        return { success: false, error: error.message };
      }
      return { success: false, error: '予期しないエラーが発生しました' };
    }
  }
}

// シングルトンインスタンス
export const apiClient = new ApiClient();

// カスタムフック用のReact Query キー
export const queryKeys = {
  health: ['health'] as const,
  userPreferences: ['user', 'preferences'] as const,
  mealHistory: ['meals', 'history'] as const,
  chatSessions: ['chat', 'sessions'] as const,
  foodAnalysis: (imageId: string) => ['food', 'analysis', imageId] as const,
  sessionDetail: (sessionId: string) => ['session', 'detail', sessionId] as const,
  sessionEvents: (sessionId: string) => ['session', 'events', sessionId] as const,
  sessionCreate: ['session', 'create'] as const,
} as const;

// React Query用のカスタムフック
export class QueryError extends Error {
  public originalError: unknown;

  constructor(message: string, originalError: unknown) {
    super(message);
    this.name = 'QueryError';
    this.originalError = originalError;
  }
}

// エラーハンドリングヘルパー
export function handleApiError(error: unknown): never {
  if (error instanceof ApiError) {
    throw error;
  }
  
  if (error instanceof Error) {
    throw new QueryError(error.message, error);
  }
  
  throw new QueryError('未知のエラーが発生しました', error);
}