"""
チャット関連のルーター処理
"""

import json
import logging
import os
from typing import Any

import httpx
from flask import Request, Response

logger = logging.getLogger(__name__)


def handle_chat_stream_router(
    request: Request,
    user_info: dict[str, Any],
    base_headers: dict[str, str],
    chat_handler,
) -> Response:
    """
    チャットストリーミングのルーター処理

    Args:
        request: Flaskリクエスト
        user_info: 認証済みユーザー情報
        base_headers: ベースヘッダー
        chat_handler: チャットハンドラー（環境別）

    Returns:
        Response: ストリーミングレスポンス
    """
    return chat_handler.handle_chat_stream(request, user_info, base_headers)


def handle_image_analyze_proxy_router(
    request: Request, user_info: dict[str, Any], base_headers: dict[str, str]
) -> Response:
    """
    画像認識Cloud Functionsへのプロキシエンドポイント
    ローカル開発環境でのみ使用

    Args:
        request: Flaskリクエスト
        user_info: 認証済みユーザー情報
        base_headers: ベースヘッダー

    Returns:
        Response: プロキシレスポンス
    """
    try:
        logger.info(f"画像認識プロキシ開始 - ユーザー: {user_info['uid']}")

        # 画像認識Cloud FunctionsのURL（ローカル開発環境）
        image_recognition_url = os.environ.get(
            "IMAGE_RECOGNITION_URL", "http://localhost:8081"
        )

        # リクエストボディを取得
        if request.content_type and "multipart/form-data" in request.content_type:
            # multipart/form-dataの場合はそのまま転送
            files = {}
            for key, file in request.files.items():
                files[key] = (file.filename, file.read(), file.content_type)

            # httpxでプロキシリクエスト
            with httpx.Client() as client:
                response = client.post(
                    image_recognition_url,
                    files=files,
                    headers={
                        "Authorization": request.headers.get("Authorization", ""),
                    },
                    timeout=30.0,
                )
        else:
            # JSONの場合
            data = request.get_json()

            # httpxでプロキシリクエスト
            with httpx.Client() as client:
                response = client.post(
                    image_recognition_url,
                    json=data,
                    headers={
                        "Authorization": request.headers.get("Authorization", ""),
                        "Content-Type": "application/json",
                    },
                    timeout=30.0,
                )

        logger.info(f"画像認識プロキシレスポンス: {response.status_code}")

        # レスポンスをそのまま返す
        return Response(
            response.content,
            status=response.status_code,
            headers={
                **base_headers,
                "Content-Type": response.headers.get(
                    "Content-Type", "application/json"
                ),
            },
        )

    except Exception as e:
        logger.error(f"画像認識プロキシエラー: {e}")
        return Response(
            json.dumps(
                {"success": False, "error": f"Image analysis proxy failed: {e!s}"}
            ),
            status=500,
            headers={**base_headers, "Content-Type": "application/json"},
        )
