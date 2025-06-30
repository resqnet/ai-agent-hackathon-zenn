#!/bin/bash

# Cloud Functions画像認識サービスのデプロイスクリプト

set -e

# 基本設定
PROJECT_ID=${GOOGLE_CLOUD_PROJECT:-$(gcloud config get-value project)}
REGION=${GOOGLE_CLOUD_LOCATION:-us-central1}
FUNCTION_NAME="kids-food-advisor-image-recognition"

echo "🚀 Cloud Functions画像認識サービスをデプロイ中..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Function: $FUNCTION_NAME"

# 現在のディレクトリを確認
if [ ! -f "main.py" ]; then
    echo "エラー: main.pyが見つかりません。cloud_functions/image_recognition/ディレクトリで実行してください。"
    exit 1
fi

# Cloud Functionsにデプロイ
gcloud functions deploy $FUNCTION_NAME \
    --gen2 \
    --runtime=python312 \
    --region=$REGION \
    --source=. \
    --entry-point=analyze_food_image \
    --trigger=http \
    --allow-unauthenticated \
    --memory=512Mi \
    --timeout=60s \
    --max-instances=10 \
    --set-env-vars="GOOGLE_CLOUD_PROJECT=$PROJECT_ID,GOOGLE_CLOUD_LOCATION=$REGION"

# デプロイ完了後、URLを表示
echo ""
echo "✅ デプロイ完了！"
echo ""
echo "Function URL:"
gcloud functions describe $FUNCTION_NAME --region=$REGION --format="value(serviceConfig.uri)"

echo ""
echo "📝 次のステップ:"
echo "1. 上記のURLをIMAGE_RECOGNITION_URL環境変数に設定"
echo "2. backend_server.pyを再起動"
echo "3. フロントエンドから画像解析機能をテスト"