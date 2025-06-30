"""
入力バリデーションユーティリティモジュール
XSS攻撃対策と入力サニタイズ機能を提供
"""

import html
import re
from typing import Any


def escape_html(text: Any) -> str:
    """
    HTMLエスケープ処理
    危険な文字を安全なHTMLエンティティに変換
    """
    if not isinstance(text, str):
        text = str(text)

    return html.escape(text, quote=True)


def sanitize_input(input_text: Any) -> str:
    """
    入力サニタイズ処理
    HTMLタグとスクリプトを除去してHTMLエスケープを適用
    """
    if not isinstance(input_text, str):
        input_text = str(input_text)

    # HTMLタグとスクリプトを除去
    # scriptタグを除去
    sanitized = re.sub(
        r"<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>",
        "",
        input_text,
        flags=re.IGNORECASE,
    )

    # その他のHTMLタグを除去
    sanitized = re.sub(r"<[^>]*>", "", sanitized)

    # JavaScript URLを除去
    sanitized = re.sub(r"javascript:", "", sanitized, flags=re.IGNORECASE)

    # イベントハンドラー属性を除去
    sanitized = re.sub(r"on\w+\s*=", "", sanitized, flags=re.IGNORECASE)

    # HTMLエスケープを適用
    return escape_html(sanitized)


def validate_text_input(
    value: str,
    max_length: int | None = None,
    min_length: int | None = None,
    allowed_pattern: str | None = None,
    required: bool = False,
) -> dict[str, Any]:
    """
    テキスト入力のバリデーション

    Args:
        value: 検証する値
        max_length: 最大文字数
        min_length: 最小文字数
        allowed_pattern: 許可する文字パターン（正規表現）
        required: 必須フィールドかどうか

    Returns:
        バリデーション結果辞書
    """
    errors = []
    sanitized_value = value.strip() if isinstance(value, str) else str(value)

    # 必須チェック
    if required and not sanitized_value:
        errors.append("入力が必要です")
        return {"is_valid": False, "errors": errors, "sanitized_value": sanitized_value}

    # 空の場合は以降のチェックをスキップ
    if not sanitized_value:
        return {"is_valid": True, "errors": [], "sanitized_value": sanitized_value}

    # 最小文字数チェック
    if min_length and len(sanitized_value) < min_length:
        errors.append(f"{min_length}文字以上で入力してください")

    # 最大文字数チェック
    if max_length and len(sanitized_value) > max_length:
        errors.append(f"{max_length}文字以内で入力してください")

    # パターンマッチング
    if allowed_pattern and not re.match(allowed_pattern, sanitized_value):
        errors.append("使用できない文字が含まれています")

    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "sanitized_value": sanitize_input(sanitized_value),
    }


def validate_food_name(name: str) -> dict[str, Any]:
    """食材名のバリデーション"""
    # 日本語、英数字、一般的な記号を許可
    allowed_pattern = r"^[ぁ-んァ-ヶー一-龯a-zA-Z0-9\s\u3099\u309A\u30FC()（）・※]+$"

    return validate_text_input(
        value=name,
        max_length=200,
        min_length=1,
        allowed_pattern=allowed_pattern,
        required=True,
    )


def validate_notes(notes: str) -> dict[str, Any]:
    """メモのバリデーション"""
    # より多くの文字を許可（改行、句読点等）
    allowed_pattern = (
        r"^[ぁ-んァ-ヶー一-龯a-zA-Z0-9\s\u3099\u309A\u30FC()（）・※\n\r.,!?！？。、]+$"
    )

    return validate_text_input(
        value=notes,
        max_length=500,
        min_length=0,
        allowed_pattern=allowed_pattern,
        required=False,
    )


def validate_chat_message(message: str) -> dict[str, Any]:
    """チャットメッセージのバリデーション"""
    # HTMLタグとスクリプトを含む危険な文字列を事前に検出
    if re.search(r"<[^>]*>", message):
        return {
            "is_valid": False,
            "errors": ["HTMLタグは使用できません"],
            "sanitized_value": sanitize_input(message),
        }

    # 制御文字以外のほぼ全ての文字を許可（フロントエンドと統一）
    # 食材成分表示、栄養情報など自由度の高い入力を受け付ける
    allowed_pattern = r"^[^\x00-\x08\x0B\x0C\x0E-\x1F\x7F<>]+$"

    return validate_text_input(
        value=message,
        max_length=1000,  # テストと統一
        min_length=1,
        allowed_pattern=allowed_pattern,
        required=True,
    )


def validate_number(
    value: Any, min_value: float | None = None, max_value: float | None = None
) -> dict[str, Any]:
    """数値のバリデーション"""
    errors = []

    try:
        num_value = float(value)
    except (ValueError, TypeError):
        errors.append("有効な数値を入力してください")
        return {"is_valid": False, "errors": errors, "sanitized_value": None}

    if min_value is not None and num_value < min_value:
        errors.append(f"{min_value}以上の値を入力してください")

    if max_value is not None and num_value > max_value:
        errors.append(f"{max_value}以下の値を入力してください")

    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "sanitized_value": num_value,
    }


def validate_meal_data(meal_data: dict[str, Any]) -> dict[str, Any]:
    """食事データ全体のバリデーション"""
    errors = []
    sanitized_data = {}

    # 食事タイプの検証
    meal_type = meal_data.get("type", "")
    if meal_type not in ["breakfast", "lunch", "dinner", "snack"]:
        errors.append("有効な食事タイプを選択してください")
    else:
        sanitized_data["type"] = meal_type

    # 食材データの検証
    foods = meal_data.get("foods", [])
    if not foods:
        errors.append("少なくとも1つの食材を追加してください")
    else:
        sanitized_foods = []
        for i, food in enumerate(foods):
            # 食材名の検証
            name_validation = validate_food_name(food.get("name", ""))
            if not name_validation["is_valid"]:
                errors.extend(
                    [f"食材{i + 1}: {error}" for error in name_validation["errors"]]
                )
                continue

            # 数量の検証
            quantity_validation = validate_number(
                food.get("quantity", 0), min_value=1, max_value=1000
            )
            if not quantity_validation["is_valid"]:
                errors.extend(
                    [
                        f"食材{i + 1}の数量: {error}"
                        for error in quantity_validation["errors"]
                    ]
                )
                continue

            sanitized_foods.append(
                {
                    "name": name_validation["sanitized_value"],
                    "quantity": quantity_validation["sanitized_value"],
                    "unit": sanitize_input(food.get("unit", "g")),
                }
            )

        sanitized_data["foods"] = sanitized_foods

    # メモの検証
    notes = meal_data.get("notes", "")
    if notes:
        notes_validation = validate_notes(notes)
        if not notes_validation["is_valid"]:
            errors.extend(notes_validation["errors"])
        else:
            sanitized_data["notes"] = notes_validation["sanitized_value"]

    return {
        "is_valid": len(errors) == 0,
        "errors": errors,
        "sanitized_data": sanitized_data,
    }
