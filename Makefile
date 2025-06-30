.PHONY: all dev dev-backend dev-frontend install test playground backend backend-server functions-local setup-dev-env deploy test-agent frontend lint gitpush update-docs kill-all-servers check-ports generate-pdfs setup-vertex-ai vertex-upload vertex-deploy deploy-frontend deploy-frontend-staging deploy-frontend-prod deploy-image-function local-build-deploy update update-terraform-config

# ========== 環境変数設定 ==========
# .envファイルから環境変数を読み込み（存在する場合）
ifneq (,$(wildcard .env))
    include .env
    export
endif

# デフォルト値を設定
REASONING_ENGINE_ID ?= 6086307033135448064
GOOGLE_CLOUD_LOCATION ?= us-central1

# デフォルトターゲット - 全ローカルサービスを起動
all: dev

dev-backend:
	@echo "🚀 Starting Backend Services..."
	@echo "   Image Recognition: http://localhost:8081"
	@echo "   Chat Agent:       http://localhost:8082"
	@echo ""
	@echo "🧹 既存のバックエンドプロセスをクリーンアップ中..."
	@-pkill -f "backend_server.py" 2>/dev/null || echo "No backend_server.py processes found."
	@-pkill -f "functions-framework" 2>/dev/null || echo "No functions-framework processes found."
	@-lsof -ti:8080,8081,8082 | xargs kill -9 2>/dev/null || echo "Ports 8080,8081,8082 are free."
	@sleep 2
	@echo ""
	@echo "📦 必要なパッケージを確認中..."
	@pip install functions-framework[flask] 2>/dev/null || echo "functions-framework already installed"
	@echo ""
	@echo "🚀 バックエンドサービスを起動中..."
	@echo ""
	@echo "================== 🔷 Image Recognition API (Port 8081) =================="
	@trap 'echo ""; echo "🛑 全バックエンドサービスを停止中..."; kill %1 %2 2>/dev/null; exit' INT; \
	(cd cloud_functions/image_recognition && \
	 echo "[Image Recognition] Starting..." && \
	 functions-framework --target=analyze_food_image --port=8081 --debug 2>&1 | sed 's/^/[Image Recognition] /') & \
	sleep 2 && \
	echo "" && \
	echo "================== 🤖 Chat Agent Engine API (Port 8082) =================="  && \
	(cd cloud_functions/agent_engine_stream && \
	 echo "[Chat Agent] Starting with ADK support..." && \
	 DEVELOPMENT_MODE=adk functions-framework --target=agent_engine_stream --port=8082 --debug 2>&1 | sed 's/^/[Chat Agent] /') & \
	sleep 2 && \
	echo "" && \
	echo "===============================================================================" && \
	echo "🎯 バックエンドサービスが起動しました！" && \
	echo "" && \
	echo "💡 フロントエンドを起動するには別のターミナルで 'make dev-frontend' を実行してください" && \
	echo "===============================================================================" && \
	echo "" && \
	wait

dev-frontend:
	@echo "⚛️  Starting Frontend Development Server..."
	@echo "   URL: http://localhost:3002"
	@echo "   ⚠️  バックエンドサービスが必要です (make dev-backend)"
	@echo ""
	@echo "🔍 バックエンドサービスの状態を確認中..."
	@nc -zv localhost 8081 2>/dev/null && echo "✅ Image Recognition API (8081) is running" || echo "❌ Image Recognition API (8081) is not running"
	@nc -zv localhost 8082 2>/dev/null && echo "✅ Chat Agent Engine API (8082) is running" || echo "❌ Chat Agent Engine API (8082) is not running"
	@echo ""
	@echo "🧹 既存のフロントエンドプロセスをクリーンアップ中..."
	@-pkill -f "next.*3002" 2>/dev/null || echo "No existing Next.js processes found."
	@-pkill -f "frontend.*dev" 2>/dev/null || echo "No existing frontend dev processes found."
	@-lsof -ti:3002 | xargs kill -9 2>/dev/null || echo "Port 3002 is free."
	@sleep 1
	@echo ""
	@echo "🔄 API型を生成中..."
	@cd frontend && npm run generate-api-local || echo "⚠️  Orval generation failed - using existing types"
	@echo ""
	@echo "🚀 フロントエンド開発サーバーを起動中..."
	cd frontend && npm run dev -- --port 3002

dev-backend-adk:
	@echo "🚀 Starting Backend Services with ADK..."
	@echo "   Image Recognition: http://localhost:8081"
	@echo "   Chat Agent (ADK):  http://localhost:8082"
	@echo ""
	@echo "🧹 既存のバックエンドプロセスをクリーンアップ中..."
	@-pkill -f "backend_server.py" 2>/dev/null || echo "No backend_server.py processes found."
	@-pkill -f "functions-framework" 2>/dev/null || echo "No functions-framework processes found."
	@-lsof -ti:8080,8081,8082 | xargs kill -9 2>/dev/null || echo "Ports 8080,8081,8082 are free."
	@sleep 2
	@echo ""
	@echo "📦 必要なパッケージを確認中..."
	@pip install functions-framework[flask] 2>/dev/null || echo "functions-framework already installed"
	@echo ""
	@echo "🚀 バックエンドサービスを起動中（ADKモード）..."
	@echo ""
	@echo "================== 🔷 Image Recognition API (Port 8081) =================="
	@trap 'echo ""; echo "🛑 全バックエンドサービスを停止中..."; kill %1 %2 2>/dev/null; exit' INT; \
	(cd cloud_functions/image_recognition && \
	 echo "[Image Recognition] Starting..." && \
	 functions-framework --target=analyze_food_image --port=8081 --debug 2>&1 | sed 's/^/[Image Recognition] /') & \
	sleep 2 && \
	echo "" && \
	echo "================== 🤖 Chat Agent Engine API with ADK (Port 8082) =========="  && \
	(cd cloud_functions/agent_engine_stream && \
	 echo "[Chat Agent ADK] Starting with local ADK runner..." && \
	 DEVELOPMENT_MODE=adk functions-framework --target=agent_engine_stream --port=8082 --debug 2>&1 | sed 's/^/[Chat Agent ADK] /') & \
	sleep 2 && \
	echo "" && \
	echo "===============================================================================" && \
	echo "🎯 バックエンドサービスが起動しました（ADKモード）！" && \
	echo "" && \
	echo "💡 フロントエンドを起動するには別のターミナルで 'make dev-frontend' を実行してください" && \
	echo "===============================================================================" && \
	echo "" && \
	wait

dev-backend-vertex:
	@echo "🚀 Starting Backend Services (Vertex AI Mode)..."
	@echo "   Image Recognition: http://localhost:8081"
	@echo "   Chat Agent (Vertex AI): http://localhost:8082"
	@echo ""
	@echo "🧹 既存のバックエンドプロセスをクリーンアップ中..."
	@-pkill -f "backend_server.py" 2>/dev/null || echo "No backend_server.py processes found."
	@-pkill -f "functions-framework" 2>/dev/null || echo "No functions-framework processes found."
	@-lsof -ti:8080,8081,8082 | xargs kill -9 2>/dev/null || echo "Ports 8080,8081,8082 are free."
	@sleep 2
	@echo ""
	@echo "📦 必要なパッケージを確認中..."
	@pip install functions-framework[flask] 2>/dev/null || echo "functions-framework already installed"
	@echo ""
	@echo "🚀 バックエンドサービスを起動中（Vertex AI Agent Engine接続）..."
	@echo ""
	@echo "================== 🔷 Image Recognition API (Port 8081) =================="
	@trap 'echo ""; echo "🛑 全バックエンドサービスを停止中..."; kill %1 %2 2>/dev/null; exit' INT; \
	(cd cloud_functions/image_recognition && \
	 echo "[Image Recognition] Starting..." && \
	 functions-framework --target=analyze_food_image --port=8081 --debug 2>&1 | sed 's/^/[Image Recognition] /') & \
	sleep 2 && \
	echo "" && \
	echo "================== 🤖 Chat Agent Engine API with Vertex AI (Port 8082) =========="  && \
	(cd cloud_functions/agent_engine_stream && \
	 echo "[Chat Agent Vertex AI] Starting with Vertex AI Agent Engine..." && \
	 DEVELOPMENT_MODE=vertex_ai functions-framework --target=agent_engine_stream --port=8082 --debug 2>&1 | sed 's/^/[Chat Agent Vertex AI] /') & \
	sleep 2 && \
	echo "" && \
	echo "===============================================================================" && \
	echo "🎯 バックエンドサービスが起動しました（Vertex AI接続）！" && \
	echo "" && \
	echo "💡 フロントエンドを起動するには別のターミナルで 'make dev-stage-frontend' を実行してください" && \
	echo "===============================================================================" && \
	echo "" && \
	wait

dev-stage-frontend:
	@echo "🚀 Starting Frontend (Staging Mode)..."
	@echo "   URL: http://localhost:3003"
	@echo "   Mode: Vertex AI Agent Engine Connection (OpenAPI generation skipped)"
	@echo "🔍 Checking for existing processes on port 3003..."
	@-pkill -f "next.*3003" 2>/dev/null || echo "No existing Next.js processes found."
	@-pkill -f "frontend.*dev" 2>/dev/null || echo "No existing frontend dev processes found."
	@-lsof -ti:3003 | xargs kill -9 2>/dev/null || echo "Port 3003 is free."
	@sleep 1
	@echo "⚡ Skipping API type generation for faster startup..."
	@echo "🔍 Checking if backend service is running..."
	@nc -zv localhost 8082 2>/dev/null && echo "✅ Agent Engine Stream API (8082) is running" || echo "❌ Agent Engine Stream API (8082) is not running - バックエンドを先に起動してください: 'make dev-backend-vertex'"
	@echo "✅ Starting development server in staging mode with Vertex AI Agent Engine..."
	@PROJECT_ID=$$(gcloud config get-value project) && \
	cd frontend && \
	NEXT_PUBLIC_API_MODE=staging \
	NEXT_PUBLIC_AGENT_ENGINE_URL=https://us-central1-$$PROJECT_ID.cloudfunctions.net/agent-engine-stream \
	NEXT_PUBLIC_CLOUD_FUNCTIONS_URL=https://us-central1-$$PROJECT_ID.cloudfunctions.net/image-recognition \
	npx next dev --turbopack --port 3003

install:
	@command -v uv >/dev/null 2>&1 || { echo "uv is not installed. Installing uv..."; curl -LsSf https://astral.sh/uv/0.6.12/install.sh | sh; source ~/.bashrc; }
	uv sync --dev --extra jupyter --extra frontend --frozen

test:
	DISABLE_TRACING=true uv run pytest tests/unit && DISABLE_TRACING=true uv run pytest tests/integration

backend:
	@echo "🚀 Creating New Agent Engine Instance..."
	@echo "   Port: 8000 (Vertex AI Agent Engine)"
	@echo "🔍 Checking for existing agent processes..."
	@-pkill -f "agent_engine_app.py" 2>/dev/null || echo "No existing agent processes found."
	@-lsof -ti:8000 | xargs kill -9 2>/dev/null || echo "Port 8000 is free."
	@sleep 1
	# Export dependencies to requirements file using uv export.
	uv export --no-hashes --no-header --no-dev --no-emit-project --no-annotate --frozen > .requirements.txt 2>/dev/null || \
	uv export --no-hashes --no-header --no-dev --no-emit-project --frozen > .requirements.txt && uv run app/agent_engine_app.py
	@echo "🔄 Updating Terraform with new Agent Engine ID..."
	@$(MAKE) update-terraform-config

update-terraform-config:
	@echo "🔧 Updating Terraform configuration with new Agent Engine ID..."
	@if [ ! -f "deployment_metadata.json" ]; then \
		echo "❌ deployment_metadata.json not found."; \
		exit 1; \
	fi
	@AGENT_ENGINE_ID=$$(cat deployment_metadata.json | grep '"remote_agent_engine_id"' | cut -d'"' -f4 | cut -d'/' -f6) && \
	echo "📝 New Agent Engine ID: $$AGENT_ENGINE_ID" && \
	if [ -f ".env" ]; then \
		sed -i "s/^REASONING_ENGINE_ID=.*/REASONING_ENGINE_ID=$$AGENT_ENGINE_ID/" .env; \
		echo "✅ Updated .env file"; \
	else \
		echo "REASONING_ENGINE_ID=$$AGENT_ENGINE_ID" >> .env; \
		echo "✅ Created .env file with new Agent Engine ID"; \
	fi && \
	echo "🚀 To apply changes to Cloud Functions, run:" && \
	echo "   make deploy-chat-function"

setup-dev-env:
	PROJECT_ID=$$(gcloud config get-value project) && \
	(cd deployment/terraform/dev && terraform init && terraform apply --var-file vars/env.tfvars --var dev_project_id=$$PROJECT_ID --auto-approve)

deploy:
	@if [ "$(prod)" = "true" ]; then \
		echo "🚀 Deploying to PRODUCTION environment..."; \
		cd deployment/terraform && terraform init && terraform plan -var-file=vars/env.tfvars && terraform apply -var-file=vars/env.tfvars -auto-approve; \
	else \
		echo "🚀 Deploying to DEV environment..."; \
		cd deployment/terraform/dev && terraform init && terraform plan -var-file=vars/env.tfvars && terraform apply -var-file=vars/env.tfvars -auto-approve; \
	fi
	@echo "🚀 Deploying agent to Vertex AI Agent Engine..."
	$(MAKE) backend

test-agent:
	@echo "🧪 Testing deployed agent..."
	uv run pytest tests/integration/test_agent_engine_app.py -v -s

lint:
	uv run codespell --skip="frontend,pdfs" -L "vai,vas,onw"
	uv run ruff check . --diff --exclude="frontend"
	uv run ruff format . --check --diff --exclude="frontend"
	uv run mypy . --exclude="frontend"

kill-all-servers:
	@echo "🛑 Stopping all development servers..."
	@echo "🔍 Killing processes on commonly used ports..."
	@-pkill -f "backend_server.py" 2>/dev/null || echo "No backend_server.py processes found."
	@-pkill -f "agent_engine_app.py" 2>/dev/null || echo "No agent_engine_app.py processes found."
	@-pkill -f "adk web" 2>/dev/null || echo "No playground processes found."
	@-pkill -f "next.*3002" 2>/dev/null || echo "No Next.js port 3002 processes found."
	@-pkill -f "next.*3003" 2>/dev/null || echo "No Next.js port 3003 processes found."
	@-pkill -f "frontend.*dev" 2>/dev/null || echo "No frontend dev processes found."
	@-pkill -f "npm.*dev" 2>/dev/null || echo "No npm dev processes found."
	@-lsof -ti:3000,3001,3002,3003,8000,8081,8082 | xargs kill -9 2>/dev/null || echo "All specified ports are free."
	@sleep 1
	@echo "✅ All development servers stopped."

pdf-upload:
	@echo "📤 Uploading PDFs to Vertex AI Search..."
	@PROJECT_ID=$$(gcloud config get-value project) && \
	uv run python scripts/upload_pdfs_to_vertex_search.py \
		--project-id $$PROJECT_ID \
		--pdf-directory ./pdfs

deploy-frontend-staging:
	@echo "🚀 Deploying Frontend to Staging..."
	@if [ -f frontend/.env ]; then \
		echo "📋 frontend/.envから環境変数を読み込み中..."; \
		export $$(grep "^NEXT_PUBLIC_FIREBASE_" frontend/.env | xargs); \
		FIREBASE_API_KEY=$${NEXT_PUBLIC_FIREBASE_API_KEY}; \
		FIREBASE_AUTH_DOMAIN=$${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}; \
		FIREBASE_PROJECT_ID=$${NEXT_PUBLIC_FIREBASE_PROJECT_ID}; \
		FIREBASE_STORAGE_BUCKET=$${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}; \
		FIREBASE_MESSAGING_SENDER_ID=$${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}; \
		FIREBASE_APP_ID=$${NEXT_PUBLIC_FIREBASE_APP_ID}; \
	else \
		echo "❌ frontend/.envファイルが見つかりません"; \
		echo "   以下のコマンドで設定ファイルを作成してください:"; \
		echo "   cp frontend/.env.example frontend/.env"; \
		echo "   vi frontend/.env  # Firebase設定値を入力"; \
		exit 1; \
	fi; \
	if [ -z "$$FIREBASE_API_KEY" ] || [ -z "$$FIREBASE_AUTH_DOMAIN" ] || [ -z "$$FIREBASE_PROJECT_ID" ] || [ -z "$$FIREBASE_STORAGE_BUCKET" ] || [ -z "$$FIREBASE_MESSAGING_SENDER_ID" ] || [ -z "$$FIREBASE_APP_ID" ]; then \
		echo "❌ Firebase環境変数が設定されていません。"; \
		echo "   frontend/.envファイルまたは環境変数で以下を設定してください:"; \
		echo "   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key"; \
		echo "   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com"; \
		echo "   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id"; \
		echo "   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com"; \
		echo "   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id"; \
		echo "   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id"; \
		exit 1; \
	fi; \
	PROJECT_ID=$$(gcloud config get-value project) && \
	COMMIT_SHA=$$(git rev-parse HEAD) && \
	gcloud builds submit frontend/ \
		--config=deployment/cd/frontend-staging.yaml \
		--substitutions=_STAGING_PROJECT_ID=$$PROJECT_ID,_REGION=us-central1,_REPOSITORY_NAME=kids-food-advisor-frontend,_PROJECT_NAME=kids-food-advisor,COMMIT_SHA=$$COMMIT_SHA,_FIREBASE_API_KEY=$$FIREBASE_API_KEY,_FIREBASE_AUTH_DOMAIN=$$FIREBASE_AUTH_DOMAIN,_FIREBASE_PROJECT_ID=$$FIREBASE_PROJECT_ID,_FIREBASE_STORAGE_BUCKET=$$FIREBASE_STORAGE_BUCKET,_FIREBASE_MESSAGING_SENDER_ID=$$FIREBASE_MESSAGING_SENDER_ID,_FIREBASE_APP_ID=$$FIREBASE_APP_ID \
		--project=$$PROJECT_ID

deploy-frontend-prod:
	@echo "🚀 Deploying Frontend to Production..."
	@echo "⚠️  WARNING: This will deploy to PRODUCTION"
	@echo "🚨 Production deployment requires manual confirmation."
	@echo "続行するにはEnterキーを押し、キャンセルするにはCtrl+Cを押してください..."
	@read -r dummy
	@if [ -f frontend/.env ]; then \
		echo "📋 frontend/.envから環境変数を読み込み中..."; \
		export $$(grep "^NEXT_PUBLIC_FIREBASE_" frontend/.env | xargs); \
		FIREBASE_API_KEY=$${NEXT_PUBLIC_FIREBASE_API_KEY}; \
		FIREBASE_AUTH_DOMAIN=$${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}; \
		FIREBASE_PROJECT_ID=$${NEXT_PUBLIC_FIREBASE_PROJECT_ID}; \
		FIREBASE_STORAGE_BUCKET=$${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}; \
		FIREBASE_MESSAGING_SENDER_ID=$${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}; \
		FIREBASE_APP_ID=$${NEXT_PUBLIC_FIREBASE_APP_ID}; \
	else \
		echo "❌ frontend/.envファイルが見つかりません"; \
		echo "   以下のコマンドで設定ファイルを作成してください:"; \
		echo "   cp frontend/.env.example frontend/.env"; \
		echo "   vi frontend/.env  # Firebase設定値を入力"; \
		exit 1; \
	fi; \
	if [ -z "$$FIREBASE_API_KEY" ] || [ -z "$$FIREBASE_AUTH_DOMAIN" ] || [ -z "$$FIREBASE_PROJECT_ID" ] || [ -z "$$FIREBASE_STORAGE_BUCKET" ] || [ -z "$$FIREBASE_MESSAGING_SENDER_ID" ] || [ -z "$$FIREBASE_APP_ID" ]; then \
		echo "❌ Firebase環境変数が設定されていません。"; \
		echo "   frontend/.envファイルまたは環境変数で以下を設定してください:"; \
		echo "   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key"; \
		echo "   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com"; \
		echo "   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id"; \
		echo "   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com"; \
		echo "   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id"; \
		echo "   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id"; \
		exit 1; \
	fi; \
	PROJECT_ID=$$(gcloud config get-value project) && \
	COMMIT_SHA=$$(git rev-parse HEAD) && \
	gcloud builds submit frontend/ \
		--config=deployment/cd/frontend-prod.yaml \
		--substitutions=_PROD_PROJECT_ID=$$PROJECT_ID,_STAGING_PROJECT_ID=$$PROJECT_ID,_REGION=us-central1,_REPOSITORY_NAME=kids-food-advisor-frontend,_PROJECT_NAME=kids-food-advisor,COMMIT_SHA=$$COMMIT_SHA,_FIREBASE_API_KEY=$$FIREBASE_API_KEY,_FIREBASE_AUTH_DOMAIN=$$FIREBASE_AUTH_DOMAIN,_FIREBASE_PROJECT_ID=$$FIREBASE_PROJECT_ID,_FIREBASE_STORAGE_BUCKET=$$FIREBASE_STORAGE_BUCKET,_FIREBASE_MESSAGING_SENDER_ID=$$FIREBASE_MESSAGING_SENDER_ID,_FIREBASE_APP_ID=$$FIREBASE_APP_ID \
		--project=$$PROJECT_ID

deploy-image-function:
	@echo "🚀 Deploying Image Recognition Cloud Function..."
	@echo "   URL: https://us-central1-[PROJECT].cloudfunctions.net/image-recognition"
	@PROJECT_ID=$$(gcloud config get-value project) && \
	echo "🔑 Deploying to project: $$PROJECT_ID" && \
	cd cloud_functions/image_recognition && \
	gcloud functions deploy image-recognition \
		--gen2 \
		--runtime=python312 \
		--region=us-central1 \
		--source=. \
		--entry-point=analyze_food_image \
		--trigger-http \
		--allow-unauthenticated \
		--memory=512MB \
		--cpu=1 \
		--timeout=60s \
		--max-instances=10 \
		--min-instances=0 \
		--concurrency=20 \
		--set-env-vars="GOOGLE_CLOUD_PROJECT=$$PROJECT_ID,GOOGLE_CLOUD_LOCATION=us-central1" \
		--project=$$PROJECT_ID

deploy-chat-function:
	@echo "🚀 Deploying Agent Engine Chat Cloud Function..."
	@echo "   URL: https://us-central1-[PROJECT].cloudfunctions.net/agent-engine-stream"
	@PROJECT_ID=$$(gcloud config get-value project) && \
	echo "🔑 Deploying to project: $$PROJECT_ID" && \
	cd cloud_functions/agent_engine_stream && \
	gcloud functions deploy agent-engine-stream \
		--gen2 \
		--runtime=python312 \
		--region=us-central1 \
		--source=. \
		--entry-point=agent_engine_stream \
		--trigger-http \
		--allow-unauthenticated \
		--memory=1GB \
		--cpu=1 \
		--timeout=300s \
		--max-instances=10 \
		--min-instances=0 \
		--concurrency=10 \
		--set-env-vars="GOOGLE_CLOUD_PROJECT=$$PROJECT_ID,GOOGLE_CLOUD_LOCATION=$(GOOGLE_CLOUD_LOCATION),REASONING_ENGINE_ID=$(REASONING_ENGINE_ID)" \
		--project=$$PROJECT_ID
