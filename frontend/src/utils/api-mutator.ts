import type { AxiosRequestConfig } from 'axios';
import { auth } from '@/config/firebase';

// Firebase認証Token取得関数
const getFirebaseIdToken = async (): Promise<string | null> => {
  try {
    if (!auth.currentUser) {
      return null;
    }
    const token = await auth.currentUser.getIdToken();
    return token;
  } catch (error) {
    console.error('Firebase IDトークン取得エラー:', error);
    return null;
  }
};

// Orval用のカスタムインスタンス（Firebase認証統合）
export const customInstance = async <T>(config: AxiosRequestConfig): Promise<T> => {
  const { 
    url = '', 
    method = 'GET', 
    params, 
    data, 
    headers = {},
    signal 
  } = config;

  // ベースURL設定
  const baseUrl = process.env.NEXT_PUBLIC_AGENT_ENGINE_URL || 'http://localhost:8082';
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;

  // Firebase認証Token取得
  const idToken = await getFirebaseIdToken();
  
  // リクエスト設定
  const requestInit: RequestInit = {
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/json',
      ...(idToken && { 'Authorization': `Bearer ${idToken}` }),
      ...headers,
    } as HeadersInit,
    signal: signal as AbortSignal | undefined,
  };

  // FormDataの場合はContent-Typeを削除（ブラウザが自動設定）
  if (data instanceof FormData) {
    delete (requestInit.headers as Record<string, string>)['Content-Type'];
    requestInit.body = data;
  } else if (data) {
    requestInit.body = JSON.stringify(data);
  }

  // クエリパラメータの処理
  let requestUrl = fullUrl;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    if (searchParams.toString()) {
      requestUrl += `?${searchParams.toString()}`;
    }
  }

  try {
    const response = await fetch(requestUrl, requestInit);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // 401 Unauthorized の場合の詳細なエラーハンドリング
      if (response.status === 401) {
        const errorMessage = errorData.detail || errorData.message || 'Firebase認証が必要です';
        console.error('認証エラー:', errorMessage);
        
        // Firebase認証状態をチェック
        if (!auth.currentUser) {
          throw new Error('ログインが必要です。Googleアカウントでサインインしてください。');
        } else {
          // トークンの再取得を試行
          try {
            await auth.currentUser.getIdToken(true); // forceRefresh = true
            throw new Error('認証トークンを更新しました。再度お試しください。');
          } catch (tokenError) {
            console.error('トークン更新エラー:', tokenError);
            throw new Error('認証トークンの更新に失敗しました。再度ログインしてください。');
          }
        }
      }
      
      throw new Error(
        errorData.message || errorData.error || `HTTP Error: ${response.status}`
      );
    }

    // レスポンスの型に応じて処理
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    } else if (contentType?.includes('text/')) {
      return await response.text() as unknown as T;
    } else {
      // その他（バイナリデータ等）
      return await response.blob() as unknown as T;
    }
  } catch (error) {
    // エラーハンドリング
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Unknown error occurred');
  }
};

// リトライ機能付きのインスタンス（オプション）
export const customInstanceWithRetry = async <T>(
  config: AxiosRequestConfig,
  retryCount = 3
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i <= retryCount; i++) {
    try {
      return await customInstance<T>(config);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // 最後の試行でない場合、指数バックオフでリトライ
      if (i < retryCount) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s...
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
};