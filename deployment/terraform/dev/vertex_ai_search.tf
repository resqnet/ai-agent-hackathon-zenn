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

# PDF documents storage bucket for nutrition knowledge base (Dev)
resource "google_storage_bucket" "nutrition_pdfs_bucket" {
  name                        = "${var.dev_project_id}-kids-food-advisor-pdfs"
  location                    = var.region
  project                     = var.dev_project_id
  uniform_bucket_level_access = true
  force_destroy               = true  # Dev環境なので削除可能

  # Enable versioning for document history
  versioning {
    enabled = true
  }

  # Lifecycle management for cost optimization (Dev環境用)
  lifecycle_rule {
    condition {
      age = 30  # Dev環境では30日後にNEARLINEに移行
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }

  depends_on = [google_project_service.dev_services]
}

# Vertex AI Search Data Store for nutrition knowledge base (Dev)
resource "google_discovery_engine_data_store" "nutrition_datastore" {
  project       = var.dev_project_id
  location      = "global"
  data_store_id = "kids-food-advisor-nutrition-datastore"
  display_name  = "Dev Kids Food Advisor Nutrition Knowledge Base"
  
  industry_vertical = "GENERIC"
  solution_types    = ["SOLUTION_TYPE_SEARCH"]
  content_config    = "CONTENT_REQUIRED"

  # Document processing configuration optimized for nutrition content
  # Note: chunking_config is configured automatically by Vertex AI Search
  # for optimal RAG performance based on content type

  depends_on = [
    google_project_service.dev_services,
    google_storage_bucket.nutrition_pdfs_bucket
  ]
}

# Search Engine for nutrition knowledge base (Dev)
resource "google_discovery_engine_search_engine" "nutrition_search_engine" {
  project       = var.dev_project_id
  location      = "global"
  engine_id     = "kids-food-advisor-nutrition-search"
  collection_id = "default_collection"
  display_name  = "Dev Kids Food Advisor Nutrition Search"
  
  industry_vertical = "GENERIC"
  
  data_store_ids = [
    google_discovery_engine_data_store.nutrition_datastore.data_store_id
  ]

  search_engine_config {
    search_tier    = "SEARCH_TIER_STANDARD"  # Dev環境ではSTANDARD
    search_add_ons = ["SEARCH_ADD_ON_LLM"]
  }

  depends_on = [
    google_discovery_engine_data_store.nutrition_datastore
  ]
}

# IAM bindings for service accounts to access Vertex AI Search (Dev)
resource "google_project_iam_member" "vertex_ai_search_user" {
  project  = var.dev_project_id
  role     = "roles/discoveryengine.viewer"
  member   = "serviceAccount:${google_service_account.app_service_account.email}"

  depends_on = [
    google_service_account.app_service_account
  ]
}

# Additional IAM binding for data import operations (Dev)
resource "google_project_iam_member" "vertex_ai_search_editor" {
  project  = var.dev_project_id
  role     = "roles/discoveryengine.editor"
  member   = "serviceAccount:${google_service_account.app_service_account.email}"

  depends_on = [
    google_service_account.app_service_account
  ]
}

# Storage bucket IAM for PDF access (Dev)
resource "google_storage_bucket_iam_member" "nutrition_pdfs_bucket_object_viewer" {
  bucket   = google_storage_bucket.nutrition_pdfs_bucket.name
  role     = "roles/storage.objectViewer"
  member   = "serviceAccount:service-${data.google_project.project.number}@gcp-sa-discoveryengine.iam.gserviceaccount.com"

  depends_on = [
    google_storage_bucket.nutrition_pdfs_bucket,
    data.google_project.project
  ]
}

# Additional IAM for Cloud Storage access by application service account (Dev)
resource "google_storage_bucket_iam_member" "nutrition_pdfs_bucket_app_access" {
  bucket   = google_storage_bucket.nutrition_pdfs_bucket.name
  role     = "roles/storage.objectAdmin"
  member   = "serviceAccount:${google_service_account.app_service_account.email}"

  depends_on = [
    google_storage_bucket.nutrition_pdfs_bucket,
    google_service_account.app_service_account
  ]
}

# Data source to get project number
data "google_project" "project" {
  project_id = var.dev_project_id
}

# Output important resource information
output "vertex_ai_search_datastore_id" {
  description = "Vertex AI Search datastore ID for nutrition knowledge base"
  value       = google_discovery_engine_data_store.nutrition_datastore.data_store_id
}

output "vertex_ai_search_engine_id" {
  description = "Vertex AI Search engine ID for nutrition search"
  value       = google_discovery_engine_search_engine.nutrition_search_engine.engine_id
}

output "nutrition_pdfs_bucket_name" {
  description = "Cloud Storage bucket name for nutrition PDFs"
  value       = google_storage_bucket.nutrition_pdfs_bucket.name
}