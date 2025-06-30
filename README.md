# kids-food-advisor

**1歳半〜3歳の幼児向けAI栄養相談システム**

## 🍱 概要

きっずフードアドバイザーは、1歳半〜3歳の幼児を持つ保護者のための栄養相談AIアシスタントです。Google Agent Development Kit (ADK) とVertex AI を活用し、幼児の食事写真から栄養バランスを分析し、年齢に応じた栄養アドバイスと実践的なレシピを提供します。

## ✨ 主な機能

- **📸 画像認識による食事分析** - スマートフォンで撮影した食事写真から料理名と栄養成分を自動推定
- **🔢 年齢別栄養バランス評価** - 厚生労働省の「日本人の食事摂取基準」に基づいた幼児期の栄養目標値との比較
- **👨‍🍳 実践的なレシピ提案** - 不足栄養素を補う幼児向けレシピを具体的に提案
- **💬 対話型相談** - 保護者の質問に優しく丁寧に回答する継続的な栄養相談
- **🔒 安全なプライベート環境** - Firebase認証によるユーザーごとの安全なデータ管理

## 🛠️ 技術スタック

### バックエンド
- **Google Agent Development Kit (ADK)** - マルチエージェントオーケストレーション
- **Vertex AI Agent Engine** - 本番環境でのスケーラブルなAIエージェント実行
- **Gemini 2.0 Flash** - 高速な対話生成と画像認識
- **Cloud Functions** - サーバーレスAPIエンドポイント
- **Firebase Authentication** - セキュアなユーザー認証

### フロントエンド  
- **Next.js 15** - React ベースのモダンなWebフレームワーク
- **TypeScript** - 型安全な開発環境
- **TailwindCSS** - レスポンシブデザイン
- **Zustand** - 状態管理
- **React Query** - データフェッチングと同期

### インフラストラクチャ
- **Google Cloud Platform** - クラウドインフラ基盤
- **Terraform** - Infrastructure as Code
- **GitHub Actions** - CI/CDパイプライン
- **OpenTelemetry** - 観測可能性とトレーシング

## プロジェクト構造

```text
kids-food-advisor/
├── app/                       # コアアプリケーションコード
│   ├── agent_engine_app.py    # Agent Engineデプロイメントアプリ
│   ├── vertex_ai_agent.py     # Vertex AI統合エージェント
│   ├── multi_turn_agent.py    # マルチターン対話エージェント
│   ├── agents/                # 専門エージェント
│   │   ├── nutritionist_agent.py       # 栄養分析エージェント
│   │   └── recipe_advisor.py           # レシピアドバイザーエージェント
│   ├── auth/                  # 認証システム
│   │   └── firebase_auth.py   # Firebase認証統合
│   ├── data/                  # データレイヤー
│   │   ├── foods.py           # 幼児向け食品データベース
│   │   └── nutrition.py       # 栄養計算エンジン
│   ├── tools/                 # エージェントツール
│   │   ├── nutrition_analyzer.py       # 栄養分析ツール
│   │   ├── recipe_suggester.py         # レシピ提案ツール
│   │   ├── vertex_nutrition_analyzer.py # Vertex AI栄養分析ツール
│   │   ├── pdf_processor.py            # PDF処理ツール
│   │   └── rag_search.py               # RAG検索ツール
│   └── utils/                 # ユーティリティ
│       ├── gcs.py             # GCSユーティリティ
│       ├── tracing.py         # トレーシング機能
│       ├── input_validation.py # 入力バリデーション
│       └── typing.py          # 型定義
├── frontend/                  # React Next.jsベースのモダンフロントエンド
│   ├── src/app/               # Next.js App Router
│   ├── src/components/        # Reactコンポーネント
│   │   ├── auth/              # 認証関連コンポーネント
│   │   ├── chat/              # チャットインターフェース
│   │   ├── forms/             # 食事入力・設定フォーム
│   │   ├── layout/            # レイアウトコンポーネント
│   │   └── ui/                # 基本UIコンポーネント（shadcn/ui）
│   ├── src/hooks/             # カスタムフック（API使用）
│   ├── src/providers/         # React Query等のプロバイダー
│   ├── src/stores/            # Zustand状態管理
│   ├── src/types/             # TypeScript型定義
│   └── src/utils/             # APIクライアント、バリデーション、セキュリティ
├── cloud_functions/           # Cloud Functions
│   ├── agent_engine_stream/   # エージェントストリーミング・セッション管理API
│   └── image_recognition/     # 画像認識API
├── deployment/                # インフラストラクチャとデプロイメント
│   ├── terraform/             # Terraformインフラ定義
│   ├── ci/                    # CI設定（GitHub Actions）
│   └── cd/                    # CD設定（デプロイメント）
├── tests/                     # テストスイート
│   ├── unit/                  # ユニットテスト
│   ├── integration/           # 統合テスト
│   └── load_test/             # ロードテスト
├── Makefile                   # 開発コマンド
└── pyproject.toml             # プロジェクト設定・依存関係
```

## 必要要件

開始前に以下をインストールしてください：

- **uv**: Pythonパッケージマネージャー - [インストール](https://docs.astral.sh/uv/getting-started/installation/)
- **Google Cloud SDK**: GCPサービス用 - [インストール](https://cloud.google.com/sdk/docs/install)
- **Terraform**: インフラストラクチャデプロイメント用 - [インストール](https://developer.hashicorp.com/terraform/downloads)
- **make**: ビルド自動化ツール - [インストール](https://www.gnu.org/software/make/) (Unix系システムには通常プリインストール)
- **Node.js & npm**: フロントエンド開発用 - [インストール](https://nodejs.org/)

## セットアップ手順

### 🚀 ローカル開発環境セットアップ

リポジトリをクローンした直後から動作させるまでの完全手順：

#### 1. 基本セットアップ

```bash
# 1. リポジトリクローン
git clone https://github.com/resqnet/kids_food_advisor.git
cd kids_food_advisor

# 2. Python依存関係インストール
uv venv
source .venv/bin/activate
make install

# 3. フロントエンド依存関係インストール
cd frontend && npm install && cd ..
```

#### 2. Google Cloud設定

```bash
# Google Cloudにログイン
gcloud auth login
gcloud auth application-default login
gcloud config set project your-dev-project-id

# Firebase Admin用サービスアカウントキー取得
gcloud iam service-accounts keys create service-account-key.json \
  --iam-account=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

#### 3. 環境変数設定

```bash
# 4. バックエンド環境変数設定
cp .env.example .env
# .envファイルを編集（以下の必須項目を設定）

# 5. フロントエンド環境変数設定
cp frontend/.env.example frontend/.env
# frontend/.envファイルを編集（Firebase設定が必須）
```

#### 4. Firebase設定取得

Firebase設定は Firebase Console > プロジェクト設定 > 全般タブ > アプリ設定 から取得できます。

#### 5. 開発サーバー起動

```bash
# バックエンドサーバー起動（複数のサービスを起動）
make dev-backend-adk
# 起動されるサービス:
# - Image Recognition API (port 8081) 
# - Chat Agent Engine API (port 8082)

# フロントエンドサーバー起動
make dev-frontend
# - Next.js Frontend (port 3002)
```

### 🌐 ステージング環境デプロイ

ステージング環境にデプロイする手順：

#### 1. Google Cloud認証

```bash
# Google Cloudにログイン
gcloud auth login
gcloud config set project your-staging-project-id
```

#### 2. インフラストラクチャのセットアップ

Terraformを使用したインフラストラクチャデプロイ

```bash
# dev環境
make deploy

# 本番環境
make deploy prod=true
```

#### 3. バックエンドデプロイ

```bash
# Agent Engineデプロイ
make backend

# Cloud Functionsデプロイ
make deploy-image-function
make deploy-chat-function
```

#### 4. フロントエンドデプロイ

```bash
# フロントエンド環境変数を本番用に更新
# frontend/.envでステージング用URLを設定:
# NEXT_PUBLIC_AGENT_ENGINE_URL=https://your-region-your-project.cloudfunctions.net/agent-engine-stream

# フロントエンドデプロイ
make deploy-frontend-staging
```

### 🔐 認証について

このプロジェクトでは Firebase Authentication による Google認証を使用しています。

**重要な変更点:**
- 全APIエンドポイントで認証が必須
- セッション管理がユーザーごとに分離
- フロントエンドでGoogle認証ログイン・ログアウト機能
- API型生成（Orval）で認証が自動適用

## 開発コマンド

### 開発コマンド

| コマンド | 説明 | ポート |
| -------------------- | ------------------------------------------------------------------------------------------- | ------ |
| `make install` | uvを使用してすべての依存関係をインストール（jupyter、frontend extra含む） | - |
| `make dev-backend` | バックエンドサービスを起動（画像認識API、チャットエージェント） | 8081, 8082 |
| `make dev-backend-adk` | ADKモードでバックエンドサービスを起動（ローカルADK実行） | 8081, 8082 |
| `make dev-backend-vertex` | Vertex AIモードでバックエンドサービスを起動（Agent Engine接続） | 8081, 8082 |
| `make dev-frontend` | React Next.jsフロントエンドを起動（API型自動生成含む） | 3002 |
| `make dev-stage-frontend` | ステージングモードでフロントエンドを起動（Vertex AI接続用） | 3003 |
| `make test` | ユニットテストと統合テストを実行（pytest） | - |
| `make lint` | コード品質チェック（codespell、ruff、mypy） | - |
| `make kill-all-servers` | 全ての開発サーバーを停止（ポート衝突解決用） | - |

### デプロイメントコマンド

| コマンド | 説明 |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `make backend` | エージェントをVertex AI Agent Engineにデプロイ |
| `make deploy` | Terraformを使用してdev環境にデプロイ |
| `make deploy prod=true` | Terraformを使用して本番環境にデプロイ |
| `make deploy-image-function` | 画像認識Cloud Functionをデプロイ |
| `make deploy-chat-function` | チャットエージェントCloud Functionをデプロイ |
| `make deploy-frontend-staging` | フロントエンドをステージング環境にデプロイ |
| `make deploy-frontend-prod` | フロントエンドを本番環境にデプロイ（要確認） |

### インフラ・設定コマンド

| コマンド | 説明 |
| -------------------- | ------------------------------------------------------------------------------------------- |
| `make setup-dev-env` | Terraformを使用して開発環境リソースをセットアップ |
| `make update-terraform-config` | 新しいAgent Engine IDでTerraform設定を更新 |
| `make pdf-upload` | PDFをVertex AI Searchにアップロード |
完全なコマンドオプションと使用方法については、[Makefile](Makefile)を参照してください。

## Vertex AI統合機能

Vertex AI Search機能により、RAG（Retrieval-Augmented Generation）による高度な栄養相談が可能です：

### Vertex AI統合の使用方法

1. **PDFアップロード**：
   ```bash
   make pdf-upload      # 栄養知識ベースPDFをVertex AI Searchにアップロード
   ```

2. **テスト実行**：
   ```bash
   make test-agent
   ```
