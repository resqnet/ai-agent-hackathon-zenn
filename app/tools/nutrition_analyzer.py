"""
栄養分析ツール
"""

from typing import Any

from app.data.foods import check_allergens
from app.data.nutrition import analyze_meal_balance, get_nutrition_advice


def analyze_daily_nutrition(
    breakfast: str,
    lunch: str,
    allergens: list[str] | None = None,
    age_group: str = "1-2歳",
) -> str:
    """
    1日の栄養バランスを分析して専門的なアドバイスを提供

    Args:
        breakfast: 朝食の内容
        lunch: 昼食の内容
        allergens: アレルギー情報のリスト
        age_group: 年齢グループ

    Returns:
        栄養分析結果とアドバイス
    """
    try:
        # 栄養分析
        analysis = analyze_meal_balance(breakfast, lunch, age_group)

        # 基本的なアドバイス生成
        advice = get_nutrition_advice(analysis)

        # アレルギーチェック
        allergen_warnings = []
        if allergens:
            # 食事から食品を抽出してアレルギーチェック
            from app.data.nutrition import parse_meal_input

            all_foods = []
            breakfast_foods = parse_meal_input(breakfast)
            lunch_foods = parse_meal_input(lunch)

            for food_name, _ in breakfast_foods + lunch_foods:
                all_foods.append(food_name)

            allergen_warnings = check_allergens(all_foods, allergens)

        # 結果をまとめる
        result_parts = [
            f"**🍽️ 栄養バランス分析結果 (バランススコア: {analysis.balance_score:.0f}%)**",
            "",
            advice,
        ]

        # カロリーと主要栄養素の情報
        result_parts.extend(
            [
                "",
                "**📊 栄養素達成状況**",
                f"• カロリー: {analysis.total_nutrition['calories']:.0f}kcal ({analysis.achievement_rate['calories']:.0f}%)",
                f"• たんぱく質: {analysis.total_nutrition['protein']:.1f}g ({analysis.achievement_rate['protein']:.0f}%)",
                f"• カルシウム: {analysis.total_nutrition['calcium']:.0f}mg ({analysis.achievement_rate['calcium']:.0f}%)",
                f"• 鉄分: {analysis.total_nutrition['iron']:.1f}mg ({analysis.achievement_rate['iron']:.0f}%)",
            ]
        )

        # アレルギー警告
        if allergen_warnings:
            result_parts.extend(
                [
                    "",
                    "**⚠️ アレルギー注意**",
                    *[f"• {warning}" for warning in allergen_warnings],
                ]
            )

        return "\n".join(result_parts)

    except Exception as e:
        return f"栄養分析中にエラーが発生しました: {e!s}"


def get_nutrition_summary(
    breakfast: str, lunch: str, age_group: str = "1-2歳"
) -> dict[str, Any]:
    """
    栄養サマリーを取得（内部処理用）

    Args:
        breakfast: 朝食の内容
        lunch: 昼食の内容
        age_group: 年齢グループ

    Returns:
        栄養分析の詳細データ
    """
    analysis = analyze_meal_balance(breakfast, lunch, age_group)

    return {
        "balance_score": analysis.balance_score,
        "total_nutrition": analysis.total_nutrition,
        "achievement_rate": analysis.achievement_rate,
        "missing_nutrients": analysis.missing_nutrients,
        "excess_nutrients": analysis.excess_nutrients,
    }
