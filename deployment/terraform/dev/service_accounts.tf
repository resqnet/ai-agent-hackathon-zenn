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

# Service account for the application
resource "google_service_account" "app_service_account" {
  project      = var.dev_project_id
  account_id   = "${var.project_name}-app-sa"
  display_name = "${var.project_name} Application Service Account"
  description  = "Service account for ${var.project_name} application"
}

# Grant permissions to the app service account
resource "google_project_iam_member" "app_sa_permissions" {
  for_each = toset(var.agentengine_sa_roles)
  
  project = var.dev_project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.app_service_account.email}"
  
  depends_on = [google_service_account.app_service_account]
}