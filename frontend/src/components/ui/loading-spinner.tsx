import { Loader2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  overlay?: boolean;
  className?: string;
  icon?: ReactNode;
}

export function LoadingSpinner({
  size = 'md',
  text = '読み込み中...',
  overlay = false,
  className,
  icon,
}: LoadingSpinnerProps) {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  const content = (
    <div className={cn(
      'flex items-center justify-center gap-3',
      overlay && 'flex-col space-y-2',
      className
    )}>
      {icon || (
        <Loader2 
          className={cn(
            'animate-spin text-gray-600',
            sizeStyles[size]
          )} 
        />
      )}
      {text && (
        <span className={cn(
          'text-gray-600 font-medium',
          textSizes[size]
        )}>
          {text}
        </span>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
          {content}
        </div>
      </div>
    );
  }

  return content;
}

interface LoadingSpinnerInlineProps {
  text?: string;
  size?: 'sm' | 'md';
}

export function LoadingSpinnerInline({ 
  text = '送信中...', 
  size = 'sm' 
}: LoadingSpinnerInlineProps) {
  return (
    <LoadingSpinner
      size={size}
      text={text}
      className="inline-flex"
    />
  );
}