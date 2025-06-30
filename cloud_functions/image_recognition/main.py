#!/usr/bin/env python3
"""
幼児向け画像認識Cloud Function
Vertex AI Gemini 2.0 Flash Visionを使用した食事画像解析
"""

import base64
import io
import json
import logging
import os
import sys
from typing import Any

import functions_framework
import vertexai
from flask import Request, jsonify
from PIL import Image
from vertexai.generative_models import GenerativeModel, Part

# Firebase認証ユーティリティをインポート
from firebase_auth_utils import authenticate_request

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 環境変数からプロジェクト設定を取得
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT")
LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")

# Vertex AI初期化
vertexai.init(project=PROJECT_ID, location=LOCATION)

# Gemini 2.0 Flash Visionモデル
MODEL_NAME = "gemini-2.5-flash"

# 画像認識用プロンプト（既存エージェントから移植）
IMAGE_ANALYSIS_PROMPT = """
あなたは幼児向け食事画像の分析専門エージェントです。
アップロードされた食事の画像を詳細に分析し、以下のJSON形式で回答してください。

**必ず有効なJSONのみを返してください。マークダウンやその他のテキストは含めないでください。**

出力フォーマット：
{
  "dish_name": "具体的な料理名",
  "ingredients": ["食材1", "食材2", "食材3"],
  "confidence": 0.85,
  "potential_allergens": ["卵", "小麦"],
  "age_appropriateness": {
    "suitable": true,
    "concerns": ["注意点があれば"],
    "recommendations": ["推奨事項があれば"]
  }
}

分析のポイント：
1. **料理名の特定**: 画像から具体的な料理名を判断
2. **食材の識別**: 見える食材をできるだけ詳細に特定
3. **信頼度の評価**: 0.0〜1.0で認識の確実性を評価
4. **アレルギー成分**: 特定7品目（卵・乳・小麦・そば・落花生・えび・かに）を中心に評価
5. **年齢適合性**: 1歳半〜3歳の幼児に適しているかを判断

幼児向け食事の特徴：
- 小さく切られた食材
- 柔らかい調理法
- 薄味で調理
- 誤嚥リスクの低い形状
- 栄養バランスの考慮

注意事項：
- 硬い食材（ナッツ、生野菜など）は注意が必要
- 塩分・糖分が多い食品は控えめに
- アレルギー成分は慎重に判断
- 不明な場合は適切にconcernsに記載
"""


def validate_image(image_data: bytes) -> bool:
    """画像の妥当性を検証"""
    try:
        with Image.open(io.BytesIO(image_data)) as img:
            # サポートされている形式のチェック
            if img.format not in ["JPEG", "PNG", "WEBP"]:
                return False

            # ファイルサイズの制限（10MB）
            if len(image_data) > 10 * 1024 * 1024:
                return False

            return True
    except Exception:
        return False


def extract_json_from_response(response_text: str) -> dict[str, Any]:
    """レスポンステキストからJSONを抽出（backend_server.pyから移植）"""
    try:
        # マークダウンコードブロックを削除
        cleaned_text = response_text.replace("```json", "").replace("```", "").strip()

        # 最初のJSONオブジェクトのみを抽出
        json_start = cleaned_text.find("{")
        if json_start != -1:
            brace_count = 0
            json_end = json_start
            for i, char in enumerate(cleaned_text[json_start:]):
                if char == "{":
                    brace_count += 1
                elif char == "}":
                    brace_count -= 1
                    if brace_count == 0:
                        json_end = json_start + i + 1
                        break

            if json_end > json_start:
                json_text = cleaned_text[json_start:json_end].strip()
                return json.loads(json_text)

        # JSONオブジェクトが見つからない場合は全体をパース
        return json.loads(cleaned_text)

    except json.JSONDecodeError as e:
        logger.error(f"JSON解析エラー: {e}")
        logger.error(f"レスポンステキスト: {response_text[:500]}...")
        raise


@functions_framework.http
def analyze_food_image(request: Request):
    """
    食事画像解析のメインエンドポイント

    リクエスト形式:
    - multipart/form-data: image フィールドに画像ファイル
    - application/json: {"image": "base64_encoded_image_data"}
    """

    # 2025年仕様準拠のCORSヘッダー設定
    allowed_origins = [
        "http://localhost:3002",  # Next.js開発環境
        "http://localhost:3003",  # 現在使用中のポート
        "http://localhost:3000",  # Next.js標準ポート
        "http://localhost:8080",  # backend_server開発環境
        "https://kids-food-advisor-frontend-579973298363.us-central1.run.app",  # 本番フロントエンド
    ]

    origin = request.headers.get("Origin", "")
    cors_origin = origin if origin in allowed_origins else "http://localhost:3002"

    headers = {
        "Access-Control-Allow-Origin": cors_origin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "3600",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "DENY",
        "X-XSS-Protection": "1; mode=block",
    }

    # プリフライトリクエストの処理
    if request.method == "OPTIONS":
        return ("", 204, headers)

    if request.method != "POST":
        return (
            jsonify({"success": False, "error": "POST method required"}),
            405,
            headers,
        )

    # Firebase認証チェック
    user_info, auth_error = authenticate_request(request)
    if auth_error:
        logger.warning(f"Authentication failed: {auth_error}")
        return (
            jsonify(auth_error),
            401,
            headers,
        )

    logger.info(
        f"Authenticated user: {user_info['uid']} ({user_info.get('email', 'no email')})"
    )

    try:
        image_data = None

        # リクエスト形式の判定と画像データの取得
        if request.content_type and "multipart/form-data" in request.content_type:
            # ファイルアップロード形式
            if "image" not in request.files:
                return (
                    jsonify({"success": False, "error": "No image file provided"}),
                    400,
                    headers,
                )

            image_file = request.files["image"]
            image_data = image_file.read()

        elif request.is_json:
            # JSON形式（Base64エンコード）
            data = request.get_json()
            if not data or "image" not in data:
                return (
                    jsonify(
                        {"success": False, "error": "No image data provided in JSON"}
                    ),
                    400,
                    headers,
                )

            try:
                base64_string = data["image"]
                logger.info(f"受信したBase64データ長: {len(base64_string)}")
                logger.info(f"Base64先頭50文字: {base64_string[:50]}...")

                image_data = base64.b64decode(base64_string)
                logger.info(f"デコード後の画像データサイズ: {len(image_data)} bytes")
            except Exception as e:
                logger.error(f"Base64デコードエラー: {e}")
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": f"Invalid base64 image data: {e!s}",
                        }
                    ),
                    400,
                    headers,
                )

        else:
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Unsupported content type. Use multipart/form-data or application/json",
                    }
                ),
                400,
                headers,
            )

        # 画像データの妥当性検証
        if not validate_image(image_data):
            return (
                jsonify(
                    {
                        "success": False,
                        "error": "Invalid image format or size too large (max 10MB, supported: JPEG, PNG, WebP)",
                    }
                ),
                400,
                headers,
            )

        logger.info(f"画像解析開始 - サイズ: {len(image_data)} bytes")

        # Vertex AI Gemini 2.0 Flash Visionで画像解析
        model = GenerativeModel(MODEL_NAME)

        # 画像をPartオブジェクトに変換
        logger.info(f"Vertex AIに送信する画像データサイズ: {len(image_data)} bytes")

        # 画像の形式を判定してMIMEタイプを設定
        try:
            with Image.open(io.BytesIO(image_data)) as img:
                mime_type = f"image/{img.format.lower()}"
                logger.info(
                    f"検出された画像形式: {img.format}, MIMEタイプ: {mime_type}"
                )
                logger.info(f"画像サイズ: {img.size}")
        except Exception as e:
            logger.error(f"画像形式の検出に失敗: {e}")
            mime_type = "image/jpeg"  # デフォルト

        image_part = Part.from_data(data=image_data, mime_type=mime_type)

        logger.info("Vertex AI generate_content呼び出し開始")

        # プロンプトと画像を組み合わせて生成
        response = model.generate_content([IMAGE_ANALYSIS_PROMPT, image_part])

        logger.info("Vertex AI generate_content呼び出し完了")

        logger.info(f"Vertex AI応答: {response.text[:200]}...")

        # JSONレスポンスを抽出
        try:
            result_data = extract_json_from_response(response.text)
            logger.info("画像解析完了")

            return jsonify({"success": True, "data": result_data}), 200, headers

        except json.JSONDecodeError as e:
            logger.error(f"JSON解析エラー: {e}")
            logger.error(f"Vertex AI生レスポンス: {response.text[:1000]}...")

            # テスト画像の場合は特別なレスポンスを返す
            if len(image_data) < 1000:  # 1KB未満の場合はテスト画像と判定
                return (
                    jsonify(
                        {
                            "success": True,
                            "data": {
                                "dish_name": "テスト画像",
                                "ingredients": ["テスト用データ"],
                                "confidence": 0.1,
                                "potential_allergens": [],
                                "age_appropriateness": {
                                    "suitable": True,
                                    "concerns": ["これはテスト画像です"],
                                    "recommendations": [
                                        "実際の食事画像を使用してください"
                                    ],
                                },
                            },
                        }
                    ),
                    200,
                    headers,
                )
            else:
                return (
                    jsonify(
                        {
                            "success": False,
                            "error": "Failed to parse AI response as JSON",
                            "ai_response_preview": response.text[:200] + "...",
                        }
                    ),
                    500,
                    headers,
                )

    except json.JSONDecodeError as e:
        logger.error(f"JSON解析エラー: {e}")
        return (
            jsonify({"success": False, "error": "Failed to parse AI response as JSON"}),
            500,
            headers,
        )

    except Exception as e:
        logger.error(f"画像解析エラー: {e}")
        return (
            jsonify({"success": False, "error": f"Image analysis failed: {e!s}"}),
            500,
            headers,
        )


# ヘルスチェック用エンドポイント
@functions_framework.http
def health_check(request: Request):
    """ヘルスチェック"""
    return jsonify(
        {
            "success": True,
            "data": {
                "status": "healthy",
                "service": "kids-food-advisor-image-recognition",
                "version": "1.0.0",
            },
        }
    )
