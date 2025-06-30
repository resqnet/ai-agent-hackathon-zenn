"""
Google Cloud Operations APIのポーリング処理

Vertex AI Agent Engineで非同期操作の完了を待機するためのサービス
"""

import logging
import time
from typing import Any

import httpx

logger = logging.getLogger(__name__)


def poll_operation(
    operation_name: str,
    access_token: str,
    operations_base_url: str,
    max_wait_seconds: int = 30,
    poll_interval: float = 1.5,
) -> dict[str, Any]:
    """
    Operations APIをポーリングしてOperation完了を待機

    Args:
        operation_name: Operationの完全なリソース名
        access_token: 認証トークン
        operations_base_url: Operations APIのベースURL
        max_wait_seconds: 最大待機時間（秒）
        poll_interval: ポーリング間隔（秒）

    Returns:
        Dict: Operation完了時のresponseまたはerrorを含む辞書

    Raises:
        Exception: ポーリングタイムアウトまたはAPIエラー時
    """
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }

    # Operations API URL構築
    # ref: https://cloud.google.com/vertex-ai/generative-ai/docs/reference/rest/v1beta1/projects.locations.operations/get
    operation_url = f"{operations_base_url}/{operation_name}"
    logger.info(f"Operation ポーリング開始: {operation_name}")

    start_time = time.time()
    poll_count = 0

    with httpx.Client() as client:
        while True:
            poll_count += 1
            elapsed_time = time.time() - start_time

            # タイムアウトチェック
            if elapsed_time > max_wait_seconds:
                error_msg = f"Operation polling timeout after {elapsed_time:.1f}s (max: {max_wait_seconds}s), polls: {poll_count}"
                logger.error(error_msg)
                raise Exception(error_msg)

            try:
                # Operations APIでOperationの状態を取得
                response = client.get(operation_url, headers=headers, timeout=10.0)

                if response.status_code == 200:
                    operation_data = response.json()
                    done = operation_data.get("done", False)

                    logger.info(
                        f"Operation ポーリング {poll_count}回目: done={done}, elapsed={elapsed_time:.1f}s"
                    )

                    if done:
                        # Operation完了
                        if "error" in operation_data:
                            # エラーで完了
                            error_info = operation_data["error"]
                            error_msg = f"Operation failed: {error_info.get('message', 'Unknown error')}"
                            logger.error(f"Operation エラー完了: {error_info}")
                            raise Exception(error_msg)
                        elif "response" in operation_data:
                            # 成功で完了
                            logger.info(
                                f"Operation 成功完了: {elapsed_time:.1f}s, polls: {poll_count}"
                            )
                            return operation_data["response"]
                        else:
                            # done=trueだがresponse/errorがない（異常状態）
                            error_msg = f"Operation completed but no response/error found: {operation_data}"
                            logger.error(error_msg)
                            raise Exception(error_msg)
                    else:
                        # まだ処理中、次のポーリングまで待機
                        time.sleep(poll_interval)
                        continue

                else:
                    # Operations API呼び出しエラー
                    error_msg = f"Operations API error: {response.status_code} - {response.text}"
                    logger.error(error_msg)
                    raise Exception(error_msg)

            except httpx.RequestError as e:
                error_msg = f"Operations API request error: {e!s}"
                logger.error(error_msg)
                raise Exception(error_msg)
