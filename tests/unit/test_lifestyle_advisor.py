"""app/agents/unified_nutrition_agent.pyのユニットテスト"""

import pytest

from app.agents.unified_nutrition_agent import (
    create_unified_nutrition_agent,
    unified_nutrition_agent,
)


class TestUnifiedNutritionAgent:
    """統合栄養エージェントのテスト"""

    def test_create_unified_agent_basic(self):
        """基本的なエージェント作成のテスト"""
        agent = create_unified_nutrition_agent()

        assert agent is not None
        assert hasattr(agent, "name")
        assert agent.name == "KidsFoodAdvisor"

    def test_create_unified_agent_properties(self):
        """エージェントのプロパティテスト"""
        agent = create_unified_nutrition_agent()

        # 基本的なプロパティが存在することを確認
        assert hasattr(agent, "model")
        assert hasattr(agent, "instruction")

    def test_agent_has_required_methods(self):
        """エージェントが必要なメソッドを持っているかのテスト"""
        agent = create_unified_nutrition_agent()

        # 基本的なメソッドが存在することを確認
        assert hasattr(agent, "run_async") or hasattr(agent, "run")

    def test_agent_initialization_consistency(self):
        """エージェント初期化の一貫性テスト"""
        agent1 = create_unified_nutrition_agent()
        agent2 = create_unified_nutrition_agent()

        # 両方のエージェントが同じプロパティを持つことを確認
        assert agent1.name == agent2.name
        assert agent1.model == agent2.model


class TestUnifiedNutritionAgentInstance:
    """統合栄養エージェントインスタンスのテスト"""

    def test_unified_nutrition_agent_exists(self):
        """unified_nutrition_agentインスタンスが存在することのテスト"""
        assert unified_nutrition_agent is not None
        assert hasattr(unified_nutrition_agent, "name")
        assert unified_nutrition_agent.name == "KidsFoodAdvisor"

    def test_unified_nutrition_agent_properties(self):
        """unified_nutrition_agentのプロパティテスト"""
        assert hasattr(unified_nutrition_agent, "model")
        assert hasattr(unified_nutrition_agent, "instruction")
        assert hasattr(unified_nutrition_agent, "description")


class TestUnifiedNutritionAgentInstructions:
    """統合栄養エージェントの指示内容のテスト"""

    def test_instruction_exists(self):
        """指示内容が存在することのテスト"""
        agent = create_unified_nutrition_agent()

        assert hasattr(agent, "instruction")
        assert agent.instruction is not None
        assert len(agent.instruction) > 0

    def test_instruction_contains_key_elements(self):
        """指示内容に重要な要素が含まれることのテスト"""
        agent = create_unified_nutrition_agent()
        instruction = agent.instruction

        # 基本的な指示要素が含まれているかを確認
        assert isinstance(instruction, str)
        assert "栄養相談" in instruction
        assert "栄養" in instruction
        assert "食材" in instruction

    def test_instruction_format_requirements(self):
        """指示内容のフォーマット要件のテスト"""
        agent = create_unified_nutrition_agent()
        instruction = agent.instruction

        # フォーマット要件が含まれているかを確認
        assert "PDF" in instruction
        assert "search_nutrition_knowledge" in instruction


class TestUnifiedNutritionAgentConfiguration:
    """統合栄養エージェントの設定テスト"""

    def test_agent_model_configuration(self):
        """エージェントモデル設定のテスト"""
        agent = create_unified_nutrition_agent()

        assert hasattr(agent, "model")
        assert agent.model is not None
        assert agent.model == "gemini-2.0-flash"

    def test_agent_creation_without_errors(self):
        """エラーなしでのエージェント作成テスト"""
        try:
            agent = create_unified_nutrition_agent()
            assert agent is not None
        except Exception as e:
            pytest.fail(f"エージェント作成中にエラーが発生しました: {e}")

    def test_agent_description(self):
        """エージェントの説明テスト"""
        agent = create_unified_nutrition_agent()

        assert hasattr(agent, "description")
        assert agent.description is not None
        assert len(agent.description) > 0

    def test_agent_tools_configuration(self):
        """エージェントツール設定のテスト"""
        agent = create_unified_nutrition_agent()

        assert hasattr(agent, "tools")
        assert agent.tools is not None
        assert len(agent.tools) == 1  # search_nutrition_knowledgeのみ
