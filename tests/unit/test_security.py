"""
セキュリティ機能のユニットテスト
"""

from app.utils.input_validation import (
    escape_html,
    sanitize_input,
    validate_chat_message,
    validate_food_name,
    validate_meal_data,
    validate_number,
    validate_text_input,
)


class TestHTMLEscape:
    """HTMLエスケープ機能のテスト"""

    def test_escape_html_basic(self):
        """基本的なHTMLエスケープテスト"""
        test_cases = [
            (
                "<script>alert('test')</script>",
                "&lt;script&gt;alert(&#x27;test&#x27;)&lt;/script&gt;",
            ),
            ("Hello & World", "Hello &amp; World"),
            ('<img src="test.jpg">', "&lt;img src=&quot;test.jpg&quot;&gt;"),
            (
                "'single' & \"double\" quotes",
                "&#x27;single&#x27; &amp; &quot;double&quot; quotes",
            ),
        ]

        for input_text, expected in test_cases:
            result = escape_html(input_text)
            assert result == expected

    def test_escape_html_with_non_string(self):
        """非文字列入力のテスト"""
        assert escape_html(123) == "123"
        assert escape_html(None) == "None"


class TestSanitizeInput:
    """入力サニタイズ機能のテスト"""

    def test_sanitize_script_tags(self):
        """スクリプトタグの除去テスト"""
        dangerous_inputs = [
            "<script>alert('xss')</script>",
            "<SCRIPT>alert('XSS')</SCRIPT>",
            "<script src='evil.js'></script>",
            "Hello<script>alert('test')</script>World",
        ]

        for dangerous_input in dangerous_inputs:
            result = sanitize_input(dangerous_input)
            assert "<script" not in result.lower()
            assert "alert" not in result

    def test_sanitize_html_tags(self):
        """HTMLタグの除去テスト"""
        test_cases = [
            ("<div>Hello</div>", "Hello"),
            ("<img src='test.jpg'>", ""),
            ("<a href='evil.com'>link</a>", "link"),
            ("Normal text", "Normal text"),
        ]

        for input_text, expected_contains in test_cases:
            result = sanitize_input(input_text)
            assert expected_contains in result
            assert "<" not in result
            assert ">" not in result

    def test_sanitize_javascript_urls(self):
        """JavaScript URLの除去テスト"""
        dangerous_inputs = [
            "javascript:alert('xss')",
            "JAVASCRIPT:alert('XSS')",
            "Hello javascript:evil() World",
        ]

        for dangerous_input in dangerous_inputs:
            result = sanitize_input(dangerous_input)
            assert "javascript:" not in result.lower()

    def test_sanitize_event_handlers(self):
        """イベントハンドラー属性の除去テスト"""
        dangerous_inputs = [
            "onclick=alert('xss')",
            "onload=evil()",
            "onmouseover=hack()",
        ]

        for dangerous_input in dangerous_inputs:
            result = sanitize_input(dangerous_input)
            assert "on" not in result.lower() or "=" not in result


class TestValidateTextInput:
    """テキスト入力バリデーションのテスト"""

    def test_validate_required_field(self):
        """必須フィールドのバリデーション"""
        # 空文字列
        result = validate_text_input("", required=True)
        assert not result["is_valid"]
        assert "入力が必要です" in result["errors"]

        # 有効な入力
        result = validate_text_input("有効な入力", required=True)
        assert result["is_valid"]
        assert len(result["errors"]) == 0

    def test_validate_length_limits(self):
        """文字数制限のバリデーション"""
        # 最小文字数
        result = validate_text_input("短", min_length=3)
        assert not result["is_valid"]
        assert "3文字以上" in result["errors"][0]

        # 最大文字数
        result = validate_text_input("非常に長いテキスト", max_length=5)
        assert not result["is_valid"]
        assert "5文字以内" in result["errors"][0]

        # 適切な長さ
        result = validate_text_input("適切", min_length=2, max_length=5)
        assert result["is_valid"]

    def test_validate_pattern_matching(self):
        """パターンマッチングのバリデーション"""
        # 日本語のみ許可
        pattern = r"^[ぁ-んァ-ヶー一-龯]+$"

        # 有効な日本語
        result = validate_text_input("こんにちは", allowed_pattern=pattern)
        assert result["is_valid"]

        # 無効な文字（英数字）
        result = validate_text_input("Hello123", allowed_pattern=pattern)
        assert not result["is_valid"]
        assert "使用できない文字" in result["errors"][0]


class TestFoodNameValidation:
    """食材名バリデーションのテスト"""

    def test_valid_food_names(self):
        """有効な食材名のテスト"""
        valid_names = [
            "ご飯",
            "豆腐",
            "小松菜",
            "鶏むね肉",
            "りんご（紅玉）",
            "pasta",
            "ABC野菜",
        ]

        for name in valid_names:
            result = validate_food_name(name)
            assert result["is_valid"], f"食材名 '{name}' が無効と判定されました"

    def test_invalid_food_names(self):
        """無効な食材名のテスト"""
        invalid_names = [
            "",  # 空文字
            "<script>alert('xss')</script>",  # スクリプト
            "食材" * 101,  # 長すぎる（202文字）
        ]

        for name in invalid_names:
            result = validate_food_name(name)
            assert not result["is_valid"], f"食材名 '{name}' が有効と判定されました"


class TestChatMessageValidation:
    """チャットメッセージバリデーションのテスト"""

    def test_valid_chat_messages(self):
        """有効なチャットメッセージのテスト"""
        valid_messages = [
            "こんにちは！",
            "今日の朝食について相談があります。",
            "卵アレルギーがあるのですが、どんな食事が良いでしょうか？",
            "1歳半の子供にはどんな食材が適していますか。",
        ]

        for message in valid_messages:
            result = validate_chat_message(message)
            assert result["is_valid"], f"メッセージ '{message}' が無効と判定されました"

    def test_invalid_chat_messages(self):
        """無効なチャットメッセージのテスト"""
        invalid_messages = [
            "",  # 空文字
            "<script>alert('xss')</script>",  # スクリプト
            "a" * 1001,  # 長すぎる
        ]

        for message in invalid_messages:
            result = validate_chat_message(message)
            assert not result["is_valid"], (
                f"メッセージ '{message}' が有効と判定されました"
            )


class TestNumberValidation:
    """数値バリデーションのテスト"""

    def test_valid_numbers(self):
        """有効な数値のテスト"""
        test_cases = [
            (10, 1, 100),
            (50.5, 0, 100),
            ("25", 1, 100),
        ]

        for value, min_val, max_val in test_cases:
            result = validate_number(value, min_val, max_val)
            assert result["is_valid"]

    def test_invalid_numbers(self):
        """無効な数値のテスト"""
        test_cases = [
            ("not_a_number", 1, 100),
            (150, 1, 100),  # 範囲外
            (-5, 1, 100),  # 範囲外
        ]

        for value, min_val, max_val in test_cases:
            result = validate_number(value, min_val, max_val)
            assert not result["is_valid"]


class TestMealDataValidation:
    """食事データバリデーションのテスト"""

    def test_valid_meal_data(self):
        """有効な食事データのテスト"""
        valid_meal = {
            "type": "breakfast",
            "foods": [
                {"name": "ご飯", "quantity": 100, "unit": "g"},
                {"name": "味噌汁", "quantity": 150, "unit": "ml"},
            ],
            "notes": "美味しく食べました",
        }

        result = validate_meal_data(valid_meal)
        assert result["is_valid"]
        assert len(result["sanitized_data"]["foods"]) == 2

    def test_invalid_meal_data(self):
        """無効な食事データのテスト"""
        invalid_meal = {
            "type": "invalid_type",
            "foods": [],  # 空の食材リスト
            "notes": '<script>alert("xss")</script>',
        }

        result = validate_meal_data(invalid_meal)
        assert not result["is_valid"]
        assert len(result["errors"]) > 0


class TestXSSProtection:
    """XSS攻撃対策のテスト"""

    def test_common_xss_payloads(self):
        """一般的なXSSペイロードのテスト"""
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror=alert('XSS')>",
            "javascript:alert('XSS')",
            "<svg onload=alert('XSS')>",
            "';alert('XSS');//",
            "<iframe src='javascript:alert(\"XSS\")'></iframe>",
        ]

        for payload in xss_payloads:
            # サニタイズ後にスクリプト実行可能なコードが残っていないことを確認
            sanitized = sanitize_input(payload)
            assert "<script" not in sanitized.lower()
            assert "javascript:" not in sanitized.lower()
            assert "onerror" not in sanitized.lower()
            assert "onload" not in sanitized.lower()

    def test_legitimate_content_preservation(self):
        """正当なコンテンツが保持されることのテスト"""
        legitimate_inputs = [
            "こんにちは、栄養相談をお願いします",
            "1歳半の子供の食事について",
            "卵アレルギーがあります",
            "バランスの良い食事を教えてください",
        ]

        for input_text in legitimate_inputs:
            sanitized = sanitize_input(input_text)
            # 基本的な内容が保持されていることを確認
            assert len(sanitized) > 0
            # 主要なキーワードが残っていることを確認
            key_words = input_text.split()[:2]  # 最初の2単語をチェック
            for word in key_words:
                if len(word) > 1:  # 短すぎる単語は除外
                    assert word in sanitized or any(char in sanitized for char in word)
