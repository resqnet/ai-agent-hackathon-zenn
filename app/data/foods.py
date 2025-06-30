"""
基本的な食品データベース
1歳半〜3歳の幼児向け食品情報
"""

from dataclasses import dataclass


@dataclass
class NutritionInfo:
    """栄養情報"""

    calories: float  # カロリー (kcal/100g)
    protein: float  # たんぱく質 (g/100g)
    fat: float  # 脂質 (g/100g)
    carbs: float  # 炭水化物 (g/100g)
    fiber: float  # 食物繊維 (g/100g)
    calcium: float  # カルシウム (mg/100g)
    iron: float  # 鉄分 (mg/100g)
    vitamin_c: float  # ビタミンC (mg/100g)


@dataclass
class FoodItem:
    """食品アイテム"""

    name: str
    category: str
    nutrition: NutritionInfo
    age_appropriate: list[str]  # 適切な年齢層
    allergens: list[str]  # アレルゲン
    safety_notes: str | None = None  # 安全性に関する注意事項


# 基本的な食品データベース
FOOD_DATABASE: dict[str, FoodItem] = {
    # 主食
    "白米": FoodItem(
        name="白米",
        category="主食",
        nutrition=NutritionInfo(358, 6.1, 0.9, 77.6, 0.5, 5, 0.8, 0),
        age_appropriate=["6ヶ月〜", "1歳〜", "2歳〜", "3歳〜"],
        allergens=[],
        safety_notes="柔らかく炊いて提供",
    ),
    "食パン": FoodItem(
        name="食パン",
        category="主食",
        nutrition=NutritionInfo(264, 9.3, 4.4, 46.7, 2.3, 29, 0.6, 0),
        age_appropriate=["1歳〜", "2歳〜", "3歳〜"],
        allergens=["小麦", "乳"],
        safety_notes="小さくちぎって提供",
    ),
    "うどん": FoodItem(
        name="うどん",
        category="主食",
        nutrition=NutritionInfo(270, 6.8, 0.8, 55.6, 1.7, 18, 0.4, 0),
        age_appropriate=["1歳〜", "2歳〜", "3歳〜"],
        allergens=["小麦"],
        safety_notes="短く切って提供",
    ),
    # 野菜
    "にんじん": FoodItem(
        name="にんじん",
        category="野菜",
        nutrition=NutritionInfo(39, 0.6, 0.1, 9.3, 2.5, 28, 0.2, 4),
        age_appropriate=["6ヶ月〜", "1歳〜", "2歳〜", "3歳〜"],
        allergens=[],
        safety_notes="柔らかく煮て提供",
    ),
    "ブロッコリー": FoodItem(
        name="ブロッコリー",
        category="野菜",
        nutrition=NutritionInfo(33, 4.3, 0.5, 5.2, 4.4, 38, 1.0, 120),
        age_appropriate=["1歳〜", "2歳〜", "3歳〜"],
        allergens=[],
        safety_notes="小さく切って柔らかく茹でる",
    ),
    "かぼちゃ": FoodItem(
        name="かぼちゃ",
        category="野菜",
        nutrition=NutritionInfo(93, 1.9, 0.3, 20.6, 4.1, 15, 0.5, 43),
        age_appropriate=["6ヶ月〜", "1歳〜", "2歳〜", "3歳〜"],
        allergens=[],
        safety_notes="柔らかく煮て提供",
    ),
    # たんぱく質
    "鶏肉": FoodItem(
        name="鶏肉",
        category="肉類",
        nutrition=NutritionInfo(200, 18.8, 11.6, 0, 0, 5, 0.3, 1),
        age_appropriate=["1歳〜", "2歳〜", "3歳〜"],
        allergens=[],
        safety_notes="十分に加熱し、小さく切って提供",
    ),
    "卵": FoodItem(
        name="卵",
        category="卵類",
        nutrition=NutritionInfo(151, 12.3, 10.3, 0.3, 0, 51, 1.8, 0),
        age_appropriate=["1歳〜", "2歳〜", "3歳〜"],
        allergens=["卵"],
        safety_notes="十分に加熱して提供",
    ),
    "豆腐": FoodItem(
        name="豆腐",
        category="大豆製品",
        nutrition=NutritionInfo(56, 4.9, 3.0, 1.6, 0.4, 43, 0.8, 0),
        age_appropriate=["6ヶ月〜", "1歳〜", "2歳〜", "3歳〜"],
        allergens=["大豆"],
        safety_notes="小さく切って提供",
    ),
    # 乳製品
    "牛乳": FoodItem(
        name="牛乳",
        category="乳製品",
        nutrition=NutritionInfo(67, 3.3, 3.8, 4.8, 0, 110, 0.02, 1),
        age_appropriate=["1歳〜", "2歳〜", "3歳〜"],
        allergens=["乳"],
        safety_notes="飲み過ぎに注意",
    ),
    "ヨーグルト": FoodItem(
        name="ヨーグルト",
        category="乳製品",
        nutrition=NutritionInfo(62, 3.6, 3.0, 4.9, 0, 120, 0.1, 1),
        age_appropriate=["1歳〜", "2歳〜", "3歳〜"],
        allergens=["乳"],
        safety_notes="無糖タイプを選択",
    ),
    # 果物
    "りんご": FoodItem(
        name="りんご",
        category="果物",
        nutrition=NutritionInfo(54, 0.2, 0.1, 14.6, 1.5, 3, 0.1, 4),
        age_appropriate=["6ヶ月〜", "1歳〜", "2歳〜", "3歳〜"],
        allergens=[],
        safety_notes="皮をむいて小さく切る",
    ),
    "バナナ": FoodItem(
        name="バナナ",
        category="果物",
        nutrition=NutritionInfo(86, 1.1, 0.2, 22.5, 1.1, 6, 0.3, 16),
        age_appropriate=["6ヶ月〜", "1歳〜", "2歳〜", "3歳〜"],
        allergens=[],
        safety_notes="小さく切って提供",
    ),
}


def get_food_by_name(name: str) -> FoodItem | None:
    """食品名で検索"""
    return FOOD_DATABASE.get(name)


def get_foods_by_category(category: str) -> list[FoodItem]:
    """カテゴリで食品を検索"""
    return [food for food in FOOD_DATABASE.values() if food.category == category]


def get_age_appropriate_foods(age_group: str) -> list[FoodItem]:
    """年齢に適した食品を検索"""
    return [
        food for food in FOOD_DATABASE.values() if age_group in food.age_appropriate
    ]


def check_allergens(food_names: list[str], allergens: list[str]) -> list[str]:
    """アレルゲンをチェック"""
    warnings = []
    for food_name in food_names:
        food = get_food_by_name(food_name)
        if food:
            for allergen in food.allergens:
                if allergen in allergens:
                    warnings.append(f"{food_name}には{allergen}が含まれています")
    return warnings
