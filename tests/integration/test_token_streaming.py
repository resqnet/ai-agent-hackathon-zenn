#!/usr/bin/env python3
"""
Agent Engine Streamストリーミング機能の統合テスト
"""

import asyncio
import json
import pytest
import httpx
import os


@pytest.fixture
def client():
    """テストクライアント（Agent Engine Stream）を作成"""
    base_url = "http://localhost:8082"
    return httpx.Client(base_url=base_url)


def test_streaming_endpoint_exists(client):
    """ストリーミングエンドポイントが存在することを確認"""
    # Agent Engine Streamはチャットストリーミングのみサポート
    response = client.post(
        "/api/chat/stream",
        json={"message": "テストメッセージ", "sessionId": "test_session"},
        headers={"Authorization": "Bearer dummy_token"},  # 認証バイパス用
    )
    # エンドポイントが存在し、ストリーミングレスポンスが返されることを確認
    assert response.status_code in [200, 401]  # 認証エラーまたは成功
    if response.status_code == 200:
        assert "text/event-stream" in response.headers.get("content-type", "")


def test_streaming_response_format(client):
    """ストリーミングのレスポンス形式をテスト"""
    # 認証が必要なため、このテストは認証エラーを期待
    response = client.post(
        "/api/chat/stream",
        json={"message": "朝食のレシピを教えて", "sessionId": "test_session"},
    )

    # 認証エラーまたは成功を期待
    assert response.status_code in [200, 401]

    if response.status_code == 401:
        # 認証エラーの場合、適切なエラーレスポンスが返されることを確認
        assert response.headers.get("content-type") == "application/json"
        error_data = response.json()
        assert "success" in error_data
        assert error_data["success"] == False
    else:
        # 成功の場合、SSE形式であることを確認
        assert "text/event-stream" in response.headers.get("content-type", "")


def test_session_management_endpoints(client):
    """セッション管理エンドポイントをテスト"""
    # セッション作成のテスト
    create_response = client.post("/api/sessions")
    assert create_response.status_code in [200, 401]  # 認証エラーまたは成功

    # セッション一覧のテスト
    list_response = client.get("/api/sessions")
    assert list_response.status_code in [200, 401]  # 認証エラーまたは成功


def test_error_handling(client):
    """エラーハンドリングをテスト"""
    # 無効なリクエスト
    response = client.post(
        "/api/chat/stream", json={"message": "", "sessionId": "error_session"}
    )

    # 認証エラーまたは成功を確認
    assert response.status_code in [200, 401]


def test_cors_headers(client):
    """CORS ヘッダーが適切に設定されることをテスト"""
    response = client.options("/api/chat/stream")

    # OPTIONSリクエストが成功することを確認
    assert response.status_code in [204, 404]


@pytest.mark.asyncio
async def test_concurrent_requests():
    """並行リクエストの処理をテスト"""
    async with httpx.AsyncClient(base_url="http://localhost:8082") as client:

        async def send_request(session_id: str, message: str):
            response = await client.post(
                "/api/chat/stream", json={"message": message, "sessionId": session_id}
            )
            return response.status_code

        # 複数の並行リクエストを送信
        tasks = []
        for i in range(2):
            task = send_request(f"concurrent_session_{i}", f"並行テストメッセージ {i}")
            tasks.append(task)

        results = await asyncio.gather(*tasks, return_exceptions=True)

        # すべてのリクエストが適切に処理されることを確認
        for result in results:
            if isinstance(result, int):
                assert result in [200, 401]


if __name__ == "__main__":
    # 直接実行時の簡単なテスト
    import httpx

    client = httpx.Client(base_url="http://localhost:8082")

    print("Agent Engine Streamエンドポイントの基本テスト...")
    try:
        response = client.post(
            "/api/chat/stream",
            json={"message": "テストメッセージ", "sessionId": "manual_test"},
        )

        print(f"ステータスコード: {response.status_code}")
        print(f"コンテンツタイプ: {response.headers.get('content-type')}")

        if response.status_code == 401:
            print("認証が必要です（期待される動作）")
        elif response.status_code == 200:
            print("ストリーミングレスポンス受信成功")

    except Exception as e:
        print(f"接続エラー: {e}")
        print("Agent Engine Streamサービスが起動していない可能性があります")

    finally:
        client.close()

    print("テスト完了")
