"""
ルーティング処理の統一管理
"""

import json
import logging

from environment_config import EnvironmentConfig
from firebase_auth_utils import authenticate_request
from flask import Request, Response
from handlers import ChatHandler
from routers import (
    handle_chat_stream_router,
    handle_create_session_router,
    handle_delete_session_router,
    handle_get_session_router,
    handle_image_analyze_proxy_router,
    handle_list_session_events_router,
    handle_list_sessions_router,
)

logger = logging.getLogger(__name__)


def route_request(
    request: Request,
    base_headers: dict[str, str],
    config: EnvironmentConfig,
    chat_handler: ChatHandler,
    use_adk: bool,
) -> Response:
    """
    リクエストのルーティング処理

    Args:
        request: Flask Request オブジェクト
        base_headers: ベースヘッダー辞書
        config: 環境設定オブジェクト
        chat_handler: チャットハンドラー
        use_adk: ADKモード使用フラグ

    Returns:
        Response: Flask Response オブジェクト
    """
    path = request.path.strip("/")
    logger.info(f"リクエストパス: {request.method} /{path}")

    # Firebase認証チェック
    user_info, auth_error = authenticate_request(request)
    if auth_error:
        logger.warning(f"Authentication failed: {auth_error}")
        return Response(
            json.dumps(auth_error),
            status=401,
            headers={**base_headers, "Content-Type": "application/json"},
        )

    logger.info(
        f"Authenticated user: {user_info['uid']} ({user_info.get('email', 'no email')})"
    )

    # パスに基づく処理の振り分け
    if path == "api/chat/stream" and request.method == "POST":
        return handle_chat_stream_router(request, user_info, base_headers, chat_handler)
    elif path == "api/sessions" and request.method == "POST":
        return handle_create_session_router(
            request, user_info, base_headers, chat_handler
        )
    elif path == "api/sessions" and request.method == "GET":
        return handle_list_sessions_router(request, user_info, base_headers, config)
    elif path.startswith("api/sessions/") and "/" not in path[13:]:
        session_id = path[13:]
        if request.method == "GET":
            return handle_get_session_router(
                session_id, user_info, base_headers, config
            )
        elif request.method == "DELETE":
            return handle_delete_session_router(
                session_id, user_info, base_headers, config
            )
    elif path.startswith("api/sessions/") and path.endswith("/events"):
        session_id = path[13:-7]
        if request.method == "GET":
            return handle_list_session_events_router(
                session_id, user_info, base_headers, config, use_adk
            )
    elif path == "api/image/analyze" and request.method == "POST":
        return handle_image_analyze_proxy_router(request, user_info, base_headers)
    else:
        return Response(
            json.dumps(
                {
                    "success": False,
                    "error": f"Unknown endpoint: {request.method} /{path}",
                }
            ),
            status=404,
            headers={**base_headers, "Content-Type": "application/json"},
        )
