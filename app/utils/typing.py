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
from typing import (
    Literal,
)

from pydantic import (
    BaseModel,
)


def get_pdf_display_name(filename: str) -> str:
    """PDFファイル名の表示名を日本語に変換する関数"""
    pdf_display_names = {
        "MHLW_DietaryReferenceIntakes_2025_InfantChild.pdf": "日本人の食事摂取基準（2025年版）",
        "MHLW_NurserySchool_MealProvisionGuideline_2012.pdf": "保育所における食事の提供ガイドライン（2012年版）",
    }

    # .pdfファイル名から拡張子を除去して比較
    base_filename = filename.replace(".pdf", "").replace(".PDF", "")
    for pdf_key, display_name in pdf_display_names.items():
        if pdf_key.replace(
            ".pdf", ""
        ) in base_filename or base_filename in pdf_key.replace(".pdf", ""):
            return display_name

    # マッチしない場合は元のファイル名を返す
    return filename


class Feedback(BaseModel):
    """Represents feedback for a conversation."""

    score: int | float
    text: str | None = ""
    invocation_id: str
    log_type: Literal["feedback"] = "feedback"
    service_name: Literal["kids-food-advisor"] = "kids-food-advisor"
    user_id: str = ""
