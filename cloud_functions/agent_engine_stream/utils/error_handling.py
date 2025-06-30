"""
エラーハンドリングの統一管理
"""

import json
import logging
from typing import Any

from flask import Response

logger = logging.getLogger(__name__)


def create_error_response(
    error_message: str,
    status_code: int = 500,
    base_headers: dict[str, str] | None = None,
    additional_data: dict[str, Any] | None = None,
) -> Response:
    """
    統一されたエラーレスポンスを作成

    Args:
        error_message: エラーメッセージ
        status_code: HTTPステータスコード
        base_headers: ベースヘッダー
        additional_data: 追加データ

    Returns:
        Response: Flask Response オブジェクト
    """
    if base_headers is None:
        base_headers = {}

    error_data = {
        "success": False,
        "error": error_message,
    }

    if additional_data:
        error_data.update(additional_data)

    headers = {**base_headers, "Content-Type": "application/json"}

    logger.error(f"Error response: {status_code} - {error_message}")

    return Response(
        json.dumps(error_data, ensure_ascii=False),
        status=status_code,
        headers=headers,
    )


def create_success_response(
    data: Any, base_headers: dict[str, str] | None = None, status_code: int = 200
) -> Response:
    """
    統一された成功レスポンスを作成

    Args:
        data: レスポンスデータ
        base_headers: ベースヘッダー
        status_code: HTTPステータスコード

    Returns:
        Response: Flask Response オブジェクト
    """
    if base_headers is None:
        base_headers = {}

    headers = {**base_headers, "Content-Type": "application/json"}

    # dataがpydanticモデルの場合はmodel_dump_json()を使用
    if hasattr(data, "model_dump_json"):
        response_json = data.model_dump_json()
    else:
        response_json = json.dumps(data, ensure_ascii=False)

    return Response(
        response_json,
        status=status_code,
        headers=headers,
    )
