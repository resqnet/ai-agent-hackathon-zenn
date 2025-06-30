"""
チャットハンドラーの基底クラス
"""

import json
from abc import ABC, abstractmethod
from typing import Any

from environment_config import EnvironmentConfig
from flask import Request, Response


class ChatHandler(ABC):
    """チャットハンドラーの基底クラス"""

    def __init__(self, config: EnvironmentConfig):
        self.config = config

    @abstractmethod
    def handle_chat_stream(
        self, request: Request, user_info: dict[str, Any], base_headers: dict[str, str]
    ) -> Response:
        """チャットストリーミング処理"""
        pass

    @abstractmethod
    def handle_create_session(
        self, request: Request, user_info: dict[str, Any], base_headers: dict[str, str]
    ) -> Response:
        """セッション作成処理"""
        pass

    def _get_request_data(
        self, request: Request
    ) -> tuple[dict | None, Response | None]:
        """リクエストデータを取得・検証"""
        base_headers = {
            "Access-Control-Allow-Origin": "http://localhost:3002",
            "Content-Type": "application/json",
        }

        if not request.is_json:
            return None, Response(
                json.dumps(
                    {"success": False, "error": "Content-Type must be application/json"}
                ),
                status=400,
                headers=base_headers,
            )

        data = request.get_json()
        if not data or "message" not in data:
            return None, Response(
                json.dumps(
                    {"success": False, "error": "No message provided in request"}
                ),
                status=400,
                headers=base_headers,
            )

        return data, None
