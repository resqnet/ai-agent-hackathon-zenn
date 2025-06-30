import { NextRequest, NextResponse } from 'next/server';

// Cloud Functions画像認識エンドポイント
const IMAGE_RECOGNITION_URL = process.env.IMAGE_RECOGNITION_URL || 
  'https://us-central1-my-staging-project-id.cloudfunctions.net/image-recognition';

export async function POST(request: NextRequest) {
  try {
    // FormDataを取得
    const formData = await request.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { success: false, error: '画像ファイルが提供されていません' },
        { status: 400 }
      );
    }

    // ファイルサイズチェック（10MB制限）
    if (image.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: '画像ファイルのサイズが大きすぎます（10MB制限）' },
        { status: 400 }
      );
    }

    // サポートされているファイル形式チェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json(
        { success: false, error: 'サポートされていないファイル形式です（JPEG、PNG、WebP形式のみ）' },
        { status: 400 }
      );
    }

    // Cloud Functionsに転送するためのFormDataを作成
    const cloudFunctionFormData = new FormData();
    cloudFunctionFormData.append('image', image);

    // Cloud Functionsにリクエスト送信
    const response = await fetch(IMAGE_RECOGNITION_URL, {
      method: 'POST',
      body: cloudFunctionFormData,
      // Cloud FunctionsのTimeout (60s) + Buffer時間
      signal: AbortSignal.timeout(65000),
    });

    if (!response.ok) {
      console.error(`Cloud Functions呼び出しエラー: ${response.status} ${response.statusText}`);
      
      // エラーレスポンスの詳細を取得
      let errorMessage = '画像認識サービスでエラーが発生しました';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // JSON解析失敗時はデフォルトメッセージを使用
      }

      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: response.status }
      );
    }

    // Cloud Functionsからのレスポンスを解析
    const result = await response.json();

    // Cloud Functionsのレスポンス形式に応じて適切にフォーマット
    if (result.success === false) {
      return NextResponse.json(
        { success: false, error: result.error || '画像認識処理でエラーが発生しました' },
        { status: 500 }
      );
    }

    // 成功レスポンスを返す
    return NextResponse.json({
      success: true,
      data: result.data || result, // Cloud Functionsのレスポンス形式に対応
    });

  } catch (error) {
    console.error('画像認識プロキシエラー:', error);

    // エラーの種類に応じたメッセージ
    let errorMessage = '画像認識サービスとの通信でエラーが発生しました';
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'ネットワーク接続エラーが発生しました。インターネット接続を確認してください。';
    } else if (error instanceof Error && error.name === 'TimeoutError') {
      errorMessage = '画像認識処理がタイムアウトしました。しばらく待ってから再度お試しください。';
    } else if (error instanceof Error && error.message.includes('AbortError')) {
      errorMessage = '画像認識処理がタイムアウトしました。しばらく待ってから再度お試しください。';
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// CORS設定（必要に応じて）
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    }
  );
}