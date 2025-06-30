'use client';

import React from 'react';
import { cn } from '@/utils/cn';

interface UploadProgressProps {
  progress: number;
  status?: 'uploading' | 'processing' | 'completed' | 'error';
  className?: string;
  showPercentage?: boolean;
  label?: string;
}

export const UploadProgress: React.FC<UploadProgressProps> = ({
  progress,
  status = 'uploading',
  className,
  showPercentage = true,
  label,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'uploading':
        return 'bg-blue-500';
      case 'processing':
        return 'bg-orange-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getStatusText = () => {
    if (label) return label;
    
    switch (status) {
      case 'uploading':
        return 'アップロード中...';
      case 'processing':
        return '画像を分析中...';
      case 'completed':
        return '分析完了';
      case 'error':
        return 'エラーが発生しました';
      default:
        return '';
    }
  };

  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={cn('w-full space-y-2', className)}>
      {/* プログレスバー */}
      <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out rounded-full',
            getStatusColor(),
            status === 'error' && 'animate-pulse'
          )}
          style={{ 
            width: `${clampedProgress}%`,
            transition: 'width 0.3s ease-out'
          }}
        />
        
        {/* アニメーション効果（処理中のみ） */}
        {(status === 'uploading' || status === 'processing') && clampedProgress < 100 && (
          <div 
            className="absolute top-0 left-0 h-full w-full opacity-20 bg-white animate-pulse"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
              backgroundSize: '50% 100%',
              animation: 'shimmer 2s infinite'
            }}
          />
        )}
      </div>

      {/* ステータステキストと進捗率 */}
      <div className="flex justify-between items-center text-sm">
        <span className={cn(
          'font-medium',
          status === 'completed' && 'text-green-600',
          status === 'error' && 'text-red-600',
          status === 'uploading' && 'text-blue-600',
          status === 'processing' && 'text-orange-600'
        )}>
          {getStatusText()}
        </span>
        
        {showPercentage && (
          <span className={cn(
            'font-mono text-xs',
            status === 'completed' && 'text-green-500',
            status === 'error' && 'text-red-500',
            (status === 'uploading' || status === 'processing') && 'text-gray-600'
          )}>
            {clampedProgress}%
          </span>
        )}
      </div>
    </div>
  );
};

// アニメーション用のCSS（グローバルに追加する必要がある場合）
export const uploadProgressStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(200%); }
  }
`;