/**
 * 入力バリデーション関連のユーティリティ関数
 */

export interface ValidationRules {
  maxLength?: number;
  minLength?: number;
  allowedChars?: RegExp;
  required?: boolean;
  trimWhitespace?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue: string;
}

/**
 * 文字数制限とパターンマッチングによる入力バリデーション
 */
export function validateInput(value: string, rules: ValidationRules): ValidationResult {
  const errors: string[] = [];
  let sanitizedValue = value;

  // 空白文字のトリミング
  if (rules.trimWhitespace !== false) {
    sanitizedValue = sanitizedValue.trim();
  }

  // 必須チェック
  if (rules.required && !sanitizedValue) {
    errors.push('入力が必要です');
    return {
      isValid: false,
      errors,
      sanitizedValue
    };
  }

  // 最小文字数チェック
  if (rules.minLength && sanitizedValue.length < rules.minLength) {
    errors.push(`${rules.minLength}文字以上で入力してください`);
  }

  // 最大文字数チェック
  if (rules.maxLength && sanitizedValue.length > rules.maxLength) {
    errors.push(`${rules.maxLength}文字以内で入力してください`);
  }

  // 使用可能文字のチェック
  if (rules.allowedChars && sanitizedValue && !rules.allowedChars.test(sanitizedValue)) {
    errors.push('使用できない文字が含まれています');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue
  };
}

/**
 * 食材名用のバリデーションルール
 */
export const foodNameRules: ValidationRules = {
  maxLength: 200,
  minLength: 1,
  allowedChars: /^[ぁ-んァ-ヶー一-龯a-zA-Z0-9\s\u3099\u309A\u30FC()（）・※]+$/,
  required: true,
  trimWhitespace: true
};

/**
 * メモ用のバリデーションルール
 */
export const notesRules: ValidationRules = {
  maxLength: 500,
  minLength: 0,
  allowedChars: /^[ぁ-んァ-ヶー一-龯a-zA-Z0-9\s\u3099\u309A\u30FC()（）・※\n\r.,!?！？。、]+$/,
  required: false,
  trimWhitespace: true
};

/**
 * チャットメッセージ用のバリデーションルール
 */
export const chatMessageRules: ValidationRules = {
  maxLength: 1000,
  minLength: 1,
  // より寛容な正規表現：制御文字以外のほぼ全ての文字を許可（HTMLタグ除外）
  allowedChars: /^[^\x00-\x08\x0B\x0C\x0E-\x1F\x7F<>]+$/,
  required: true,
  trimWhitespace: true
};

/**
 * 子どもの名前用のバリデーションルール
 */
export const childNameRules: ValidationRules = {
  maxLength: 50,
  minLength: 0,
  allowedChars: /^[ぁ-んァ-ヶー一-龯a-zA-Z\s\u3099\u309A]*$/,
  required: false,
  trimWhitespace: true
};

/**
 * アレルギー名用のバリデーションルール
 */
export const allergyNameRules: ValidationRules = {
  maxLength: 100,
  minLength: 1,
  allowedChars: /^[ぁ-んァ-ヶー一-龯a-zA-Z0-9\s\u3099\u309A\u30FC()（）・※]+$/,
  required: true,
  trimWhitespace: true
};

/**
 * 数値入力用のバリデーション
 */
export function validateNumber(
  value: string | number,
  min?: number,
  max?: number
): ValidationResult {
  const errors: string[] = [];
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const sanitizedValue = String(numValue);

  if (isNaN(numValue)) {
    errors.push('有効な数値を入力してください');
    return {
      isValid: false,
      errors,
      sanitizedValue: ''
    };
  }

  if (min !== undefined && numValue < min) {
    errors.push(`${min}以上の値を入力してください`);
  }

  if (max !== undefined && numValue > max) {
    errors.push(`${max}以下の値を入力してください`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue
  };
}

/**
 * 画像ファイルの検証
 */
export function validateImageFile(file: File): ValidationResult {
  const errors: string[] = [];
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  // ファイルサイズチェック
  if (file.size > maxSize) {
    errors.push('ファイルサイズは10MB以下にしてください');
  }

  // ファイル形式チェック
  if (!allowedTypes.includes(file.type)) {
    errors.push('JPEG、PNG、GIF、WebP形式の画像ファイルをアップロードしてください');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: file.name
  };
}