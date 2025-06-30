"""app/vertex_ai_agent.pyのユニットテスト"""

import pytest

from app.vertex_ai_agent import root_agent


class TestVertexAgent:
    """Vertex AIエージェントのテスト"""

    def test_root_agent_basic(self):
        """基本的なルートエージェントのテスト"""
        assert root_agent is not None
        assert hasattr(root_agent, "name")
        # 新アーキテクチャ: マルチターンエージェント
        assert root_agent.name == "KidsFoodAdvisor"

    def test_root_agent_properties(self):
        """ルートエージェントのプロパティテスト"""
        # 新アーキテクチャ: LlmAgentベースでtoolsプロパティを持つ
        assert hasattr(root_agent, "tools")
        assert isinstance(root_agent.tools, list)
        # VertexAiSearchToolが1つ含まれている
        assert len(root_agent.tools) == 1

    def test_root_agent_has_required_methods(self):
        """エージェントが必要なメソッドを持っているかのテスト"""
        # 基本的なメソッドが存在することを確認
        assert hasattr(root_agent, "run_async") or hasattr(root_agent, "run")


class TestAgentStructure:
    """エージェント構造のテスト"""

    def test_agent_tools_structure(self):
        """エージェントツールの構造テスト"""
        # 新アーキテクチャ: toolsプロパティをテスト
        assert hasattr(root_agent, "tools")
        assert isinstance(root_agent.tools, list)
        # VertexAiSearchToolが含まれている
        assert len(root_agent.tools) == 1
        # VertexAiSearchToolの場合は__class__.__name__属性でチェック
        tool = root_agent.tools[0]
        if hasattr(tool, "__class__"):
            assert tool.__class__.__name__ == "VertexAiSearchTool"

    def test_agent_name_consistency(self):
        """エージェント名の一貫性テスト"""
        assert root_agent.name == "KidsFoodAdvisor"


class TestAgentConfiguration:
    """エージェント設定のテスト"""

    def test_agent_creation_without_errors(self):
        """エラーなしでのエージェント確認テスト"""
        try:
            assert root_agent is not None
            assert root_agent.name == "KidsFoodAdvisor"
            # マルチターン対話用プロパティを確認
            assert hasattr(root_agent, "include_contents")
            assert root_agent.include_contents == "default"
        except Exception as e:
            pytest.fail(f"エージェント確認中にエラーが発生しました: {e}")

    def test_agent_tools_accessibility(self):
        """エージェントツールのアクセス可能性テスト"""
        tools = root_agent.tools
        assert isinstance(tools, list)
        # VertexAiSearchToolが正常にアクセス可能
        assert len(tools) == 1
        vertex_search_tool = tools[0]
        # VertexAiSearchToolの場合は__class__と必要な属性でチェック
        assert hasattr(vertex_search_tool, "__class__")
        assert vertex_search_tool.__class__.__name__ == "VertexAiSearchTool"
