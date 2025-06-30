/**
 * LINE風の日時表示フォーマットユーティリティ
 */

/**
 * 指定した日時をLINE風の短縮形式で表示する
 * @param date 対象の日時
 * @returns フォーマットされた日時文字列
 */
export function formatConversationTime(date: Date | string): string {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

  // 今日の場合: "14:30"
  if (targetDay.getTime() === today.getTime()) {
    return targetDate.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
  }

  // 昨日の場合: "昨日"
  if (targetDay.getTime() === yesterday.getTime()) {
    return '昨日';
  }

  // 今年の場合: "12/25"
  if (targetDate.getFullYear() === now.getFullYear()) {
    return targetDate.toLocaleDateString('ja-JP', { 
      month: 'numeric', 
      day: 'numeric' 
    });
  }

  // 去年以前の場合: "2023/12/25"
  return targetDate.toLocaleDateString('ja-JP', { 
    year: 'numeric',
    month: 'numeric', 
    day: 'numeric' 
  });
}

/**
 * セッション名として表示する文字列を生成する
 * displayNameがあればそれを使用、なければ作成日時から生成
 * @param displayName セッションのdisplayName
 * @param createTime セッションの作成日時
 * @returns 表示用のセッション名
 */
export function formatSessionDisplayName(displayName: string | null | undefined, createTime: Date | string): string {
  if (displayName && displayName.trim()) {
    return displayName.trim();
  }

  const createdDate = typeof createTime === 'string' ? new Date(createTime) : createTime;
  return `${createdDate.toLocaleDateString('ja-JP', { 
    month: 'numeric', 
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })}の相談`;
}