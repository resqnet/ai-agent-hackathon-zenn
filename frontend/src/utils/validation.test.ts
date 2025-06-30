/**
 * バリデーション関数のテスト
 */

import { validateInput, validateNumber, validateImageFile, foodNameRules, notesRules, chatMessageRules, childNameRules, allergyNameRules } from './validation';

describe('validateInput', () => {
  describe('基本的な文字数制限テスト', () => {
    const rules = { maxLength: 10, minLength: 2, required: true };

    test('正常な入力値', () => {
      const result = validateInput('正常な値', rules);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitizedValue).toBe('正常な値');
    });

    test('最大文字数を超過', () => {
      const result = validateInput('これは最大文字数を超過する入力値です', rules);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('10文字以内で入力してください');
    });

    test('最小文字数未満', () => {
      const result = validateInput('短', rules);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('2文字以上で入力してください');
    });

    test('空文字（必須）', () => {
      const result = validateInput('', rules);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('入力が必要です');
    });

    test('空白のみ（必須）', () => {
      const result = validateInput('   ', rules);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('入力が必要です');
    });
  });

  describe('特殊文字制限テスト', () => {
    const rules = { 
      maxLength: 100,
      allowedChars: /^[ぁ-んァ-ヶー一-龯a-zA-Z0-9\s]+$/,
      required: true 
    };

    test('許可された文字のみ', () => {
      const result = validateInput('ひらがなカタカナ漢字abc123', rules);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('特殊文字を含む', () => {
      const result = validateInput('テスト@#$%', rules);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('使用できない文字が含まれています');
    });

    test('HTMLタグを含む', () => {
      const result = validateInput('<script>alert("test")</script>', rules);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('使用できない文字が含まれています');
    });

    test('SQLインジェクション用文字列', () => {
      const result = validateInput("'; DROP TABLE users; --", rules);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('使用できない文字が含まれています');
    });
  });

  describe('空白のトリミング', () => {
    const rules = { maxLength: 10, required: true };

    test('前後の空白をトリミング', () => {
      const result = validateInput('  テスト  ', rules);
      expect(result.sanitizedValue).toBe('テスト');
      expect(result.isValid).toBe(true);
    });

    test('トリミング無効化', () => {
      const rulesNoTrim = { ...rules, trimWhitespace: false };
      const result = validateInput('  テスト  ', rulesNoTrim);
      expect(result.sanitizedValue).toBe('  テスト  ');
    });
  });
});

describe('事前定義されたルールのテスト', () => {
  describe('foodNameRules', () => {
    test('正常な食材名', () => {
      const result = validateInput('ご飯', foodNameRules);
      expect(result.isValid).toBe(true);
    });

    test('英数字を含む食材名', () => {
      const result = validateInput('ビタミンD3', foodNameRules);
      expect(result.isValid).toBe(true);
    });

    test('200文字を超過', () => {
      const longText = 'あ'.repeat(201);
      const result = validateInput(longText, foodNameRules);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('200文字以内で入力してください');
    });

    test('空文字', () => {
      const result = validateInput('', foodNameRules);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('入力が必要です');
    });
  });

  describe('notesRules', () => {
    test('正常なメモ', () => {
      const result = validateInput('美味しく食べました。', notesRules);
      expect(result.isValid).toBe(true);
    });

    test('空のメモ（任意）', () => {
      const result = validateInput('', notesRules);
      expect(result.isValid).toBe(true);
    });

    test('500文字を超過', () => {
      const longText = 'あ'.repeat(501);
      const result = validateInput(longText, notesRules);
      expect(result.isValid).toBe(false);
    });
  });

  describe('chatMessageRules', () => {
    test('正常なチャットメッセージ', () => {
      const result = validateInput('こんにちは！お疲れさまです。', chatMessageRules);
      expect(result.isValid).toBe(true);
    });

    test('1000文字を超過', () => {
      const longText = 'あ'.repeat(1001);
      const result = validateInput(longText, chatMessageRules);
      expect(result.isValid).toBe(false);
    });

    test('空のメッセージ', () => {
      const result = validateInput('', chatMessageRules);
      expect(result.isValid).toBe(false);
    });
  });

  describe('childNameRules', () => {
    test('正常な子どもの名前', () => {
      const result = validateInput('太郎', childNameRules);
      expect(result.isValid).toBe(true);
    });

    test('空の名前（任意）', () => {
      const result = validateInput('', childNameRules);
      expect(result.isValid).toBe(true);
    });

    test('英字の名前', () => {
      const result = validateInput('Taro', childNameRules);
      expect(result.isValid).toBe(true);
    });

    test('50文字を超過', () => {
      const longName = 'あ'.repeat(51);
      const result = validateInput(longName, childNameRules);
      expect(result.isValid).toBe(false);
    });

    test('数字を含む（無効）', () => {
      const result = validateInput('太郎123', childNameRules);
      expect(result.isValid).toBe(false);
    });
  });

  describe('allergyNameRules', () => {
    test('正常なアレルギー名', () => {
      const result = validateInput('卵', allergyNameRules);
      expect(result.isValid).toBe(true);
    });

    test('詳細なアレルギー名', () => {
      const result = validateInput('乳製品（牛乳・チーズ等）', allergyNameRules);
      expect(result.isValid).toBe(true);
    });

    test('空のアレルギー名', () => {
      const result = validateInput('', allergyNameRules);
      expect(result.isValid).toBe(false);
    });

    test('100文字を超過', () => {
      const longText = 'あ'.repeat(101);
      const result = validateInput(longText, allergyNameRules);
      expect(result.isValid).toBe(false);
    });
  });
});

describe('validateNumber', () => {
  test('正常な数値', () => {
    const result = validateNumber(10, 1, 100);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe('10');
  });

  test('文字列の数値', () => {
    const result = validateNumber('10', 1, 100);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe('10');
  });

  test('最小値未満', () => {
    const result = validateNumber(0, 1, 100);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('1以上の値を入力してください');
  });

  test('最大値超過', () => {
    const result = validateNumber(101, 1, 100);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('100以下の値を入力してください');
  });

  test('数値でない文字列', () => {
    const result = validateNumber('abc', 1, 100);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('有効な数値を入力してください');
  });

  test('小数点を含む数値', () => {
    const result = validateNumber(10.5, 1, 100);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedValue).toBe('10.5');
  });
});

describe('validateImageFile', () => {
  test('正常なJPEG画像', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
    
    const result = validateImageFile(file);
    expect(result.isValid).toBe(true);
  });

  test('正常なPNG画像', () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
    
    const result = validateImageFile(file);
    expect(result.isValid).toBe(true);
  });

  test('ファイルサイズ超過（10MB超過）', () => {
    const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 }); // 11MB
    
    const result = validateImageFile(file);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('ファイルサイズは10MB以下にしてください');
  });

  test('無効なファイル形式', () => {
    const file = new File([''], 'test.txt', { type: 'text/plain' });
    Object.defineProperty(file, 'size', { value: 1024 }); // 1KB
    
    const result = validateImageFile(file);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('JPEG、PNG、GIF、WebP形式の画像ファイルをアップロードしてください');
  });

  test('正常なWebP画像', () => {
    const file = new File([''], 'test.webp', { type: 'image/webp' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
    
    const result = validateImageFile(file);
    expect(result.isValid).toBe(true);
  });

  test('GIF画像', () => {
    const file = new File([''], 'test.gif', { type: 'image/gif' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB
    
    const result = validateImageFile(file);
    expect(result.isValid).toBe(true);
  });
});

describe('セキュリティテスト', () => {
  const rules = { 
    maxLength: 100, 
    allowedChars: /^[ぁ-んァ-ヶー一-龯a-zA-Z0-9\s()（）・※]+$/,
    required: true 
  };

  test('XSS攻撃防止', () => {
    const maliciousInputs = [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img src="x" onerror="alert(1)">',
      '&lt;script&gt;alert("xss")&lt;/script&gt;',
    ];

    maliciousInputs.forEach(input => {
      const result = validateInput(input, rules);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('使用できない文字が含まれています');
    });
  });

  test('SQLインジェクション防止', () => {
    const maliciousInputs = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "UNION SELECT * FROM users--",
      "1'; DELETE FROM users; --",
    ];

    maliciousInputs.forEach(input => {
      const result = validateInput(input, rules);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('使用できない文字が含まれています');
    });
  });

  test('コマンドインジェクション防止', () => {
    const maliciousInputs = [
      '$(rm -rf /)',
      '`cat /etc/passwd`',
      '|ls -la',
      '&& rm -rf /',
    ];

    maliciousInputs.forEach(input => {
      const result = validateInput(input, rules);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('使用できない文字が含まれています');
    });
  });
});