/**
 * メッセージパーサー
 * AIレスポンスを構造化されたセクションに分割する
 */

export interface MessageSection {
  id: string
  title: string
  content: string
  type: 'summary' | 'nutrition' | 'recipe' | 'advice' | 'general'
  isCollapsible: boolean
}

/**
 * メッセージを解析してセクションに分割
 */
export function parseMessage(message: string): MessageSection[] {
  const sections: MessageSection[] = []
  
  // セクションマーカーのパターン
  const patterns = {
    nutrition: /(?:栄養|栄養分析|栄養バランス|栄養評価)[：:]/,
    recipe: /(?:レシピ|作り方|材料|調理)[：:]/,
    advice: /(?:アドバイス|ポイント|注意点|提案)[：:]/,
  }
  
  // 行ごとに分割して処理
  const lines = message.split('\n')
  let currentSection: MessageSection | null = null
  let currentContent: string[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // 空行はスキップ
    if (!line) {
      if (currentContent.length > 0) {
        currentContent.push('')
      }
      continue
    }
    
    // セクションタイトルの検出
    let sectionDetected = false
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(line)) {
        // 現在のセクションを保存
        if (currentSection && currentContent.length > 0) {
          currentSection.content = currentContent.join('\n').trim()
          sections.push(currentSection)
        }
        
        // 新しいセクションを開始
        currentSection = {
          id: `section-${sections.length}`,
          title: line,
          content: '',
          type: type as MessageSection['type'],
          isCollapsible: true,
        }
        currentContent = []
        sectionDetected = true
        break
      }
    }
    
    // セクションタイトルでない場合はコンテンツに追加
    if (!sectionDetected) {
      currentContent.push(line)
    }
  }
  
  // 最後のセクションを保存
  if (currentSection && currentContent.length > 0) {
    currentSection.content = currentContent.join('\n').trim()
    sections.push(currentSection)
  } else if (sections.length === 0 && currentContent.length > 0) {
    // セクションが検出されなかった場合は全体を1つのセクションとして扱う
    sections.push({
      id: 'section-0',
      title: '',
      content: currentContent.join('\n').trim(),
      type: 'general',
      isCollapsible: false,
    })
  }
  
  return sections
}

/**
 * メッセージの要約を生成
 */
export function generateSummary(message: string): string {
  const maxLength = 100
  
  // 最初の文を探す
  const firstSentence = message.match(/^[^。！？\n]+[。！？]/)?.[0]
  if (firstSentence && firstSentence.length <= maxLength) {
    return firstSentence
  }
  
  // 長すぎる場合は切り詰める
  if (message.length > maxLength) {
    return message.substring(0, maxLength) + '...'
  }
  
  return message
}

/**
 * セクションが長いかどうかを判定
 */
export function isSectionLong(content: string): boolean {
  const lines = content.split('\n').filter(line => line.trim())
  return lines.length > 5 || content.length > 300
}