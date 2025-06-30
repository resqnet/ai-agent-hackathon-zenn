# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""
マルチターン対話対応Kids Food Advisorエージェント

【重要な変更】
従来のSequential/ParallelAgent構成から、AgentToolを活用した
LlmAgentベースのマルチターン対話対応エージェントへの抜本的変更。

【主な機能】
1. 継続的な対話セッション対応
2. 会話履歴を活用した個別サポート
3. 必要時のみ専門エージェント実行
4. 温かく親しみやすい対話

【新アーキテクチャの利点】
- 過去の相談内容を記憶した継続的サポート
- 効率的なツール選択による高速応答
- Agent Engine APIでの本格的なセッション管理
- 保護者に寄り添う親身な対話体験

【使用方法】
# 新しいマルチターンエージェント（推奨）
agent = get_multi_turn_agent()
# Agent Engine API経由での使用を推奨

# 後方互換性維持（非推奨）
result = analyze_child_nutrition("2歳の息子の夕食について相談です...")
"""

import os
import uuid

import google.auth
from google.adk.agents import LlmAgent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.genai import types

# 新しいマルチターンエージェントをインポート
from app.agents.unified_nutrition_agent import create_unified_nutrition_agent

_, project_id = google.auth.default()
os.environ.setdefault("GOOGLE_CLOUD_PROJECT", project_id)
os.environ.setdefault("GOOGLE_CLOUD_LOCATION", "global")
os.environ.setdefault("GOOGLE_GENAI_USE_VERTEXAI", "True")

root_agent = create_unified_nutrition_agent()

# ===================================
# 使用例とテスト用コード
# ===================================

if __name__ == "__main__":
    print("\n=== マルチターン対話対応Kids Food Advisorシステム テスト ===")

    # 使用例1: 基本的な栄養相談
    sample_message = """
    2歳の息子について相談です。
    最近の食事は以下の通りです：
    朝食：パン、バナナ、牛乳
    昼食：ご飯、鶏肉、ブロッコリー
    夕食：うどん、卵、人参
    おやつ：りんご
    
    夕食のメニューを改善したいと思っています。
    """

    print("入力例:", sample_message[:50] + "...")
    print("（実際の実行には Agent Engine API を使用してください）")

    print("\n✅ マルチターンエージェントシステムが正常に初期化されました")
    print("📋 新アーキテクチャの特徴:")
    print("  - 継続的な対話セッション対応")
    print("  - 会話履歴を活用した個別サポート")
    print("  - 必要時のみ専門エージェント実行（AgentTool）")
    print("  - Agent Engine APIでの本格的なセッション管理")
    print("  - 温かく親しみやすい対話体験")

    print("\n🔄 移行ガイド:")
    print("  - 新しい実装: get_multi_turn_agent() + Agent Engine API")
    print("  - 互換性維持: analyze_child_nutrition() (非推奨)")

else:
    # モジュールとしてインポートされた場合
    print("📋 マルチターン対話Kids Food Advisorシステムが初期化されました")
