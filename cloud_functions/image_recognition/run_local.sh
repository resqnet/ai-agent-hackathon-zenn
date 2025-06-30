#!/bin/bash

# Cloud Functions画像認識サービスのローカル実行スクリプト
# Functions Frameworkを使用してローカル環境で動作確認

set -e

# 基本設定
PORT=${PORT:-8081}
HOST=${HOST:-0.0.0.0}

echo "🧪 Cloud Functions画像認識サービスをローカル起動中..."
echo "Host: $HOST"
echo "Port: $PORT"
echo "URL: http://localhost:$PORT"

# 現在のディレクトリを確認
if [ ! -f "main.py" ]; then
    echo "エラー: main.pyが見つかりません。cloud_functions/image_recognition/ディレクトリで実行してください。"
    exit 1
fi

# 依存関係がインストールされているか確認
if ! python -c "import functions_framework" 2>/dev/null; then
    echo "📦 Functions Framework をインストール中..."
    pip install functions-framework
fi

# 環境変数設定
export GOOGLE_CLOUD_PROJECT=${GOOGLE_CLOUD_PROJECT:-$(gcloud config get-value project 2>/dev/null || echo "your-project-id")}
export GOOGLE_CLOUD_LOCATION=${GOOGLE_CLOUD_LOCATION:-us-central1}

echo "Environment:"
echo "  GOOGLE_CLOUD_PROJECT=$GOOGLE_CLOUD_PROJECT"
echo "  GOOGLE_CLOUD_LOCATION=$GOOGLE_CLOUD_LOCATION"
echo ""

# Functions Frameworkでローカル実行
echo "🎯 エンドポイント:"
echo "  POST http://localhost:$PORT - 画像解析"
echo "  GET  http://localhost:$PORT/health - ヘルスチェック"
echo ""
echo "Ctrl+C で停止"
echo ""

functions-framework \
    --target=analyze_food_image \
    --host=$HOST \
    --port=$PORT \
    --debug