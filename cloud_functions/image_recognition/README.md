# 画像認識Cloud Function

Kids Food Advisor用の画像認識専用Cloud Function（第2世代）

## 概要

- **目的**: 幼児向け食事画像の高速解析
- **技術**: Vertex AI Gemini 2.0 Flash Vision
- **デプロイ**: Google Cloud Functions（第2世代）
- **実装方針**: 設計プランに基づくコスト最適化・高速化

## アーキテクチャ

```
フロントエンド → Cloud Functions → Vertex AI Gemini 2.0 Flash → JSON応答
```

## ファイル構成

```
cloud_functions/image_recognition/
├── main.py              # メインFunction（analyze_food_image）
├── requirements.txt     # 依存関係（Vertex AI SDK等）
├── .gcloudignore       # デプロイ除外設定
└── README.md           # このファイル
```

## デプロイ

### 前提条件
- Google Cloud SDKがインストール済み
- プロジェクトでVertex AI APIが有効化済み
- 認証設定が完了済み

### デプロイコマンド
```bash
# プロジェクトルートから実行
make deploy-image-function
```

### 手動デプロイ
```bash
cd cloud_functions/image_recognition

# Cloud Functions（第2世代）へデプロイ
gcloud functions deploy image-recognition \
  --gen2 \
  --runtime=python312 \
  --region=us-central1 \
  --source=. \
  --entry-point=analyze_food_image \
  --trigger=http \
  --allow-unauthenticated \
  --memory=512MB \
  --timeout=60s \
  --max-instances=10 \
  --min-instances=0 \
  --concurrency=20 \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=[YOUR_PROJECT_ID],GOOGLE_CLOUD_LOCATION=us-central1"
```

## API仕様

### エンドポイント
```
POST https://us-central1-[PROJECT_ID].cloudfunctions.net/image-recognition
```

### リクエスト形式

#### 1. multipart/form-data（推奨）
```bash
curl -X POST \
  -F "image=@/path/to/image.jpg" \
  https://us-central1-[PROJECT_ID].cloudfunctions.net/image-recognition
```

#### 2. application/json（Base64エンコード）
```json
{
  "image": "base64_encoded_image_data_here"
}
```

### レスポンス形式
```json
{
  "success": true,
  "data": {
    "dish_name": "野菜カレー",
    "ingredients": ["ニンジン", "ジャガイモ", "玉ねぎ", "カレールー"],
    "confidence": 0.85,
    "potential_allergens": ["小麦"],
    "age_appropriateness": {
      "suitable": true,
      "concerns": [],
      "recommendations": ["野菜を小さく切って食べやすくしましょう"]
    }
  }
}
```

## 制限事項

- **画像形式**: JPEG, PNG, WebP
- **ファイルサイズ**: 最大10MB
- **タイムアウト**: 60秒
- **並行処理**: 最大20リクエスト/instance

## 監視・ログ

### Cloud Logging
```bash
# ログの確認
gcloud functions logs read image-recognition --region=us-central1
```

### Cloud Monitoring
- レスポンス時間
- エラー率
- 実行回数
- メモリ使用量

## 開発・テスト

### ローカルテスト
```bash
# Functions Frameworkを使用
cd cloud_functions/image_recognition
pip install functions-framework
functions-framework --target=analyze_food_image --port=8080
```

### 統合テスト
既存のテストスイートを使用:
```bash
# プロジェクトルートから
make test
```

## コスト最適化

- **最小インスタンス**: 0（コールドスタート許容）
- **最大インスタンス**: 10（スケール制限）
- **メモリ**: 512MB（画像処理に最適）
- **従量課金**: 使用時のみ課金

## セキュリティ

- **認証**: 現在は無認証（`--allow-unauthenticated`）
- **CORS**: 全オリジン許可（開発用）
- **画像検証**: ファイル形式・サイズ制限実装済み

## トラブルシューティング

### よくある問題

1. **デプロイエラー**: 
   - Vertex AI APIの有効化確認
   - 権限設定の確認

2. **タイムアウト**:
   - 画像サイズの確認（10MB以下）
   - ネットワーク接続の確認

3. **JSON解析エラー**:
   - Geminiモデルの応答確認
   - プロンプトの最適化検討

### ログ確認
```bash
gcloud functions logs read image-recognition \
  --region=us-central1 \
  --limit=50
```