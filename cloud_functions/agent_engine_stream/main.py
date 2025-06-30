#!/usr/bin/env python3
"""
幼児向けAgent Engineストリーミング Cloud Function
Vertex AI Agent Engineとのストリーミング通信を提供

リファクタリング版: 環境別の処理を分離して保守性を向上
"""

import logging
from typing import Any

import functions_framework

# 新しいアーキテクチャのインポート
from environment_config import create_environment_config
from flask import Request
from handlers import ChatHandlerFactory

# ルーターのインポート
from routers import (
    handle_health_check_router,
)

# ユーティリティとサービスのインポート
from services import poll_operation as poll_operation_service

# 後方互換性のために既存のインポートも保持
try:
    from google.adk.runners import RunConfig, Runner, StreamingMode
    from google.adk.sessions import InMemorySessionService
    from google.genai import types

    ADK_AVAILABLE = True
except ImportError:
    ADK_AVAILABLE = False
    print("ADK not available - running in Cloud Functions mode")

# 削除済み - 必要に応じてutils.routingでインポート

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# グローバル設定とハンドラーの初期化
config = create_environment_config()
chat_handler = ChatHandlerFactory.create_handler(config)

logger.info(f"環境設定: {config.environment_name}")
logger.info(f"チャットハンドラー: {config.chat_handler_type}")

# 後方互換性のためのラッパー変数（非推奨）
PROJECT_ID = config.project_id
LOCATION = config.location
REASONING_ENGINE_ID = config.reasoning_engine_id
USE_ADK = config.is_local_adk
OPERATIONS_BASE_URL = config.get_vertex_ai_urls()["operations_base_url"]


def get_access_token() -> str:
    """Google Cloud認証トークンを取得（非推奨: environment_config.get_access_token使用）"""
    from environment_config import get_access_token as get_token

    return get_token(config)


# APIレスポンスモデルは app.models.api_responses から共有


# get_agent_name と split_agent_content は utils.agent_utils に移動済み


def poll_operation(
    operation_name: str,
    access_token: str,
    max_wait_seconds: int = 30,
    poll_interval: float = 1.5,
) -> dict[str, Any]:
    """Operations APIポーリング（非推奨: services.poll_operation_service使用）"""
    return poll_operation_service(
        operation_name,
        access_token,
        OPERATIONS_BASE_URL,
        max_wait_seconds,
        poll_interval,
    )


@functions_framework.http
def agent_engine_stream(request: Request):
    """
    Agent Engineストリーミング・セッション管理統合エンドポイント

    パスルーティング:
    - POST /api/chat/stream: ストリーミングチャット
    - POST /api/sessions: セッション作成
    - GET /api/sessions: セッション一覧取得（pageToken対応・userIdフィルタリング）
    - GET /api/sessions/{sessionId}: セッション詳細取得
    - DELETE /api/sessions/{sessionId}: セッション削除
    - GET /api/sessions/{sessionId}/events: イベント履歴取得
    """

    # CORSヘッダーとプリフライト処理
    from utils.cors import setup_cors_headers

    base_headers = setup_cors_headers(request, config)

    if request.method == "OPTIONS":
        return ("", 204, base_headers)

    # 認証とルーティング処理
    from utils.routing import route_request

    return route_request(request, base_headers, config, chat_handler, USE_ADK)


# 後方互換性のためのラッパー関数（非推奨）
# 実際の処理は新しいハンドラークラスで行われます


# 以下の関数は routers/ モジュールに移動済み（削除済み）


# ヘルスチェック用エンドポイント
@functions_framework.http
def health_check(request: Request):
    """ヘルスチェック"""
    return handle_health_check_router(config)
