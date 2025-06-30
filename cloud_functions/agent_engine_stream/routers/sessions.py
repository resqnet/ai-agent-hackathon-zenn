"""
セッション管理関連のルーター処理
"""

import logging
from typing import Any

import httpx
from api_models import (
    ApiResponse,
    SessionEventListResponse,
    SessionGetResponse,
    SessionListResponse,
    VertexAIEventsListResponse,
    VertexAISession,
    VertexAISessionsListResponse,
)
from environment_config import get_access_token
from flask import Request, Response

logger = logging.getLogger(__name__)


def handle_create_session_router(
    request: Request,
    user_info: dict[str, Any],
    base_headers: dict[str, str],
    chat_handler,
) -> Response:
    """
    セッション作成のルーター処理

    Args:
        request: Flaskリクエスト
        user_info: 認証済みユーザー情報
        base_headers: ベースヘッダー
        chat_handler: チャットハンドラー（環境別）

    Returns:
        Response: セッション作成レスポンス
    """
    return chat_handler.handle_create_session(request, user_info, base_headers)


def handle_list_sessions_router(
    request: Request, user_info: dict[str, Any], base_headers: dict[str, str], config
) -> Response:
    """
    セッション一覧取得処理（userIdフィルタリング・ページネーション対応）

    Args:
        request: Flaskリクエスト
        user_info: 認証済みユーザー情報
        base_headers: ベースヘッダー
        config: 環境設定

    Returns:
        Response: セッション一覧レスポンス
    """
    try:
        logger.info(f"セッション一覧取得開始 - ユーザー: {user_info['uid']}")

        # クエリパラメータからpageTokenを取得
        page_token = request.args.get("pageToken")
        if page_token:
            logger.info(f"ページトークン指定: {page_token}")

        # 認証トークンの取得
        access_token = get_access_token(config)
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        # Vertex AI Sessions API でセッション一覧取得（userIdフィルタリング）
        params = {
            "filter": f"userId={user_info['uid']}"  # userIdでフィルタリング
        }

        # pageTokenが指定されている場合は追加
        if page_token:
            params["pageToken"] = page_token

        vertex_ai_urls = config.get_vertex_ai_urls()
        sessions_base_url = vertex_ai_urls["sessions_base_url"]

        with httpx.Client() as client:
            response = client.get(
                sessions_base_url,
                params=params,
                headers=headers,
                timeout=30.0,
            )

            logger.info(f"Sessions List API レスポンス: {response.status_code}")
            logger.info(f"リクエストURL: {response.url}")

            if response.status_code == 200:
                sessions_data = response.json()
                # Vertex AI Sessions APIは 'sessions' キーでセッション一覧を返す
                sessions_list = sessions_data.get("sessions", [])
                next_page_token = sessions_data.get("nextPageToken")
                session_count = len(sessions_list)
                logger.info(
                    f"セッション一覧取得成功: {session_count}件, nextPageToken: {next_page_token}"
                )

                # Vertex AI APIレスポンスを適切にパースしてから返却
                try:
                    # VertexAISessionsListResponseで構造をバリデーション
                    vertex_response = VertexAISessionsListResponse(**sessions_data)

                    sessions_response = SessionListResponse(
                        success=True,
                        sessions=vertex_response.sessions,
                        nextPageToken=vertex_response.nextPageToken,
                    )
                except Exception as parse_error:
                    logger.error(f"Sessions レスポンス解析エラー: {parse_error}")
                    sessions_response = SessionListResponse(
                        success=False,
                        error=f"レスポンスの解析に失敗しました: {parse_error}",
                    )

                return Response(
                    sessions_response.model_dump_json(),
                    status=200,
                    headers={**base_headers, "Content-Type": "application/json"},
                )
            else:
                error_text = response.text
                logger.error(
                    f"Sessions List API エラー: {response.status_code} - {error_text}"
                )

                sessions_response = SessionListResponse(
                    success=False,
                    error=f"Failed to list sessions: {response.status_code} - {error_text}",
                )

                return Response(
                    sessions_response.model_dump_json(),
                    status=response.status_code,
                    headers={**base_headers, "Content-Type": "application/json"},
                )

    except httpx.RequestError as e:
        logger.error(f"セッション一覧取得リクエストエラー: {e}")
        sessions_response = SessionListResponse(
            success=False, error=f"Request error: {e!s}"
        )
        return Response(
            sessions_response.model_dump_json(),
            status=500,
            headers={**base_headers, "Content-Type": "application/json"},
        )


def handle_get_session_router(
    session_id: str, user_info: dict[str, Any], base_headers: dict[str, str], config
) -> Response:
    """
    セッション詳細取得処理

    Args:
        session_id: セッションID
        user_info: 認証済みユーザー情報
        base_headers: ベースヘッダー
        config: 環境設定

    Returns:
        Response: セッション詳細レスポンス
    """
    try:
        logger.info(
            f"セッション詳細取得開始 - ユーザー: {user_info['uid']}, セッション: {session_id}"
        )

        # 認証トークンの取得
        access_token = get_access_token(config)
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        # セッションIDから完全なリソース名を構築
        if session_id.startswith("projects/"):
            # 既に完全なリソース名の場合はそのまま使用
            full_session_name = session_id
        else:
            # 数値またはUUID形式のセッションID -> 完全なリソース名に変換
            full_session_name = f"projects/{config.project_id}/locations/{config.location}/reasoningEngines/{config.reasoning_engine_id}/sessions/{session_id}"

        session_url = f"https://{config.location}-aiplatform.googleapis.com/v1beta1/{full_session_name}"

        with httpx.Client() as client:
            response = client.get(
                session_url,
                headers=headers,
                timeout=30.0,
            )

            logger.info(f"Session Get API レスポンス: {response.status_code}")

            if response.status_code == 200:
                session_data = response.json()
                logger.info(
                    f"セッション詳細取得成功: {session_data.get('name', 'Unknown')}"
                )

                # Vertex AI APIレスポンスを適切にパースしてから返却
                try:
                    # VertexAISessionで構造をバリデーション
                    vertex_session = VertexAISession(**session_data)

                    session_response = SessionGetResponse(
                        success=True, session=vertex_session
                    )
                except Exception as parse_error:
                    logger.error(f"Session レスポンス解析エラー: {parse_error}")
                    session_response = SessionGetResponse(
                        success=False,
                        error=f"レスポンスの解析に失敗しました: {parse_error}",
                    )
                
                # カレントユーザーがセッションの所有者であるか確認
                if vertex_session.userId != user_info["uid"]:
                    logger.error(
                        f"セッションの所有者が異なります: {session_id} - ユーザー: {user_info['uid']}"
                    )
                    session_response = SessionGetResponse(
                        success=False,
                        error=f"Session not found: {session_id}",
                    )
                    return Response(
                        session_response.model_dump_json(),
                        status=404,
                        headers={**base_headers, "Content-Type": "application/json"},
                    )

                return Response(
                    session_response.model_dump_json(),
                    status=200,
                    headers={**base_headers, "Content-Type": "application/json"},
                )
            else:
                error_text = response.text
                logger.error(
                    f"Session Get API エラー: {response.status_code} - {error_text}"
                )

                session_response = SessionGetResponse(
                    success=False,
                    error=f"Failed to get session: {response.status_code} - {error_text}",
                )

                return Response(
                    session_response.model_dump_json(),
                    status=response.status_code,
                    headers={**base_headers, "Content-Type": "application/json"},
                )

    except httpx.RequestError as e:
        logger.error(f"セッション詳細取得リクエストエラー: {e}")
        session_response = SessionGetResponse(
            success=False, error=f"Request error: {e!s}"
        )
        return Response(
            session_response.model_dump_json(),
            status=500,
            headers={**base_headers, "Content-Type": "application/json"},
        )


def handle_delete_session_router(
    session_id: str, user_info: dict[str, Any], base_headers: dict[str, str], config
) -> Response:
    """
    セッション削除処理

    Args:
        session_id: セッションID
        user_info: 認証済みユーザー情報
        base_headers: ベースヘッダー
        config: 環境設定

    Returns:
        Response: セッション削除レスポンス
    """
    try:
        logger.info(
            f"セッション削除開始 - ユーザー: {user_info['uid']}, セッション: {session_id}"
        )

        # 認証トークンの取得
        access_token = get_access_token(config)
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        # セッションIDから完全なリソース名を構築
        if session_id.startswith("projects/"):
            # 既に完全なリソース名の場合はそのまま使用
            full_session_name = session_id
        else:
            # 数値またはUUID形式のセッションID -> 完全なリソース名に変換
            full_session_name = f"projects/{config.project_id}/locations/{config.location}/reasoningEngines/{config.reasoning_engine_id}/sessions/{session_id}"

        session_url = f"https://{config.location}-aiplatform.googleapis.com/v1beta1/{full_session_name}"

        with httpx.Client() as client:
            # セッション詳細を取得してセッションが存在するかを確認
            session_response = client.get(
                session_url,
                headers=headers,
                timeout=30.0,
            )

            logger.info(f"セッション存在確認レスポンス: {session_response.status_code}")

            if session_response.status_code != 200:
                logger.error(
                    f"セッションが存在しません: {session_id} - {session_response.status_code}: {session_response.text}"
                )
                events_response = ApiResponse(
                    success=False,
                    error=f"Session not found: {session_id} - {session_response.status_code}",
                )
                return Response(
                    events_response.model_dump_json(),
                    status=404,
                    headers={**base_headers, "Content-Type": "application/json"},
                )
        
        # カレントユーザーのセッションでなければ404エラーにする
        if session_response.json().get("userId") != user_info["uid"]:
            logger.error(
                f"セッションの所有者が異なります: {session_id} - ユーザー: {user_info['uid']}"
            )

            events_response = ApiResponse(
                success=False,
                error=f"Session not found: {session_id}",
            )
            return Response(
                events_response.model_dump_json(),
                status=404,
                headers={**base_headers, "Content-Type": "application/json"},
            )   

        with httpx.Client() as client:
            response = client.delete(
                session_url,
                headers=headers,
                timeout=30.0,
            )

            logger.info(f"Session Delete API レスポンス: {response.status_code}")

            if response.status_code in [200, 204]:
                logger.info(f"セッション削除成功: session_id={session_id}")

                api_response = ApiResponse(
                    success=True,
                    data={
                        "sessionId": session_id,
                        "message": f"Session {session_id} deleted successfully",
                    },
                )

                return Response(
                    api_response.model_dump_json(),
                    status=200,
                    headers={**base_headers, "Content-Type": "application/json"},
                )
            else:
                error_text = response.text
                logger.error(
                    f"Session Delete API エラー: {response.status_code} - {error_text}"
                )

                api_response = ApiResponse(
                    success=False,
                    error=f"Failed to delete session: {response.status_code} - {error_text}",
                )

                return Response(
                    api_response.model_dump_json(),
                    status=response.status_code,
                    headers={**base_headers, "Content-Type": "application/json"},
                )

    except httpx.RequestError as e:
        logger.error(f"セッション削除リクエストエラー: {e}")
        api_response = ApiResponse(success=False, error=f"Request error: {e!s}")
        return Response(
            api_response.model_dump_json(),
            status=500,
            headers={**base_headers, "Content-Type": "application/json"},
        )


def handle_list_session_events_router(
    session_id: str,
    user_info: dict[str, Any],
    base_headers: dict[str, str],
    config,
    use_adk: bool = False,
) -> Response:
    """
    セッションイベント履歴取得処理

    Args:
        session_id: セッションID
        user_info: 認証済みユーザー情報
        base_headers: ベースヘッダー
        config: 環境設定
        use_adk: ADKモードフラグ

    Returns:
        Response: イベント履歴レスポンス
    """
    try:
        logger.info(
            f"セッションイベント履歴取得開始 - ユーザー: {user_info['uid']}, セッション: {session_id}"
        )

        # セッションIDの検証
        if not session_id or not session_id.strip():
            logger.error("無効なセッションID: 空またはNull")
            events_response = SessionEventListResponse(
                success=False, error="Invalid session ID: empty or null"
            )
            return Response(
                events_response.model_dump_json(),
                status=400,
                headers={**base_headers, "Content-Type": "application/json"},
            )

        if use_adk:
            # ADKモード：InMemorySessionServiceを使用
            try:
                logger.info(f"ADKモードでセッションイベント取得: {session_id}")
                # ADKではセッションイベント履歴機能は制限されているため、空のリストを返す
                events_response = SessionEventListResponse(
                    success=True, events=[], nextPageToken=None
                )
                return Response(
                    events_response.model_dump_json(),
                    status=200,
                    headers={**base_headers, "Content-Type": "application/json"},
                )
            except Exception as e:
                logger.error(f"ADKセッションイベント取得エラー: {e}")
                events_response = SessionEventListResponse(
                    success=False,
                    error=f"ADK session events retrieval failed: {e!s}",
                )
                return Response(
                    events_response.model_dump_json(),
                    status=500,
                    headers={**base_headers, "Content-Type": "application/json"},
                )

        # Vertex AI APIモード（既存の実装）
        # 認証トークンの取得
        access_token = get_access_token(config)
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        # セッションIDから完全なリソース名を構築
        if session_id.startswith("projects/"):
            # 既に完全なリソース名の場合はそのまま使用
            full_session_name = session_id
        else:
            # 数値またはUUID形式のセッションID -> 完全なリソース名に変換
            full_session_name = f"projects/{config.project_id}/locations/{config.location}/reasoningEngines/{config.reasoning_engine_id}/sessions/{session_id}"

        session_url = f"https://{config.location}-aiplatform.googleapis.com/v1beta1/{full_session_name}"
        logger.info(f"セッション存在確認URL: {session_url}")
        logger.info(f"使用するセッションリソース名: {full_session_name}")

        with httpx.Client() as client:
            # セッション詳細を取得してセッションが存在するかを確認
            session_response = client.get(
                session_url,
                headers=headers,
                timeout=30.0,
            )

            logger.info(f"セッション存在確認レスポンス: {session_response.status_code}")

            if session_response.status_code != 200:
                logger.error(
                    f"セッションが存在しません: {session_id} - {session_response.status_code}: {session_response.text}"
                )
                events_response = SessionEventListResponse(
                    success=False,
                    error=f"Session not found: {session_id} - {session_response.status_code}",
                )
                return Response(
                    events_response.model_dump_json(),
                    status=404,
                    headers={**base_headers, "Content-Type": "application/json"},
                )
        
        # カレントユーザーのセッションでなければ404エラーにする
        if session_response.json().get("userId") != user_info["uid"]:
            logger.error(
                f"セッションの所有者が異なります: {session_id} - ユーザー: {user_info['uid']}"
            )

            events_response = SessionEventListResponse(
                success=False,
                error=f"Session not found: {session_id}",
            )
            return Response(
                events_response.model_dump_json(),
                status=404,
                headers={**base_headers, "Content-Type": "application/json"},
            )   

        events_url = f"https://{config.location}-aiplatform.googleapis.com/v1beta1/{full_session_name}/events"
        logger.info(f"Session Events API URL: {events_url}")
        logger.info(f"Session Events API Headers: {headers}")

        with httpx.Client() as client:
            response = client.get(
                events_url,
                headers=headers,
                timeout=30.0,
            )

            logger.info(f"Session Events API レスポンス: {response.status_code}")
            logger.info(f"Session Events API レスポンス詳細: {response.text}")

            if response.status_code == 200:
                events_data = response.json()
                # Vertex AI Sessions APIは 'sessionEvents' キーでイベントを返す
                events_list = events_data.get("sessionEvents", [])
                event_count = len(events_list)
                logger.info(f"セッションイベント取得成功: {event_count}件")

                # Vertex AI APIレスポンスを適切にパースしてから返却
                try:
                    # VertexAIEventsListResponseで構造をバリデーション
                    vertex_response = VertexAIEventsListResponse(**events_data)

                    events_response = SessionEventListResponse(
                        success=True,
                        events=vertex_response.sessionEvents,
                        nextPageToken=vertex_response.nextPageToken,
                    )
                except Exception as parse_error:
                    logger.error(f"Events レスポンス解析エラー: {parse_error}")
                    events_response = SessionEventListResponse(
                        success=False,
                        error=f"レスポンスの解析に失敗しました: {parse_error}",
                    )

                return Response(
                    events_response.model_dump_json(),
                    status=200,
                    headers={**base_headers, "Content-Type": "application/json"},
                )
            else:
                error_text = response.text
                logger.error(
                    f"Session Events API エラー: {response.status_code} - {error_text}"
                )

                events_response = SessionEventListResponse(
                    success=False,
                    error=f"Failed to list session events: {response.status_code} - {error_text}",
                )

                return Response(
                    events_response.model_dump_json(),
                    status=response.status_code,
                    headers={**base_headers, "Content-Type": "application/json"},
                )

    except httpx.RequestError as e:
        logger.error(f"セッションイベント取得リクエストエラー: {e}")
        events_response = SessionEventListResponse(
            success=False, error=f"Request error: {e!s}"
        )
        return Response(
            events_response.model_dump_json(),
            status=500,
            headers={**base_headers, "Content-Type": "application/json"},
        )
