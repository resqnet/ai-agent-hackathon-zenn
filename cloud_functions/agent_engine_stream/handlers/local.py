"""
ローカルADK環境用チャットハンドラー
"""

import json
import logging
from collections.abc import Generator
from typing import Any

from environment_config import EnvironmentConfig
from flask import Request, Response

from .base import ChatHandler

# ログ設定
logger = logging.getLogger(__name__)


class LocalChatHandler(ChatHandler):
    """ローカルADK環境用チャットハンドラー"""

    def __init__(self, config: EnvironmentConfig):
        super().__init__(config)
        self.adk_runner = None
        self.adk_session_service = None
        self._initialize_adk()

    def _initialize_adk(self):
        """ADKコンポーネントを初期化"""
        try:
            import os
            import sys

            # ADK関連のインポート
            from google.adk.runners import Runner
            from google.adk.sessions import InMemorySessionService

            # root_agentをインポート（プロジェクトルートから）
            sys.path.insert(
                0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
            )
            from app.vertex_ai_agent import root_agent

            # ADK コンポーネントを初期化
            self.adk_session_service = InMemorySessionService()
            self.adk_runner = Runner(
                app_name=root_agent.name,
                agent=root_agent,
                session_service=self.adk_session_service,
            )
            logger.info("ADK Runner initialized successfully for local development")

        except Exception as e:
            logger.error(f"ADK initialization failed: {e}")
            raise RuntimeError(f"ADK初期化に失敗しました: {e}")

    def handle_chat_stream(
        self, request: Request, user_info: dict[str, Any], base_headers: dict[str, str]
    ) -> Response:
        """ADKを使用したチャットストリーミング処理"""
        try:
            data, error_response = self._get_request_data(request)
            if error_response:
                return error_response

            message = data["message"]
            session_id = data.get("sessionId", "default")

            logger.info(
                f"ADKストリーミング開始 - ユーザー: {user_info['uid']}, "
                f"セッション: {session_id}, メッセージ: {message[:50]}..."
            )

            def generate_adk_stream() -> Generator[str, None, None]:
                """ADKストリーミング生成"""
                try:
                    logger.info("ADKストリーミング開始")
                    current_agent = None
                    agent_started = False

                    import asyncio

                    async def adk_stream():
                        nonlocal current_agent, agent_started
                        async for event in self._run_adk_agent_async(
                            message, user_info["uid"], session_id
                        ):
                            if event.content and event.content.parts:
                                # エージェント名を特定
                                agent_name = (
                                    getattr(event, "author", None)
                                    or "Kids Food Advisor"
                                )

                                # エージェントが変わった場合の処理
                                if current_agent and current_agent != agent_name:
                                    agent_complete_data = f"data: {json.dumps({'type': 'agent_complete', 'agent_name': current_agent}, ensure_ascii=False)}\\n\\n"
                                    yield agent_complete_data

                                # 新しいエージェント開始時の処理
                                if not current_agent or current_agent != agent_name:
                                    agent_start_data = f"data: {json.dumps({'type': 'agent_start', 'agent_name': agent_name}, ensure_ascii=False)}\\n\\n"
                                    yield agent_start_data
                                    current_agent = agent_name
                                    agent_started = True

                                # テキスト部分を処理
                                for part in event.content.parts:
                                    if part.text:
                                        sse_data = f"data: {json.dumps({'type': 'chunk', 'agent_name': agent_name, 'content': part.text}, ensure_ascii=False)}\\n\\n"
                                        yield sse_data

                        # エージェント完了とストリーム終了イベントを送信
                        if agent_started and current_agent:
                            agent_complete_data = f"data: {json.dumps({'type': 'agent_complete', 'agent_name': current_agent}, ensure_ascii=False)}\\n\\n"
                            yield agent_complete_data

                        # ストリーミング完了を通知
                        stream_end_data = f"data: {json.dumps({'type': 'stream_end'}, ensure_ascii=False)}\\n\\n"
                        yield stream_end_data

                    # 非同期関数を同期的に実行
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    try:
                        async_gen = adk_stream()
                        while True:
                            try:
                                result = loop.run_until_complete(async_gen.__anext__())
                                yield result
                            except StopAsyncIteration:
                                break
                    finally:
                        loop.close()

                except Exception as e:
                    logger.error(f"ADKストリーミングエラー: {e}")
                    yield f"data: {json.dumps({'type': 'error', 'content': f'ADK streaming error: {e!s}'}, ensure_ascii=False)}\\n\\n"

            # Server-Sent Eventsヘッダーでストリーミングレスポンス
            stream_headers = {
                **base_headers,
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            }

            return Response(generate_adk_stream(), status=200, headers=stream_headers)

        except Exception as e:
            logger.error(f"ADKストリーミングエラー: {e}")
            return Response(
                json.dumps({"success": False, "error": f"ADK streaming failed: {e!s}"}),
                status=500,
                headers=base_headers,
            )

    async def _run_adk_agent_async(
        self,
        message: str,
        user_id: str,
        session_id: str | None = None,
        image_data: bytes | None = None,
        mime_type: str | None = None,
        enable_token_streaming: bool = False,
    ):
        """ADKエージェントを非同期実行"""
        from google.adk.runners import RunConfig, StreamingMode
        from google.genai import types

        if not self.adk_runner:
            raise Exception("ADK runner is not initialized")

        # コンテンツ作成
        parts = [types.Part.from_text(text=message)]

        if image_data and mime_type:
            parts.append(types.Part.from_bytes(data=image_data, mime_type=mime_type))

        content = types.Content(role="user", parts=parts)

        # RunConfig作成（ストリーミング設定）
        run_config = None
        if enable_token_streaming:
            run_config = RunConfig(streaming_mode=StreamingMode.SSE)

        # エージェント実行
        if run_config is not None:
            async_events = self.adk_runner.run_async(
                user_id=user_id,
                session_id=session_id,
                new_message=content,
                run_config=run_config,
            )
        else:
            async_events = self.adk_runner.run_async(
                user_id=user_id,
                session_id=session_id,
                new_message=content,
            )

        async for event in async_events:
            yield event

    def handle_create_session(
        self, request: Request, user_info: dict[str, Any], base_headers: dict[str, str]
    ) -> Response:
        """ADKを使用したセッション作成処理"""
        try:
            logger.info(f"ADKセッション作成開始 - ユーザー: {user_info['uid']}")

            from api_models import SessionCreateResponse

            session = self.adk_session_service.create_session(
                app_name=self.adk_runner.app_name, user_id=user_info["uid"]
            )
            session_id = session.id if hasattr(session, "id") and session.id else None
            if not session_id:
                raise Exception("セッションIDの取得に失敗しました")

            session_response = SessionCreateResponse(success=True, sessionId=session_id)
            return Response(
                session_response.model_dump_json(),
                status=200,
                headers=base_headers,
            )

        except Exception as e:
            logger.error(f"ADKセッション作成エラー: {e}")
            from api_models import SessionCreateResponse

            session_response = SessionCreateResponse(
                success=False, error=f"ADK session creation failed: {e!s}"
            )
            return Response(
                session_response.model_dump_json(),
                status=500,
                headers=base_headers,
            )
