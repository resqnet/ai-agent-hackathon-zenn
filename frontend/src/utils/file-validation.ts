// ファイル形式・サイズバリデーション機能

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export interface FileValidationOptions {
  maxSize?: number; // バイト単位
  allowedTypes?: string[]; // MIMEタイプ
  allowedExtensions?: string[]; // 拡張子
  minWidth?: number; // 最小画像幅
  minHeight?: number; // 最小画像高さ
  maxWidth?: number; // 最大画像幅
  maxHeight?: number; // 最大画像高さ
}

// デフォルト設定
const DEFAULT_OPTIONS: Required<FileValidationOptions> = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  minWidth: 100,
  minHeight: 100,
  maxWidth: 4096,
  maxHeight: 4096,
};

/**
 * ファイルの基本バリデーション（サイズ・形式）
 */
export function validateFile(file: File, options: Partial<FileValidationOptions> = {}): FileValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const warnings: string[] = [];

  // ファイルサイズチェック
  if (file.size > opts.maxSize) {
    return {
      isValid: false,
      error: `ファイルサイズが大きすぎます。最大サイズ: ${formatFileSize(opts.maxSize)}`
    };
  }

  // ファイル形式チェック（MIMEタイプ）
  if (!opts.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `対応していないファイル形式です。対応形式: ${opts.allowedExtensions.join(', ')}`
    };
  }

  // ファイル拡張子チェック
  const extension = getFileExtension(file.name);
  if (!opts.allowedExtensions.includes(extension.toLowerCase())) {
    return {
      isValid: false,
      error: `対応していない拡張子です。対応拡張子: ${opts.allowedExtensions.join(', ')}`
    };
  }

  // ファイルサイズの警告
  if (file.size > 5 * 1024 * 1024) { // 5MB以上
    warnings.push('ファイルサイズが大きいため、アップロードに時間がかかる場合があります');
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * 画像の詳細バリデーション（寸法・品質）
 */
export function validateImageDimensions(file: File, options: Partial<FileValidationOptions> = {}): Promise<FileValidationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    const warnings: string[] = [];

    img.onload = () => {
      URL.revokeObjectURL(url);

      // 最小サイズチェック
      if (img.width < opts.minWidth || img.height < opts.minHeight) {
        resolve({
          isValid: false,
          error: `画像サイズが小さすぎます。最小サイズ: ${opts.minWidth}x${opts.minHeight}px`
        });
        return;
      }

      // 最大サイズチェック
      if (img.width > opts.maxWidth || img.height > opts.maxHeight) {
        resolve({
          isValid: false,
          error: `画像サイズが大きすぎます。最大サイズ: ${opts.maxWidth}x${opts.maxHeight}px`
        });
        return;
      }

      // アスペクト比の警告
      const aspectRatio = img.width / img.height;
      if (aspectRatio > 3 || aspectRatio < 0.33) {
        warnings.push('画像のアスペクト比が極端です。正方形に近い画像の方が分析精度が向上します');
      }

      // 解像度の警告
      if (img.width < 300 || img.height < 300) {
        warnings.push('画像解像度が低めです。より高解像度の画像を使用すると分析精度が向上します');
      }

      resolve({
        isValid: true,
        warnings: warnings.length > 0 ? warnings : undefined
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        isValid: false,
        error: '画像ファイルが破損しているか、読み込めません'
      });
    };

    img.src = url;
  });
}

/**
 * 包括的なファイルバリデーション
 */
export async function validateImageFile(file: File, options: Partial<FileValidationOptions> = {}): Promise<FileValidationResult> {
  // 基本バリデーション
  const basicValidation = validateFile(file, options);
  if (!basicValidation.isValid) {
    return basicValidation;
  }

  // 画像寸法バリデーション
  const dimensionValidation = await validateImageDimensions(file, options);
  if (!dimensionValidation.isValid) {
    return dimensionValidation;
  }

  // 警告をマージ
  const allWarnings = [
    ...(basicValidation.warnings || []),
    ...(dimensionValidation.warnings || [])
  ];

  return {
    isValid: true,
    warnings: allWarnings.length > 0 ? allWarnings : undefined
  };
}

/**
 * ファイルサイズを人間が読みやすい形式にフォーマット
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * ファイル名から拡張子を取得
 */
export function getFileExtension(filename: string): string {
  return filename.slice(filename.lastIndexOf('.'));
}

/**
 * セキュリティ関連のファイルバリデーション
 */
export function validateFileSecurity(file: File): FileValidationResult {
  // ファイル名に危険な文字が含まれていないかチェック
  const dangerousChars = /[<>:"/\\|?*\x00-\x1F]/;
  if (dangerousChars.test(file.name)) {
    return {
      isValid: false,
      error: 'ファイル名に無効な文字が含まれています'
    };
  }

  // ファイル名が長すぎないかチェック
  if (file.name.length > 255) {
    return {
      isValid: false,
      error: 'ファイル名が長すぎます'
    };
  }

  // 隠しファイルや実行ファイルのチェック
  if (file.name.startsWith('.') || file.name.endsWith('.exe')) {
    return {
      isValid: false,
      error: '許可されていないファイル形式です'
    };
  }

  return { isValid: true };
}

/**
 * カスタムエラーメッセージ生成
 */
export function getValidationErrorMessage(result: FileValidationResult): string {
  if (result.isValid) return '';
  
  return result.error || '不明なエラーが発生しました';
}

/**
 * 警告メッセージ生成
 */
export function getValidationWarnings(result: FileValidationResult): string[] {
  return result.warnings || [];
}