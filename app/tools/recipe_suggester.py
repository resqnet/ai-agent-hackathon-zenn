"""
レシピ提案ツール
"""

from app.tools.nutrition_analyzer import get_nutrition_summary


def suggest_dinner_recipes(
    breakfast: str,
    lunch: str,
    age_group: str = "1-2歳",
    allergens: list[str] | None = None,
) -> str:
    """
    朝食・昼食を踏まえて夕食レシピを提案（くらしアドバイザー風）

    Args:
        breakfast: 朝食の内容
        lunch: 昼食の内容
        age_group: 年齢グループ
        allergens: アレルギー情報

    Returns:
        親しみやすいトーンでのレシピ提案
    """
    if allergens is None:
        allergens = []

    try:
        # 栄養バランスを分析
        nutrition_summary = get_nutrition_summary(breakfast, lunch, age_group)
        missing_nutrients = nutrition_summary.get("missing_nutrients", [])

        # 不足栄養素に基づくレシピ提案
        recipes = []

        # たんぱく質不足の場合
        if "protein" in missing_nutrients:
            if "卵" not in allergens:
                recipes.append(
                    {
                        "name": "卵とじうどん",
                        "description": "卵でたんぱく質をちょい足し！優しい味で食べやすいです",
                        "ingredients": ["うどん", "卵", "だし汁", "醤油"],
                        "tips": "うどんは短く切って、卵は半熟くらいがおすすめ",
                    }
                )

            if "乳" not in allergens:
                recipes.append(
                    {
                        "name": "ツナとチーズのおにぎり",
                        "description": "ツナでたんぱく質、チーズでカルシウムもGet！",
                        "ingredients": ["ご飯", "ツナ缶", "チーズ", "海苔"],
                        "tips": "ツナは水を切って、小さく切ったチーズを混ぜ込んで",
                    }
                )

        # カルシウム不足の場合
        if "calcium" in missing_nutrients and "乳" not in allergens:
            recipes.append(
                {
                    "name": "しらすと野菜の蒸しパン",
                    "description": "カルシウムたっぷり！手づかみでも食べやすい",
                    "ingredients": [
                        "小麦粉",
                        "牛乳",
                        "しらす",
                        "にんじん",
                        "ベーキングパウダー",
                    ],
                    "tips": "しらすは塩抜きして、野菜は小さく刻んで混ぜ込んで",
                }
            )

        # 鉄分不足の場合
        if "iron" in missing_nutrients:
            recipes.append(
                {
                    "name": "ひじきと豆腐のハンバーグ",
                    "description": "鉄分たっぷりのひじき入り！ふわふわで食べやすい",
                    "ingredients": ["豆腐", "ひじき", "鶏ひき肉", "片栗粉"],
                    "tips": "ひじきは戻して細かく刻んで。小さめに作ると食べやすいよ",
                }
            )

        # ビタミンC不足の場合
        if "vitamin_c" in missing_nutrients:
            recipes.append(
                {
                    "name": "かぼちゃとブロッコリーのポタージュ",
                    "description": "ビタミンCと甘みでお野菜デビュー！",
                    "ingredients": ["かぼちゃ", "ブロッコリー", "牛乳", "だし汁"],
                    "tips": "野菜は柔らかく煮て、ミキサーでなめらかに",
                }
            )

        # バランスが良い場合
        if not missing_nutrients or len(recipes) == 0:
            recipes.extend(
                [
                    {
                        "name": "野菜たっぷり炊き込みご飯",
                        "description": "今日はバランス◎！色んな野菜で楽しい食事を",
                        "ingredients": ["米", "にんじん", "しいたけ", "鶏肉", "だし汁"],
                        "tips": "具材は小さく切って、薄味で仕上げて",
                    },
                    {
                        "name": "お豆腐グラタン風",
                        "description": "いつもと違う味で変化をつけて！",
                        "ingredients": ["豆腐", "かぼちゃ", "チーズ", "牛乳"],
                        "tips": "豆腐は水切りして、かぼちゃは柔らかく煮て",
                    },
                ]
            )

        # 結果をフレンドリーな形式でまとめる
        result_parts = [
            "🍽️ **今夜の夕飯はこれで決まり！**",
            "",
            "朝と昼の食事を見させてもらったところ、",
        ]

        if missing_nutrients:
            nutrients_jp = {
                "protein": "たんぱく質",
                "calcium": "カルシウム",
                "iron": "鉄分",
                "vitamin_c": "ビタミンC",
                "fiber": "食物繊維",
            }
            missing_jp = [
                nutrients_jp.get(n, n) for n in missing_nutrients if n in nutrients_jp
            ]
            if missing_jp:
                result_parts.append(
                    f"**{', '.join(missing_jp)}**をちょい足しできるレシピを選んでみました！"
                )
        else:
            result_parts.append(
                "栄養バランスがとても良いので、いつもと違う味で楽しい食事はいかがですか？"
            )

        result_parts.append("")

        # レシピを追加
        for i, recipe in enumerate(recipes[:2], 1):  # 最大2つのレシピ
            result_parts.extend(
                [
                    f"## {i}. {recipe['name']}",
                    f"💡 {recipe['description']}",
                    "",
                    "**材料:**",
                    *[f"• {ingredient}" for ingredient in recipe["ingredients"]],
                    "",
                    f"**コツ:** {recipe['tips']}",
                    "",
                ]
            )

        result_parts.append(
            "どちらも子供が食べやすいように工夫したレシピです。頑張らなくても大丈夫、今日もお疲れさまです！🌟"
        )

        return "\n".join(result_parts)

    except Exception as e:
        return f"レシピ提案中にエラーが発生しました: {e!s}"


def get_simple_recipes(category: str = "主食", age_group: str = "1-2歳") -> list[dict]:
    """
    カテゴリに基づく簡単レシピを取得

    Args:
        category: 食品カテゴリ
        age_group: 年齢グループ

    Returns:
        簡単レシピのリスト
    """
    simple_recipes = {
        "主食": [
            {
                "name": "おかゆ",
                "base_food": "白米",
                "description": "基本のおかゆ。野菜やたんぱく質を加えてアレンジ",
                "difficulty": "簡単",
            },
            {
                "name": "蒸しパン",
                "base_food": "食パン",
                "description": "手づかみ食べにぴったり",
                "difficulty": "簡単",
            },
        ],
        "野菜": [
            {
                "name": "野菜スティック",
                "base_food": "にんじん",
                "description": "茹でて柔らかく、手づかみで",
                "difficulty": "簡単",
            },
            {
                "name": "野菜ペースト",
                "base_food": "かぼちゃ",
                "description": "なめらかにして食べやすく",
                "difficulty": "簡単",
            },
        ],
    }

    return simple_recipes.get(category, [])
