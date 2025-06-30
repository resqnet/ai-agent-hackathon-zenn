"""
Firebase認証関連のユーティリティとミドルウェア
"""

import json
import logging
import os
from functools import wraps
from typing import Optional

import firebase_admin
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth, credentials

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


class FirebaseAuthBearer(HTTPBearer):
    """Firebase JWT認証用のHTTPBearerスキーム"""

    def __init__(self, auto_error: bool = True):
        super().__init__(auto_error=auto_error)

    async def __call__(
        self, request: Request
    ) -> Optional[HTTPAuthorizationCredentials]:
        return await super().__call__(request)


# HTTPBearerインスタンス
firebase_scheme = FirebaseAuthBearer()


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(firebase_scheme),
) -> Optional[dict]:
    """
    Firebase ID Tokenを検証し、現在のユーザー情報を取得

    Args:
        credentials: Authorization ヘッダーから取得したクレデンシャル

    Returns:
        ユーザー情報のdict、または認証失敗時はNone

    Raises:
        HTTPException: トークンが無効な場合
    """
    if not credentials:
        return None

    try:
        # Firebase Admin SDKが初期化されていない場合は初期化
        if _firebase_app is None:
            initialize_firebase()

        # ID Tokenを検証
        decoded_token = auth.verify_id_token(credentials.credentials)

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
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Firebase token verification error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_required(
    credentials: HTTPAuthorizationCredentials = Depends(firebase_scheme),
) -> dict:
    """
    認証が必須のエンドポイント用のユーザー取得関数

    Args:
        credentials: Authorization ヘッダーから取得したクレデンシャル

    Returns:
        ユーザー情報のdict

    Raises:
        HTTPException: 認証が失敗した場合
    """
    user = await get_current_user(credentials)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_auth(func):
    """
    関数デコレータ：Firebase認証を必須にする

    Usage:
        @require_auth
        async def protected_endpoint(user: dict = Depends(get_current_user_required)):
            # protected logic here
            pass
    """

    @wraps(func)
    async def wrapper(*args, **kwargs):
        return await func(*args, **kwargs)

    return wrapper


# 開発用：認証をバイパスするかどうかの設定
BYPASS_AUTH = os.getenv("BYPASS_AUTH", "false").lower() == "true"


async def get_current_user_optional_bypass(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(firebase_scheme),
) -> Optional[dict]:
    """
    開発用：認証をバイパス可能なユーザー取得関数
    BYPASS_AUTH=true の場合、ダミーユーザーを返す
    """
    if BYPASS_AUTH:
        logger.warning("Authentication bypassed (development mode)")
        return {
            "uid": "dev-user-uid",
            "email": "dev@example.com",
            "name": "Development User",
            "picture": None,
            "email_verified": True,
            "provider": "development",
        }

    return await get_current_user(credentials)
