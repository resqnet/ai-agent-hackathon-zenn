"""
CORS設定の統一管理
"""

from environment_config import EnvironmentConfig
from flask import Request


def setup_cors_headers(request: Request, config: EnvironmentConfig) -> dict[str, str]:
    """
    CORS許可オリジンとセキュリティヘッダーを設定

    Args:
        request: Flask Request オブジェクト
        config: 環境設定オブジェクト

    Returns:
        Dict[str, str]: CORSヘッダー辞書
    """
    allowed_origins = config.get_cors_origins()
    origin = request.headers.get("Origin", "")
    cors_origin = origin if origin in allowed_origins else "http://localhost:3002"

    return {
        "Access-Control-Allow-Origin": cors_origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS, GET, DELETE",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "3600",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
    }
