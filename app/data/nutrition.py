"""
栄養計算とバランス分析のロジック
"""

from dataclasses import dataclass

from .foods import get_food_by_name


@dataclass
class DailyNutritionTarget:
    """1日の栄養目標値"""

    calories: float  # カロリー (kcal)
    protein: float  # たんぱく質 (g)
    fat: float  # 脂質 (g)
    carbs: float  # 炭水化物 (g)
    fiber: float  # 食物繊維 (g)
    calcium: float  # カルシウム (mg)
    iron: float  # 鉄分 (mg)
    vitamin_c: float  # ビタミンC (mg)


# 年齢別栄養目標値（1日あたり）
NUTRITION_TARGETS = {
    "1-2歳": DailyNutritionTarget(
        calories=950,
        protein=20,
        fat=25,
        carbs=130,
        fiber=8,
        calcium=450,
        iron=4.5,
        vitamin_c=35,
    ),
    "3歳": DailyNutritionTarget(
        calories=1300,
        protein=25,
        fat=35,
        carbs=175,
        fiber=11,
        calcium=600,
        iron=5.5,
        vitamin_c=40,
    ),
}


@dataclass
class MealAnalysis:
    """食事分析結果"""

    total_nutrition: dict[str, float]
    target_nutrition: DailyNutritionTarget
    achievement_rate: dict[str, float]  # 達成率（%）
    missing_nutrients: list[str]  # 不足栄養素
    excess_nutrients: list[str]  # 過剰栄養素
    balance_score: float  # バランススコア（0-100）


def parse_meal_input(meal_text: str) -> list[tuple[str, float]]:
    """食事入力テキストを解析して食品と量のリストを返す"""
    # 簡単な解析ロジック
    foods = []
    lines = meal_text.strip().split("\n")

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # "食品名 量g" または "食品名" の形式を想定
        parts = line.split()
        if len(parts) >= 1:
            food_name = parts[0]
            # 量の推定（デフォルト100g）
            amount = 100.0
            if len(parts) > 1:
                # 数字を抽出
                amount_str = "".join(filter(str.isdigit, parts[1]))
                if amount_str:
                    amount = float(amount_str)

            foods.append((food_name, amount))

    return foods


def calculate_nutrition(foods: list[tuple[str, float]]) -> dict[str, float]:
    """食品リストから栄養素を計算"""
    total_nutrition = {
        "calories": 0.0,
        "protein": 0.0,
        "fat": 0.0,
        "carbs": 0.0,
        "fiber": 0.0,
        "calcium": 0.0,
        "iron": 0.0,
        "vitamin_c": 0.0,
    }

    for food_name, amount in foods:
        food = get_food_by_name(food_name)
        if food:
            # 100gあたりの栄養素 × 実際の量 / 100
            ratio = amount / 100.0
            total_nutrition["calories"] += food.nutrition.calories * ratio
            total_nutrition["protein"] += food.nutrition.protein * ratio
            total_nutrition["fat"] += food.nutrition.fat * ratio
            total_nutrition["carbs"] += food.nutrition.carbs * ratio
            total_nutrition["fiber"] += food.nutrition.fiber * ratio
            total_nutrition["calcium"] += food.nutrition.calcium * ratio
            total_nutrition["iron"] += food.nutrition.iron * ratio
            total_nutrition["vitamin_c"] += food.nutrition.vitamin_c * ratio

    return total_nutrition


def analyze_meal_balance(
    breakfast: str, lunch: str, age_group: str = "1-2歳"
) -> MealAnalysis:
    """食事バランスを分析"""
    # 食事を解析
    breakfast_foods = parse_meal_input(breakfast)
    lunch_foods = parse_meal_input(lunch)

    # 栄養素を計算
    breakfast_nutrition = calculate_nutrition(breakfast_foods)
    lunch_nutrition = calculate_nutrition(lunch_foods)

    # 合計栄養素
    total_nutrition = {}
    for key in breakfast_nutrition:
        total_nutrition[key] = breakfast_nutrition[key] + lunch_nutrition[key]

    # 目標値と比較
    target = NUTRITION_TARGETS.get(age_group, NUTRITION_TARGETS["1-2歳"])

    # 達成率を計算
    achievement_rate = {}
    achievement_rate["calories"] = (total_nutrition["calories"] / target.calories) * 100
    achievement_rate["protein"] = (total_nutrition["protein"] / target.protein) * 100
    achievement_rate["fat"] = (total_nutrition["fat"] / target.fat) * 100
    achievement_rate["carbs"] = (total_nutrition["carbs"] / target.carbs) * 100
    achievement_rate["fiber"] = (total_nutrition["fiber"] / target.fiber) * 100
    achievement_rate["calcium"] = (total_nutrition["calcium"] / target.calcium) * 100
    achievement_rate["iron"] = (total_nutrition["iron"] / target.iron) * 100
    achievement_rate["vitamin_c"] = (
        total_nutrition["vitamin_c"] / target.vitamin_c
    ) * 100

    # 不足・過剰栄養素を特定
    missing_nutrients = []
    excess_nutrients = []

    for nutrient, rate in achievement_rate.items():
        if rate < 70:  # 70%未満は不足
            missing_nutrients.append(nutrient)
        elif rate > 150:  # 150%超過は過剰
            excess_nutrients.append(nutrient)

    # バランススコアを計算（70-130%の範囲にある栄養素の割合）
    balanced_count = 0
    for rate in achievement_rate.values():
        if 70 <= rate <= 130:
            balanced_count += 1
    balance_score = (balanced_count / len(achievement_rate)) * 100

    return MealAnalysis(
        total_nutrition=total_nutrition,
        target_nutrition=target,
        achievement_rate=achievement_rate,
        missing_nutrients=missing_nutrients,
        excess_nutrients=excess_nutrients,
        balance_score=balance_score,
    )


def get_nutrition_advice(analysis: MealAnalysis) -> str:
    """栄養分析結果からアドバイスを生成"""
    advice_parts = []

    # バランススコアの評価
    if analysis.balance_score >= 80:
        advice_parts.append("🎉 とてもバランスの良い食事ですね！")
    elif analysis.balance_score >= 60:
        advice_parts.append("👍 まずまずのバランスです。")
    else:
        advice_parts.append("⚠️ 栄養バランスの改善が必要です。")

    # 不足栄養素のアドバイス
    if analysis.missing_nutrients:
        advice_parts.append("\n【不足している栄養素】")
        for nutrient in analysis.missing_nutrients:
            if nutrient == "protein":
                advice_parts.append("• たんぱく質：肉、魚、卵、豆腐を追加しましょう")
            elif nutrient == "calcium":
                advice_parts.append(
                    "• カルシウム：牛乳、ヨーグルト、チーズを追加しましょう"
                )
            elif nutrient == "iron":
                advice_parts.append("• 鉄分：肉類、ほうれん草を追加しましょう")
            elif nutrient == "vitamin_c":
                advice_parts.append("• ビタミンC：果物、ブロッコリーを追加しましょう")
            elif nutrient == "fiber":
                advice_parts.append("• 食物繊維：野菜、果物を追加しましょう")

    return "\n".join(advice_parts)
