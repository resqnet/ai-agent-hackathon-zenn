"""
Vertex AI統合栄養分析ツール

Vertex AI Searchを活用したRAGベースの栄養分析機能
"""

from typing import Any

import google.auth
from google.adk.tools import VertexAiSearchTool

_, project_id = google.auth.default()


class VertexNutritionAnalyzer:
    """Vertex AI Search統合栄養分析クラス"""

    def __init__(self):
        """初期化"""
        self.search_tool = VertexAiSearchTool(
            data_store_id=f"projects/{project_id}/locations/global/collections/default_collection/dataStores/kids-food-advisor-nutrition-datastore"
        )

    def analyze_meal_nutrition(
        self,
        breakfast: str,
        lunch: str = "",
        age_group: str = "1-2歳",
        allergens: list[str] | None = None,
        special_notes: str = "",
    ) -> dict[str, Any]:
        """
        Vertex AI Searchを使用した栄養分析

        Args:
            breakfast: 朝食内容
            lunch: 昼食内容
            age_group: 年齢グループ
            allergens: アレルギー情報
            special_notes: 特別な事情

        Returns:
            栄養分析結果の辞書
        """
        if allergens is None:
            allergens = []

        try:
            # 検索クエリの構築
            search_queries = self._build_search_queries(
                breakfast, lunch, age_group, allergens
            )

            # 栄養知識ベースから情報検索
            nutrition_knowledge = {}
            for query_type, query in search_queries.items():
                result = self.search_tool.run(query)
                nutrition_knowledge[query_type] = result

            # 分析結果の統合
            analysis_result = self._integrate_analysis_results(
                nutrition_knowledge,
                breakfast,
                lunch,
                age_group,
                allergens,
                special_notes,
            )

            return analysis_result

        except Exception as e:
            return {
                "error": f"Vertex AI栄養分析中にエラーが発生しました: {e!s}",
                "nutrition_score": 0,
                "recommendations": [],
                "missing_nutrients": [],
            }

    def _build_search_queries(
        self, breakfast: str, lunch: str, age_group: str, allergens: list[str]
    ) -> dict[str, str]:
        """検索クエリを構築"""
        queries = {}

        # 基本栄養バランス検索
        queries["nutrition_balance"] = (
            f"{age_group} 栄養バランス 1日必要量 たんぱく質 カルシウム 鉄分"
        )

        # 食材別栄養価検索
        food_items = self._extract_food_items(breakfast, lunch)
        if food_items:
            queries["food_nutrition"] = (
                f"{' '.join(food_items[:5])} 栄養価 100g カロリー"
            )

        # アレルギー対応検索
        if allergens:
            queries["allergy_info"] = (
                f"{' '.join(allergens)} アレルギー 代替食品 除去食"
            )

        # 年齢別注意事項検索
        queries["age_specific"] = f"{age_group} 食事 注意点 発達段階 咀嚼力"

        # 栄養不足対策検索
        queries["deficiency_prevention"] = (
            f"{age_group} 鉄分不足 カルシウム不足 予防 食材"
        )

        return queries

    def _extract_food_items(self, breakfast: str, lunch: str) -> list[str]:
        """食事内容から食材を抽出"""
        food_items = []

        # 改行や句読点で分割
        for meal in [breakfast, lunch]:
            if meal:
                items = meal.replace("\n", ",").replace("、", ",").split(",")
                food_items.extend([item.strip() for item in items if item.strip()])

        return food_items

    def _integrate_analysis_results(
        self,
        nutrition_knowledge: dict[str, Any],
        breakfast: str,
        lunch: str,
        age_group: str,
        allergens: list[str],
        special_notes: str,
    ) -> dict[str, Any]:
        """分析結果を統合"""

        # 基本スコア計算（簡略化）
        nutrition_score = self._calculate_basic_score(breakfast, lunch)

        # 不足栄養素の特定
        missing_nutrients = self._identify_missing_nutrients(
            nutrition_knowledge, breakfast, lunch, age_group
        )

        # 推奨事項の生成
        recommendations = self._generate_recommendations(
            nutrition_knowledge, missing_nutrients, allergens, age_group
        )

        # アレルギー警告の生成
        allergy_warnings = self._generate_allergy_warnings(
            breakfast, lunch, allergens, nutrition_knowledge
        )

        return {
            "nutrition_score": nutrition_score,
            "missing_nutrients": missing_nutrients,
            "recommendations": recommendations,
            "allergy_warnings": allergy_warnings,
            "detailed_analysis": nutrition_knowledge,
            "meal_summary": {
                "breakfast": breakfast,
                "lunch": lunch,
                "age_group": age_group,
                "allergens": allergens,
                "special_notes": special_notes,
            },
        }

    def _calculate_basic_score(self, breakfast: str, lunch: str) -> int:
        """基本的な栄養スコアを計算（簡略化）"""
        score = 60  # ベーススコア

        # 食事内容の評価
        food_items = self._extract_food_items(breakfast, lunch)

        # 多様性スコア
        if len(food_items) >= 5:
            score += 15
        elif len(food_items) >= 3:
            score += 10

        # 栄養素カテゴリーのチェック
        categories = {
            "protein": [
                "肉",
                "魚",
                "卵",
                "豆腐",
                "納豆",
                "鶏",
                "豚",
                "牛",
                "鮭",
                "まぐろ",
            ],
            "vegetables": [
                "野菜",
                "ブロッコリー",
                "にんじん",
                "ほうれん草",
                "小松菜",
                "トマト",
            ],
            "dairy": ["牛乳", "ヨーグルト", "チーズ", "乳"],
            "grains": ["ご飯", "パン", "うどん", "そうめん", "米"],
        }

        for category, keywords in categories.items():
            if any(keyword in breakfast + lunch for keyword in keywords):
                score += 5

        return min(score, 100)

    def _identify_missing_nutrients(
        self,
        nutrition_knowledge: dict[str, Any],
        breakfast: str,
        lunch: str,
        age_group: str,
    ) -> list[str]:
        """不足栄養素を特定"""
        missing = []

        # 簡略化された不足栄養素判定
        meals_text = breakfast + lunch

        # たんぱく質源のチェック
        protein_sources = ["肉", "魚", "卵", "豆腐", "納豆"]
        if not any(source in meals_text for source in protein_sources):
            missing.append("たんぱく質")

        # カルシウム源のチェック
        calcium_sources = ["牛乳", "ヨーグルト", "チーズ", "小魚", "小松菜"]
        if not any(source in meals_text for source in calcium_sources):
            missing.append("カルシウム")

        # 鉄分源のチェック
        iron_sources = ["肉", "魚", "ほうれん草", "小松菜", "レバー"]
        if not any(source in meals_text for source in iron_sources):
            missing.append("鉄分")

        # ビタミンC源のチェック
        vitamin_c_sources = [
            "野菜",
            "果物",
            "ブロッコリー",
            "トマト",
            "いちご",
            "みかん",
        ]
        if not any(source in meals_text for source in vitamin_c_sources):
            missing.append("ビタミンC")

        return missing

    def _generate_recommendations(
        self,
        nutrition_knowledge: dict[str, Any],
        missing_nutrients: list[str],
        allergens: list[str],
        age_group: str,
    ) -> list[str]:
        """推奨事項を生成"""
        recommendations = []

        # 不足栄養素に基づく推奨
        nutrient_recommendations = {
            "たんぱく質": "夕食には鶏ささみや豆腐を使った料理を取り入れてみてはいかがでしょうか",
            "カルシウム": "牛乳やヨーグルト、小松菜を使った料理でカルシウムを補いましょう",
            "鉄分": "鉄分豊富な赤身肉や緑黄色野菜を組み合わせた料理がおすすめです",
            "ビタミンC": "ブロッコリーやトマトなどの野菜で ビタミンCを摂取しましょう",
        }

        for nutrient in missing_nutrients:
            if nutrient in nutrient_recommendations:
                recommendations.append(nutrient_recommendations[nutrient])

        # アレルギー配慮の推奨
        if "卵" in allergens:
            recommendations.append("卵の代わりに豆腐や魚でたんぱく質を補給しましょう")
        if "乳" in allergens:
            recommendations.append(
                "乳製品の代わりに小魚や緑黄色野菜でカルシウムを摂取しましょう"
            )

        # 年齢別推奨
        if age_group == "1-2歳":
            recommendations.append(
                "食材は小さくカットし、柔らかく調理することを心がけましょう"
            )
        elif age_group == "3歳":
            recommendations.append("少しずつ大人と同じような食事に近づけていきましょう")

        return recommendations

    def _generate_allergy_warnings(
        self,
        breakfast: str,
        lunch: str,
        allergens: list[str],
        nutrition_knowledge: dict[str, Any],
    ) -> list[str]:
        """アレルギー警告を生成"""
        warnings = []
        meals_text = breakfast + lunch

        # アレルゲンが含まれている可能性のチェック
        allergen_keywords = {
            "卵": ["卵", "たまご", "玉子"],
            "乳": ["牛乳", "ヨーグルト", "チーズ", "乳"],
            "小麦": ["パン", "うどん", "そうめん", "麺"],
            "大豆": ["豆腐", "納豆", "味噌"],
            "魚": ["魚", "鮭", "まぐろ", "さば"],
        }

        for allergen in allergens:
            if allergen in allergen_keywords:
                keywords = allergen_keywords[allergen]
                if any(keyword in meals_text for keyword in keywords):
                    warnings.append(
                        f"{allergen}アレルギーの確認が必要な食材が含まれている可能性があります"
                    )

        return warnings


def analyze_with_vertex_ai(
    breakfast: str,
    lunch: str = "",
    age_group: str = "1-2歳",
    allergens: list[str] | None = None,
    special_notes: str = "",
) -> str:
    """
    Vertex AI統合栄養分析の便利関数

    Returns:
        フォーマットされた分析結果文字列
    """
    analyzer = VertexNutritionAnalyzer()
    result = analyzer.analyze_meal_nutrition(
        breakfast, lunch, age_group, allergens or [], special_notes
    )

    if "error" in result:
        return result["error"]

    # 結果のフォーマット
    output_parts = [
        f"🔍 **Vertex AI栄養分析結果** (スコア: {result['nutrition_score']}/100)",
        "",
    ]

    # 推奨事項
    if result["recommendations"]:
        output_parts.extend(
            [
                "**📋 栄養改善の提案**",
                *[f"• {rec}" for rec in result["recommendations"]],
                "",
            ]
        )

    # 不足栄養素
    if result["missing_nutrients"]:
        output_parts.extend(
            [
                "**⚠️ 補強が推奨される栄養素**",
                f"• {', '.join(result['missing_nutrients'])}",
                "",
            ]
        )

    # アレルギー警告
    if result["allergy_warnings"]:
        output_parts.extend(
            [
                "**🚨 アレルギー注意事項**",
                *[f"• {warning}" for warning in result["allergy_warnings"]],
                "",
            ]
        )

    return "\n".join(output_parts)
