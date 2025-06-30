"""
リモートVertex AI Agent Engine用チャットハンドラー
"""

import json
import logging
from collections.abc import Generator
from typing import Any

import httpx
from environment_config import get_access_token
from flask import Request, Response
from services import poll_operation

from .base import ChatHandler

# ログ設定
logger = logging.getLogger(__name__)


class RemoteChatHandler(ChatHandler):
    """リモートVertex AI Agent Engine用チャットハンドラー"""

    def handle_chat_stream(
        self, request: Request, user_info: dict[str, Any], base_headers: dict[str, str]
    ) -> Response:
        """Vertex AI Agent Engineを使用したチャットストリーミング処理"""
        try:
            data, error_response = self._get_request_data(request)
            if error_response:
                return error_response

            message = data["message"]
            session_id = data.get("sessionId", "default")

            logger.info(
                f"Vertex AIストリーミング開始 - ユーザー: {user_info['uid']}, "
                f"セッション: {session_id}, メッセージ: {message[:50]}..."
            )

            def generate_vertex_ai_stream() -> Generator[str, None, None]:
                """Vertex AI APIストリーミング生成"""
                try:
                    # 認証トークンの取得
                    access_token = get_access_token(self.config)

                    # Vertex AI Agent Engine API リクエスト
                    request_payload = {
                        "class_method": "stream_query",
                        "input": {
                            "user_id": user_info["uid"],
                            "session_id": session_id,
                            "message": message,
                        },
                    }

                    headers = {
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json",
                    }

                    vertex_ai_urls = self.config.get_vertex_ai_urls()
                    agent_engine_url = vertex_ai_urls["agent_engine_url"]

                    logger.info(f"Agent Engine APIにリクエスト送信: {agent_engine_url}")

                    # Agent Engine APIにストリーミングリクエストを送信
                    with httpx.stream(
                        "POST",
                        agent_engine_url,
                        json=request_payload,
                        headers=headers,
                        timeout=60.0,
                    ) as response:
                        logger.info(
                            f"Agent Engine APIレスポンス: {response.status_code}"
                        )

                        if response.status_code != 200:
                            error_text = response.text
                            logger.error(
                                f"Agent Engine APIエラー: {response.status_code} - {error_text}"
                            )
                            yield f"data: {json.dumps({'type': 'error', 'content': f'Agent Engine API Error: {response.status_code} - {error_text}'}, ensure_ascii=False)}\\n\\n"
                            return

                        logger.info("Agent Engine APIストリーミングレスポンス処理開始")

                        # ストリーミングレスポンスを逐次処理
                        current_agent = None
                        agent_started = False

                        for line in response.iter_lines():
                            if line.strip():
                                try:
                                    line_str = (
                                        line.decode("utf-8")
                                        if isinstance(line, bytes)
                                        else str(line)
                                    )

                                    response_data = json.loads(line_str)

                                    # Agent Engineのcontentオブジェクトからテキストを抽出
                                    if (
                                        "content" in response_data
                                        and "parts" in response_data["content"]
                                    ):
                                        parts = response_data["content"]["parts"]
                                        for part in parts:
                                            if "text" in part:
                                                text_content = part["text"]

                                                # エージェント分割処理（必要に応じて）
                                                from utils import split_agent_content

                                                agent_parts = split_agent_content(
                                                    text_content
                                                )

                                                for (
                                                    part_content,
                                                    agent_name,
                                                ) in agent_parts:
                                                    if not part_content.strip():
                                                        continue

                                                    # エージェント変更処理
                                                    if (
                                                        current_agent
                                                        and current_agent != agent_name
                                                    ):
                                                        agent_complete_data = f"data: {json.dumps({'type': 'agent_complete', 'agent_name': current_agent}, ensure_ascii=False)}\\n\\n"
                                                        yield agent_complete_data

                                                    # 新しいエージェント開始
                                                    if (
                                                        not current_agent
                                                        or current_agent != agent_name
                                                    ):
                                                        agent_start_data = f"data: {json.dumps({'type': 'agent_start', 'agent_name': agent_name}, ensure_ascii=False)}\\n\\n"
                                                        yield agent_start_data
                                                        current_agent = agent_name
                                                        agent_started = True

                                                    # SSE形式で送信
                                                    sse_data = f"data: {json.dumps({'type': 'chunk', 'agent_name': agent_name, 'content': part_content}, ensure_ascii=False)}\\n\\n"
                                                    yield sse_data

                                except json.JSONDecodeError as e:
                                    logger.error(f"JSON解析エラー: {e}")
                                    yield f"data: {json.dumps({'type': 'error', 'content': f'JSON parsing error: {e!s}'}, ensure_ascii=False)}\\n\\n"

                        # ストリーミング完了処理
                        if agent_started and current_agent:
                            agent_complete_data = f"data: {json.dumps({'type': 'agent_complete', 'agent_name': current_agent}, ensure_ascii=False)}\\n\\n"
                            yield agent_complete_data

                        stream_end_data = f"data: {json.dumps({'type': 'stream_end'}, ensure_ascii=False)}\\n\\n"
                        yield stream_end_data

                except Exception as e:
                    logger.error(f"Vertex AIストリーミングエラー: {e}")
                    yield f"data: {json.dumps({'type': 'error', 'content': f'Streaming error: {e!s}'}, ensure_ascii=False)}\\n\\n"

            # Server-Sent Eventsヘッダーでストリーミングレスポンス
            stream_headers = {
                **base_headers,
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            }

            return Response(
                generate_vertex_ai_stream(), status=200, headers=stream_headers
            )

        except Exception as e:
            logger.error(f"Vertex AIストリーミングエラー: {e}")
            return Response(
                json.dumps(
                    {"success": False, "error": f"Vertex AI streaming failed: {e!s}"}
                ),
                status=500,
                headers=base_headers,
            )

    def handle_create_session(
        self, request: Request, user_info: dict[str, Any], base_headers: dict[str, str]
    ) -> Response:
        """Vertex AI Agent Engineを使用したセッション作成処理"""
        try:
            logger.info(f"Vertex AIセッション作成開始 - ユーザー: {user_info['uid']}")

            # 認証トークンの取得
            access_token = get_access_token(self.config)
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            }

            # Vertex AI Sessions API でセッション作成
            create_payload = {"userId": user_info["uid"]}
            vertex_ai_urls = self.config.get_vertex_ai_urls()
            sessions_base_url = vertex_ai_urls["sessions_base_url"]

            with httpx.Client() as client:
                response = client.post(
                    sessions_base_url,
                    json=create_payload,
                    headers=headers,
                    timeout=30.0,
                )

                logger.info(f"Session Create API レスポンス: {response.status_code}")

                if response.status_code == 200:
                    operation_data = response.json()
                    operation_name = operation_data.get("name")

                    if not operation_name:
                        raise Exception(
                            f"Operation name not found in response: {operation_data}"
                        )

                    logger.info(f"Operation開始: {operation_name}")

                    # Operationの完了をポーリングで待機
                    vertex_ai_urls = self.config.get_vertex_ai_urls()
                    session_data = poll_operation(
                        operation_name=operation_name,
                        access_token=access_token,
                        operations_base_url=vertex_ai_urls["operations_base_url"],
                    )
                    logger.info(
                        f"セッション作成成功: {session_data.get('name', 'Unknown')}"
                    )

                    # session_dataのname からsessionIdを抽出
                    session_name = session_data.get("name", "")
                    if session_name and "/sessions/" in session_name:
                        after_sessions = session_name.split("/sessions/")[-1]
                        session_id = after_sessions.split("/")[0]

                        if not session_id:
                            raise Exception(
                                f"セッションIDの抽出に失敗: session name '{session_name}'"
                            )
                    else:
                        raise Exception(f"無効なセッション名形式: '{session_name}'")

                    from api_models import SessionCreateResponse

                    session_response = SessionCreateResponse(
                        success=True, sessionId=session_id
                    )

                    return Response(
                        session_response.model_dump_json(),
                        status=200,
                        headers=base_headers,
                    )
                else:
                    error_text = response.text
                    logger.error(
                        f"Session Create API エラー: {response.status_code} - {error_text}"
                    )

                    from api_models import SessionCreateResponse

                    session_response = SessionCreateResponse(
                        success=False,
                        error=f"Failed to create session: {response.status_code} - {error_text}",
                    )

                    return Response(
                        session_response.model_dump_json(),
                        status=response.status_code,
                        headers=base_headers,
                    )

        except Exception as e:
            logger.error(f"Vertex AIセッション作成エラー: {e}")
            from api_models import SessionCreateResponse

            session_response = SessionCreateResponse(
                success=False, error=f"Session creation failed: {e!s}"
            )
            return Response(
                session_response.model_dump_json(),
                status=500,
                headers=base_headers,
            )
