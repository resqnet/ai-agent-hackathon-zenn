"""
環境に応じたチャットハンドラーを生成するファクトリー
"""

from environment_config import EnvironmentConfig

from .base import ChatHandler
from .local import LocalChatHandler
from .remote import RemoteChatHandler


class ChatHandlerFactory:
    """環境に応じたチャットハンドラーを生成するファクトリー"""

    @staticmethod
    def create_handler(config: EnvironmentConfig) -> ChatHandler:
        """
        環境設定に基づいてチャットハンドラーを作成

        Args:
            config: 環境設定オブジェクト

        Returns:
            ChatHandler: 環境に適したチャットハンドラー
        """
        if config.is_local_adk:
            return LocalChatHandler(config)
        else:
            return RemoteChatHandler(config)
