"""
ヘルスチェック関連のルーター処理
"""

import json

from flask import Response


def handle_health_check_router(config) -> Response:
    """
    ヘルスチェック処理

    Args:
        config: 環境設定

    Returns:
        Response: ヘルスチェックレスポンス
    """
    headers = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}

    vertex_ai_urls = config.get_vertex_ai_urls()
    agent_engine_url = vertex_ai_urls["agent_engine_url"]

    return Response(
        json.dumps(
            {
                "success": True,
                "data": {
                    "status": "healthy",
                    "service": "kids-food-advisor-agent-engine-stream",
                    "version": "1.0.0",
                    "agent_engine_url": agent_engine_url,
                    "environment": config.environment_name,
                    "handler_type": config.chat_handler_type,
                },
            }
        ),
        status=200,
        headers=headers,
    )
