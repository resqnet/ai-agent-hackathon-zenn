"""
Cloud Functions用Firebase認証ユーティリティ
app/auth/firebase_auth.py から移植・簡略化
"""

import json
import logging
import os
from typing import Optional, Tuple

import firebase_admin
from firebase_admin import auth, credentials
from flask import Request

logger = logging.getLogger(__name__)

# Firebase Admin SDK初期化
_firebase_app: Optional[firebase_admin.App] = None


def initialize_firebase():
    """Firebase Admin SDKを初期化"""
    global _firebase_app

    if _firebase_app is not None:
        logger.info("Firebase Admin SDK is already initialized")
        return _firebase_app

    try:
        # サービスアカウントキーの取得方法
        service_account_key_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_PATH")
        service_account_key_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY_JSON")

        if service_account_key_path and os.path.exists(service_account_key_path):
            # ファイルパスから読み込み
            cred = credentials.Certificate(service_account_key_path)
            logger.info(
                f"Firebase initialized with service account key file: {service_account_key_path}"
            )
        elif service_account_key_json:
            # JSON文字列から読み込み
            service_account_info = json.loads(service_account_key_json)
            cred = credentials.Certificate(service_account_info)
            logger.info("Firebase initialized with service account key JSON")
        else:
            # Application Default Credentials (ADC) を使用
            cred = credentials.ApplicationDefault()
            logger.info("Firebase initialized with Application Default Credentials")

        _firebase_app = firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialized successfully")
        return _firebase_app

    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
        raise RuntimeError(f"Firebase initialization failed: {e}")


def extract_auth_token(request: Request) -> Optional[str]:
    """
    FlaskリクエストからAuthorizationヘッダーを抽出

    Args:
        request: Flask Request オブジェクト

    Returns:
        Bearer トークンまたはNone
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        return None

    if not auth_header.startswith("Bearer "):
        return None

    return auth_header[7:]  # "Bearer " を除去


def verify_firebase_token(token: str) -> Optional[dict]:
    """
    Firebase ID Tokenを検証し、ユーザー情報を取得

    Args:
        token: Firebase ID Token

    Returns:
        ユーザー情報のdict、または認証失敗時はNone
    """
    try:
        # Firebase Admin SDKが初期化されていない場合は初期化
        if _firebase_app is None:
            initialize_firebase()

        # ID Tokenを検証
        decoded_token = auth.verify_id_token(token)

        user_info = {
            "uid": decoded_token["uid"],
            "email": decoded_token.get("email"),
            "name": decoded_token.get("name"),
            "picture": decoded_token.get("picture"),
            "email_verified": decoded_token.get("email_verified", False),
            "provider": decoded_token.get("firebase", {}).get("sign_in_provider"),
        }

        logger.info(
            f"User authenticated: {user_info['uid']} ({user_info.get('email', 'no email')})"
        )
        return user_info

    except auth.InvalidIdTokenError as e:
        logger.warning(f"Invalid Firebase ID token: {e}")
        return None
    except Exception as e:
        logger.error(f"Firebase token verification error: {e}")
        return None


def authenticate_request(request: Request) -> Tuple[Optional[dict], Optional[dict]]:
    """
    Flaskリクエストの認証を実行

    Args:
        request: Flask Request オブジェクト

    Returns:
        (user_info, error_response) のタプル
        - user_info: 認証成功時のユーザー情報、失敗時はNone
        - error_response: 認証失敗時のエラーレスポンス辞書、成功時はNone
    """
    # Authorization ヘッダーからトークンを抽出
    token = extract_auth_token(request)
    if not token:
        return None, {
            "success": False,
            "error": "Authorization header missing or invalid",
            "detail": "Bearer token required",
        }

    # Firebase トークンを検証
    user_info = verify_firebase_token(token)
    if not user_info:
        return None, {
            "success": False,
            "error": "Invalid authentication token",
            "detail": "Firebase token verification failed",
        }

    return user_info, None
