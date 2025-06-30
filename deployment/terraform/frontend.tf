# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# フロントエンド用サービスアカウント
resource "google_service_account" "frontend_sa" {
  for_each     = local.deploy_project_ids
  account_id   = "${var.project_name}-frontend-sa"
  display_name = "Kids Food Advisor Frontend Service Account"
  project      = each.value
  depends_on   = [resource.google_project_service.shared_services]
}

# Cloud Runサービス（ステージング環境）
resource "google_cloud_run_v2_service" "frontend_staging" {
  name               = "${var.project_name}-frontend"
  location           = var.region
  project            = var.staging_project_id
  deletion_protection = false

  template {
    service_account = google_service_account.frontend_sa["staging"].email
    
    containers {
      image = "gcr.io/cloudrun/hello"
      
      # ポート設定
      ports {
        container_port = 8080
      }
      
      # 環境変数
      env {
        name  = "NEXT_PUBLIC_API_URL"
        value = "https://${var.project_name}-api-staging.${var.region}.run.app"
      }
      
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      
      env {
        name  = "IMAGE_RECOGNITION_URL"
        value = "https://${var.region}-${var.staging_project_id}.cloudfunctions.net/image-recognition"
      }
      
      # リソース設定
      resources {
        limits = {
          cpu    = "1"
          memory = "1Gi"
        }
        cpu_idle = true
      }
    }
    
    # スケーリング設定
    scaling {
      min_instance_count = 0
      max_instance_count = 10
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_service_account.frontend_sa,
    google_project_service.shared_services
  ]
}

# Cloud Runサービス（本番環境）
resource "google_cloud_run_v2_service" "frontend_prod" {
  name               = "${var.project_name}-frontend"
  location           = var.region
  project            = var.prod_project_id
  deletion_protection = false

  template {
    service_account = google_service_account.frontend_sa["prod"].email
    
    containers {
      image = "gcr.io/cloudrun/hello"
      
      # ポート設定
      ports {
        container_port = 8080
      }
      
      # 環境変数
      env {
        name  = "NEXT_PUBLIC_API_URL"
        value = "https://${var.project_name}-api.${var.region}.run.app"
      }
      
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      
      env {
        name  = "IMAGE_RECOGNITION_URL"
        value = "https://${var.region}-${var.prod_project_id}.cloudfunctions.net/image-recognition"
      }
      
      # リソース設定
      resources {
        limits = {
          cpu    = "2"
          memory = "2Gi"
        }
        cpu_idle = true
      }
    }
    
    # スケーリング設定
    scaling {
      min_instance_count = 1
      max_instance_count = 100
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }

  depends_on = [
    google_service_account.frontend_sa,
    google_project_service.shared_services
  ]
}

# IAMバインディング（ステージング - 公開アクセス）
resource "google_cloud_run_service_iam_member" "frontend_staging_public" {
  service  = google_cloud_run_v2_service.frontend_staging.name
  location = google_cloud_run_v2_service.frontend_staging.location
  project  = var.staging_project_id
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# IAMバインディング（本番 - 公開アクセス）
resource "google_cloud_run_service_iam_member" "frontend_prod_public" {
  service  = google_cloud_run_v2_service.frontend_prod.name
  location = google_cloud_run_v2_service.frontend_prod.location
  project  = var.prod_project_id
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Artifact Registryリポジトリ（フロントエンド用）
resource "google_artifact_registry_repository" "frontend_repo" {
  for_each      = local.deploy_project_ids
  repository_id = "${var.project_name}-frontend"
  format        = "DOCKER"
  location      = var.region
  project       = each.value
  description   = "Docker repository for Kids Food Advisor frontend"
  
  depends_on = [google_project_service.shared_services]
}

# Artifact Registry権限設定
resource "google_artifact_registry_repository_iam_member" "frontend_repo_access" {
  for_each   = local.deploy_project_ids
  repository = google_artifact_registry_repository.frontend_repo[each.key].id
  role       = "roles/artifactregistry.writer"
  member     = "serviceAccount:${google_service_account.cicd_runner_sa.email}"
  location   = var.region
  project    = each.value
}

# フロントエンドサービスアカウントへのArtifact Registry読み取り権限
resource "google_artifact_registry_repository_iam_member" "frontend_sa_reader" {
  for_each   = local.deploy_project_ids
  repository = google_artifact_registry_repository.frontend_repo[each.key].id
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.frontend_sa[each.key].email}"
  location   = var.region
  project    = each.value
}

# フロントエンドのURL出力
output "frontend_staging_url" {
  value       = google_cloud_run_v2_service.frontend_staging.uri
  description = "ステージング環境のフロントエンドURL"
}

output "frontend_prod_url" {
  value       = google_cloud_run_v2_service.frontend_prod.uri
  description = "本番環境のフロントエンドURL"
}