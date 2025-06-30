#!/usr/bin/env python3
"""
PDFファイルをVertex AI Searchにアップロードするスクリプト

生成されたPDFファイルをCloud Storageにアップロードし、
Vertex AI Search DataStoreにインポートします。
"""

import argparse
import sys
from pathlib import Path

import google.auth
from google.cloud import discoveryengine_v1beta as discoveryengine
from google.cloud import storage


def upload_pdfs_to_gcs(
    project_id: str,
    bucket_name: str,
    source_dir: Path,
    gcs_prefix: str = "nutrition-pdfs",
) -> list[str]:
    """PDFファイルをCloud Storageにアップロード"""

    storage_client = storage.Client(project=project_id)

    # バケットの取得または作成
    try:
        bucket = storage_client.bucket(bucket_name)
        if not bucket.exists():
            print(f"バケット {bucket_name} を作成中...")
            bucket = storage_client.create_bucket(bucket_name, location="us-central1")
    except Exception as e:
        print(f"バケットの取得/作成に失敗: {e}")
        return []

    uploaded_files = []

    # PDFファイルをアップロード
    for pdf_file in source_dir.glob("*.pdf"):
        blob_name = f"{gcs_prefix}/{pdf_file.name}"
        blob = bucket.blob(blob_name)

        print(f"アップロード中: {pdf_file.name} -> gs://{bucket_name}/{blob_name}")

        try:
            blob.upload_from_filename(str(pdf_file))
            uploaded_files.append(f"gs://{bucket_name}/{blob_name}")
            print("  ✓ 完了")
        except Exception as e:
            print(f"  ✗ エラー: {e}")

    return uploaded_files


def import_documents_to_vertex_search(
    project_id: str, location: str, data_store_id: str, gcs_uris: list[str]
) -> None:
    """ドキュメントをVertex AI Searchにインポート"""

    # Vertex AI Search クライアントの初期化
    client = discoveryengine.DocumentServiceClient()

    # DataStore のパス
    parent = f"projects/{project_id}/locations/{location}/collections/default_collection/dataStores/{data_store_id}/branches/default_branch"

    # インポートリクエストの作成
    import_config = discoveryengine.GcsSource(
        input_uris=gcs_uris, data_schema="content"
    )

    request = discoveryengine.ImportDocumentsRequest(
        parent=parent,
        gcs_source=import_config,
        reconciliation_mode=discoveryengine.ImportDocumentsRequest.ReconciliationMode.INCREMENTAL,
    )

    print("\nVertex AI Search へのドキュメントインポートを開始...")
    print(f"DataStore: {data_store_id}")
    print(f"ファイル数: {len(gcs_uris)}")

    try:
        # インポート操作の開始
        operation = client.import_documents(request=request)

        print("インポート処理を実行中...")

        # 操作の完了を待つ（簡略化）
        print("インポート処理が開始されました。")
        print("注: インポート処理は非同期で実行されます。")
        print("数分後にGoogle Cloud ConsoleでDataStoreの内容を確認してください。")
        print("\n✓ インポートリクエストが送信されました！")

    except Exception as e:
        print(f"\n✗ インポートエラー: {e}")
        raise


def verify_datastore_exists(project_id: str, location: str, data_store_id: str) -> bool:
    """DataStoreの存在を確認"""
    client = discoveryengine.DataStoreServiceClient()

    name = f"projects/{project_id}/locations/{location}/collections/default_collection/dataStores/{data_store_id}"

    try:
        datastore = client.get_data_store(name=name)
        print(f"✓ DataStore確認: {datastore.display_name}")
        return True
    except Exception as e:
        print(f"✗ DataStore が見つかりません: {e}")
        return False


def main():
    """メイン処理"""
    parser = argparse.ArgumentParser(description="PDFをVertex AI Searchにアップロード")
    parser.add_argument(
        "--project-id", required=True, help="Google Cloud プロジェクトID"
    )
    parser.add_argument(
        "--pdf-directory", default="./pdfs", help="PDFファイルのディレクトリ"
    )
    parser.add_argument(
        "--location", default="global", help="Vertex AI Search のロケーション"
    )
    parser.add_argument(
        "--data-store-id",
        default="kids-food-advisor-nutrition-datastore",
        help="Vertex AI Search DataStore ID",
    )

    args = parser.parse_args()

    # 認証情報の取得
    credentials, project = google.auth.default()
    if not args.project_id:
        args.project_id = project

    print("設定:")
    print(f"  プロジェクトID: {args.project_id}")
    print(f"  PDFディレクトリ: {args.pdf_directory}")
    print(f"  DataStore ID: {args.data_store_id}")
    print()

    # PDFディレクトリの確認
    pdf_dir = Path(args.pdf_directory)
    if not pdf_dir.exists():
        print(f"エラー: PDFディレクトリが存在しません: {pdf_dir}")
        sys.exit(1)

    pdf_files = list(pdf_dir.glob("*.pdf"))
    if not pdf_files:
        print(f"エラー: PDFファイルが見つかりません: {pdf_dir}")
        sys.exit(1)

    print(f"見つかったPDFファイル: {len(pdf_files)}個")
    for pdf in pdf_files:
        print(f"  - {pdf.name}")
    print()

    # DataStoreの存在確認
    if not verify_datastore_exists(args.project_id, args.location, args.data_store_id):
        print("\nDataStoreが存在しません。先に以下のコマンドを実行してください:")
        print("  make setup-vertex-ai")
        sys.exit(1)

    # Cloud Storageへのアップロード
    bucket_name = f"{args.project_id}-kids-food-advisor-pdfs"
    print(f"\n1. Cloud Storage へのアップロード (バケット: {bucket_name})")

    uploaded_uris = upload_pdfs_to_gcs(
        project_id=args.project_id, bucket_name=bucket_name, source_dir=pdf_dir
    )

    if not uploaded_uris:
        print("エラー: ファイルのアップロードに失敗しました")
        sys.exit(1)

    # Vertex AI Searchへのインポート
    print("\n2. Vertex AI Search へのインポート")

    import_documents_to_vertex_search(
        project_id=args.project_id,
        location=args.location,
        data_store_id=args.data_store_id,
        gcs_uris=uploaded_uris,
    )

    print("\n✅ 全ての処理が完了しました！")
    print("\n次のステップ:")
    print("  1. フロントエンドを起動: make frontend")
    print("  2. バックエンドを起動: make backend-server")
    print("  3. 栄養相談を試してみてください！")


if __name__ == "__main__":
    main()
