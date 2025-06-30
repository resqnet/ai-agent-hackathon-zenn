"""
エージェント関連のユーティリティ関数

エージェント名の判定やコンテンツ分割などの共通処理を提供
"""


def get_agent_name(text_content: str) -> str:
    """
    テキスト内容からエージェント名を動的判定

    Args:
        text_content: 判定対象のテキスト

    Returns:
        str: エージェント名（栄養アドバイザー、くらしアドバイザー、Kids Food Advisor）
    """
    if (
        "栄養" in text_content
        or "バランス" in text_content
        or "カロリー" in text_content
    ):
        return "栄養アドバイザー"
    elif (
        "レシピ" in text_content
        or "調理" in text_content
        or "作り方" in text_content
        or "ちょい足し" in text_content
        or "時短" in text_content
        or "冷凍" in text_content
        or "レトルト" in text_content
        or "手軽" in text_content
        or "簡単" in text_content
        or "応援" in text_content
    ):
        return "くらしアドバイザー"
    else:
        return "Kids Food Advisor"


def split_agent_content(text_content: str) -> list[tuple[str, str]]:
    """
    Agent Engine環境向けに長いテキストを複数エージェントの発言に分割

    Args:
        text_content: 分割対象のテキスト

    Returns:
        List[Tuple[str, str]]: (テキスト内容, エージェント名)のタプルのリスト
    """
    # 栄養分析とレシピ提案の境界を検出
    transition_markers = [
        "お疲れ様です！",
        "栄養士さんのアドバイスを参考に",
        "さらに手軽にできる",
        "まず、昼食の",
        "もし時間がないときは",
        "さらに、夕食にも応用",
    ]

    # 分割ポイントを探す
    split_point = -1
    for marker in transition_markers:
        point = text_content.find(marker)
        if point != -1:
            split_point = point
            break

    if split_point != -1:
        # 栄養分析部分とレシピ提案部分に分割
        nutrition_part = text_content[:split_point].strip()
        recipe_part = text_content[split_point:].strip()
        return [
            (nutrition_part, "栄養アドバイザー"),
            (recipe_part, "くらしアドバイザー"),
        ]
    else:
        # 分割できない場合は単一エージェントとして扱う
        agent_name = get_agent_name(text_content)
        return [(text_content, agent_name)]
