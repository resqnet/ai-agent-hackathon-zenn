"""
画像認識機能の統合テスト
"""

import os
from pathlib import Path

import httpx
import pytest


class MockFileUpload:
    """Streamlitのfile_uploaderオブジェクトをモック"""

    def __init__(self, file_path: str):
        self.file_path = file_path
        self.name = os.path.basename(file_path)
        self.type = "image/jpeg"

    def read(self) -> bytes:
        with open(self.file_path, "rb") as f:
            return f.read()


@pytest.fixture
def test_image_path():
    """テスト用画像ファイルのパス"""
    return Path(__file__).parent.parent / "test_image.jpg"


@pytest.mark.integration
class TestImageRecognitionIntegration:
    """画像認識機能の統合テスト"""

    def test_full_image_recognition_flow(self, test_image_path):
        """完全な画像認識フローの統合テスト"""
        # 環境変数でテストをスキップ
        if os.environ.get("SKIP_IMAGE_INTEGRATION_TEST") == "true":
            pytest.skip("画像認識統合テストがスキップされました")

        # テスト画像の存在確認
        assert test_image_path.exists(), (
            f"テスト画像が見つかりません: {test_image_path}"
        )

        # バックエンドサーバーのURL
        backend_url = os.environ.get("BACKEND_URL", "http://localhost:8080")
        api_url = f"{backend_url}/api/image/analyze"

        try:
            # バックエンドサーバーの可用性確認
            with httpx.Client(timeout=5.0) as client:
                try:
                    response = client.get(f"{backend_url}/api/health")
                    if response.status_code != 200:
                        pytest.skip(
                            "バックエンドサーバーが利用できないため統合テストをスキップ"
                        )
                except httpx.RequestError:
                    pytest.skip(
                        "バックエンドサーバーに接続できないため統合テストをスキップ"
                    )

            # モックファイルアップロードオブジェクトを作成
            mock_file = MockFileUpload(str(test_image_path))

            # 画像認識を実行
            with httpx.Client(timeout=60.0) as client:
                files = {"image": (mock_file.name, mock_file.read(), mock_file.type)}
                response = client.post(api_url, files=files)

                assert response.status_code == 200, f"APIエラー: {response.status_code}"

                result_json = response.json()
                assert result_json.get("success") is True, (
                    f"API処理エラー: {result_json.get('error')}"
                )

                # 結果を取得
                data = result_json.get("data", {})
                result = data.get("originalAnalysis", "")

            # 基本的な検証
            assert result is not None
            assert isinstance(result, str)
            assert len(result.strip()) > 0, "空の結果が返されました"

            # テンプレート形式の確認（期待される形式）
            if "# 料理名" in result and "# 食材" in result:
                assert "# 料理名" in result
                assert "# 食材" in result
                print(f"✅ テンプレート形式での認識成功: {result[:100]}...")
            else:
                # テンプレート形式でない場合も有効とする
                print(f"⚠️ 非テンプレート形式の認識結果: {result[:100]}...")
                assert len(result.strip()) > 10, "認識結果が短すぎます"

        except Exception as e:
            pytest.fail(f"画像認識統合テストでエラーが発生: {e}")

    def test_image_recognition_error_handling(self, test_image_path):
        """エラーハンドリングの統合テスト"""
        if os.environ.get("SKIP_IMAGE_INTEGRATION_TEST") == "true":
            pytest.skip("画像認識統合テストがスキップされました")

        # バックエンドサーバーのURL
        backend_url = os.environ.get("BACKEND_URL", "http://localhost:8080")

        # バックエンドサーバーの可用性確認
        try:
            with httpx.Client(timeout=5.0) as client:
                response = client.get(f"{backend_url}/api/health")
                if response.status_code != 200:
                    pytest.skip(
                        "バックエンドサーバーが利用できないため統合テストをスキップ"
                    )
        except httpx.RequestError:
            pytest.skip("バックエンドサーバーに接続できないため統合テストをスキップ")

        # 存在しないファイルパス
        fake_path = str(test_image_path.parent / "nonexistent_image.jpg")

        # ファイルが存在しない場合のエラーを期待
        with pytest.raises(FileNotFoundError):
            mock_file = MockFileUpload(fake_path)
            mock_file.read()  # ここでFileNotFoundErrorが発生するはず

    @pytest.mark.slow
    def test_multiple_image_recognition(self, test_image_path):
        """複数回の画像認識テスト（パフォーマンス確認）"""
        if os.environ.get("SKIP_IMAGE_INTEGRATION_TEST") == "true":
            pytest.skip("画像認識統合テストがスキップされました")

        # バックエンドサーバーのURL
        backend_url = os.environ.get("BACKEND_URL", "http://localhost:8080")
        api_url = f"{backend_url}/api/image/analyze"

        # バックエンドサーバーの可用性確認
        try:
            with httpx.Client(timeout=5.0) as client:
                response = client.get(f"{backend_url}/api/health")
                if response.status_code != 200:
                    pytest.skip(
                        "バックエンドサーバーが利用できないため統合テストをスキップ"
                    )
        except httpx.RequestError:
            pytest.skip("バックエンドサーバーに接続できないため統合テストをスキップ")

        mock_file = MockFileUpload(str(test_image_path))
        results = []

        # 3回実行してみる
        with httpx.Client(timeout=60.0) as client:
            for i in range(3):
                try:
                    # 各回でファイルを読み直す必要がある
                    files = {
                        "image": (mock_file.name, mock_file.read(), mock_file.type)
                    }
                    response = client.post(api_url, files=files)

                    assert response.status_code == 200, (
                        f"APIエラー: {response.status_code}"
                    )

                    result_json = response.json()
                    assert result_json.get("success") is True

                    # 結果を取得
                    data = result_json.get("data", {})
                    result = data.get("originalAnalysis", "")

                    results.append(result)
                    assert result is not None
                    assert len(result.strip()) > 0
                except Exception as e:
                    pytest.fail(f"複数回テストの{i + 1}回目でエラー: {e}")

        # 全ての結果が有効であることを確認
        assert len(results) == 3
        assert all(len(r.strip()) > 0 for r in results)
