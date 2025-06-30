'use client';

import React from 'react';
import { Info } from 'lucide-react';
import type { ValidationRules } from '@/utils/validation';

interface InputLimitsProps {
  rules: ValidationRules;
  className?: string;
  showIcon?: boolean;
}

export const InputLimits: React.FC<InputLimitsProps> = ({ 
  rules, 
  className = '', 
  showIcon = true 
}) => {
  const items: string[] = [];

  // 文字数制限
  if (rules.maxLength) {
    items.push(`最大${rules.maxLength}文字まで`);
  }

  // 最小文字数
  if (rules.minLength && rules.minLength > 0) {
    items.push(`${rules.minLength}文字以上`);
  }

  // 使用可能文字の説明
  if (rules.allowedChars) {
    // パターンに応じて説明を生成
    const pattern = rules.allowedChars.source;
    
    if (pattern.includes('ぁ-んァ-ヶー一-龯') && pattern.includes('a-zA-Z0-9')) {
      items.push('日本語、英数字、スペースのみ使用可能');
    } else if (pattern.includes('ぁ-んァ-ヶー一-龯')) {
      items.push('日本語文字のみ使用可能');
    } else if (pattern.includes('a-zA-Z0-9')) {
      items.push('英数字のみ使用可能');
    } else {
      items.push('使用可能文字に制限があります');
    }
  }

  // 必須入力
  if (rules.required) {
    items.push('入力必須項目');
  }

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={`input-limits text-sm text-gray-500 ${className}`}>
      <div className="flex items-start gap-1">
        {showIcon && <Info size={12} className="mt-0.5 flex-shrink-0" />}
        <ul className="space-y-0.5">
          {items.map((item, index) => (
            <li key={index} className="flex items-start">
              <span className="text-gray-400 mr-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};