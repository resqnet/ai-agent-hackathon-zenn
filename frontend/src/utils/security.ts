/**
 * セキュリティ関連のユーティリティ関数
 * XSS攻撃対策とHTMLエスケープ機能を提供
 */

/**
 * HTMLエスケープ文字マップ
 */
const HTML_ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * HTMLエスケープ処理
 * 危険な文字を安全なHTMLエンティティに変換
 */
export function escapeHtml(text: string): string {
  if (typeof text !== 'string') {
    return String(text);
  }
  
  return text.replace(/[&<>"'`=\/]/g, (match) => HTML_ESCAPE_MAP[match] || match);
}

/**
 * 入力サニタイズ処理
 * HTMLタグとスクリプトを除去
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return String(input);
  }

  // HTMLタグとスクリプトを除去
  const sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // script タグを除去
    .replace(/<[^>]*>/g, '') // その他のHTMLタグを除去
    .replace(/javascript:/gi, '') // JavaScript URL を除去
    .replace(/on\w+\s*=/gi, ''); // イベントハンドラー属性を除去

  // HTML エスケープを適用
  return escapeHtml(sanitized);
}

/**
 * 安全なテキスト表示用処理
 * 表示前にHTMLエスケープを適用
 */
export function safeText(text: string): string {
  return escapeHtml(text);
}

/**
 * URLのバリデーション
 * 危険なプロトコルをチェック
 */
export function isValidUrl(url: string): boolean {
  if (typeof url !== 'string') {
    return false;
  }

  // 危険なプロトコルをチェック
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  const lowerUrl = url.toLowerCase();
  
  return !dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol));
}

/**
 * CSRFトークン生成
 * セッション毎にユニークなトークンを生成
 */
export function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}