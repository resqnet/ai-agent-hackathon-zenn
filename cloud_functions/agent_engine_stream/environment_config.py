#!/usr/bin/env python3
"""
環境設定クラス - Local/Staging環境の設定を分離

Local環境: ADKローカル実行
Staging環境: Vertex AI Agent Engine接続
本番環境: Vertex AI Agent Engine接続
"""

import os
from abc import ABC, abstractmethod
from typing import Any

from google.auth import default


class EnvironmentConfig(ABC):
    """環境設定の基底クラス"""

    def __init__(self):
        # 共通設定の初期化
        self.project_id = os.environ.get(
            "GOOGLE_CLOUD_PROJECT", "my-staging-project-id"
        )
        self.location = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
        self.reasoning_engine_id = os.environ.get(
            "REASONING_ENGINE_ID", "123456789"
        )

        # 認証情報の取得
        self.credentials, _ = default()

    @property
    @abstractmethod
    def environment_name(self) -> str:
        """環境名を返す"""
        pass

    @property
    @abstractmethod
    def is_local_adk(self) -> bool:
        """ADKローカル実行環境かどうか"""
        pass

    @property
    @abstractmethod
    def chat_handler_type(self) -> str:
        """使用するチャットハンドラーのタイプ"""
        pass

    def get_cors_origins(self) -> list[str]:
        """CORS許可オリジンリストを取得"""
        return [
            "http://localhost:3002",  # Next.js開発環境
            "http://localhost:3003",  # 現在使用中のポート
            "http://localhost:3000",  # Next.js標準ポート
            "http://localhost:8080",  # backend_server開発環境
            "https://xxxxxxxxxxx.us-central1.run.app",  # 本番フロントエンド
        ]

    def get_vertex_ai_urls(self) -> dict[str, str]:
        """Vertex AI関連のURL設定を取得"""
        return {
            "agent_engine_url": f"https://{self.location}-aiplatform.googleapis.com/v1/projects/{self.project_id}/locations/{self.location}/reasoningEngines/{self.reasoning_engine_id}:streamQuery",
            "sessions_base_url": f"https://{self.location}-aiplatform.googleapis.com/v1beta1/projects/{self.project_id}/locations/{self.location}/reasoningEngines/{self.reasoning_engine_id}/sessions",
            "operations_base_url": f"https://{self.location}-aiplatform.googleapis.com/v1beta1",
        }


class LocalConfig(EnvironmentConfig):
    """Local環境設定（ADK使用）"""

    @property
    def environment_name(self) -> str:
        return "Local (ADK)"

    @property
    def is_local_adk(self) -> bool:
        return True

    @property
    def chat_handler_type(self) -> str:
        return "local"

    def get_adk_config(self) -> dict[str, Any]:
        """ADK固有の設定を取得"""
        return {
            "session_service_type": "InMemorySessionService",
            "runner_config": {
                "streaming_mode_supported": True,
                "local_execution": True,
            },
        }


class StagingConfig(EnvironmentConfig):
    """Staging環境設定（Vertex AI Agent Engine使用）"""

    @property
    def environment_name(self) -> str:
        return "Staging (Vertex AI Agent Engine)"

    @property
    def is_local_adk(self) -> bool:
        return False

    @property
    def chat_handler_type(self) -> str:
        return "remote"

    def get_vertex_ai_config(self) -> dict[str, Any]:
        """Vertex AI固有の設定を取得"""
        return {
            "request_timeout": 60.0,
            "streaming_enabled": True,
            "session_management": "remote",
            "operation_polling": {
                "max_wait_seconds": 30,
                "poll_interval": 1.5,
            },
        }


class ProductionConfig(StagingConfig):
    """本番環境設定（Staging環境と基本同じ）"""

    @property
    def environment_name(self) -> str:
        return "Production (Vertex AI Agent Engine)"

    def get_vertex_ai_config(self) -> dict[str, Any]:
        """本番環境向けの設定（より厳格なタイムアウト等）"""
        config = super().get_vertex_ai_config()
        config.update(
            {
                "request_timeout": 30.0,  # 本番環境ではより短いタイムアウト
                "operation_polling": {
                    "max_wait_seconds": 20,  # より短い待機時間
                    "poll_interval": 1.0,
                },
            }
        )
        return config


def create_environment_config() -> EnvironmentConfig:
    """
    環境変数に基づいて適切な環境設定を作成

    Returns:
        EnvironmentConfig: 環境に応じた設定オブジェクト
    """
    development_mode = os.environ.get("DEVELOPMENT_MODE", "vertex_ai").lower()

    if development_mode == "adk":
        return LocalConfig()
    elif development_mode == "vertex_ai":
        # 本番環境の判定（例：特定の環境変数やProject IDで判定）
        if os.environ.get("ENVIRONMENT") == "production":
            return ProductionConfig()
        else:
            return StagingConfig()
    else:
        # デフォルトはStaging環境
        return StagingConfig()


def get_access_token(config: EnvironmentConfig) -> str:
    """
    Google Cloud認証トークンを取得

    Args:
        config: 環境設定オブジェクト

    Returns:
        str: 認証トークン
    """
    from google.auth.transport.requests import Request as GoogleRequest

    if not config.credentials.valid:
        config.credentials.refresh(GoogleRequest())
    return config.credentials.token
