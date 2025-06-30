/**
 * PDFファイル名の表示名変換ユーティリティ
 */

/**
 * PDFファイル名の表示名を日本語に変換する関数
 * バックエンドの app/utils/typing.py の get_pdf_display_name() と同じ機能
 */
export function getPdfDisplayName(filename: string): string {
  const pdfDisplayNames: Record<string, string> = {
    "MHLW_DietaryReferenceIntakes_2025_InfantChild.pdf": "日本人の食事摂取基準（2025年版）",
    "MHLW_NurserySchool_MealProvisionGuideline_2012.pdf": "保育所における食事の提供ガイドライン（2012年版）",
  };

  // .pdfファイル名から拡張子を除去して比較
  const baseFilename = filename.replace(/\.pdf$/i, "").replace(/\.PDF$/i, "");
  
  for (const [pdfKey, displayName] of Object.entries(pdfDisplayNames)) {
    const basePdfKey = pdfKey.replace(/\.pdf$/i, "");
    if (basePdfKey === baseFilename || baseFilename.includes(basePdfKey) || basePdfKey.includes(baseFilename)) {
      return displayName;
    }
  }

  // マッチしない場合は元のファイル名を返す
  return filename;
}

/**
 * テキスト内のPDFファイル名を表示名に置換する関数
 * チャットメッセージやAPIレスポンス内のPDFファイル名を一括変換
 */
export function replacePdfNamesInText(text: string): string {
  const pdfDisplayNames: Record<string, string> = {
    "MHLW_DietaryReferenceIntakes_2025_InfantChild.pdf": "日本人の食事摂取基準（2025年版）",
    "MHLW_NurserySchool_MealProvisionGuideline_2012.pdf": "保育所における食事の提供ガイドライン（2012年版）",
  };

  let result = text;
  
  for (const [originalName, displayName] of Object.entries(pdfDisplayNames)) {
    // 大文字小文字を区別せずに置換
    const regex = new RegExp(originalName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(regex, displayName);
  }

  return result;
}