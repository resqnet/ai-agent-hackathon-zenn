import { AlertCircle, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';

interface ErrorMessageProps {
  message: string;
  title?: string;
  icon?: ReactNode;
  variant?: 'error' | 'warning' | 'info';
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorMessage({
  message,
  title = 'エラー',
  icon,
  variant = 'error',
  dismissible = false,
  onDismiss,
  className,
}: ErrorMessageProps) {
  const variantStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const iconColor = {
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500',
  };

  const defaultIcon = <AlertCircle className={cn('w-5 h-5', iconColor[variant])} />;

  return (
    <div
      className={cn(
        'p-4 border rounded-lg flex items-start space-x-3',
        variantStyles[variant],
        className
      )}
      role="alert"
    >
      <div className="flex-shrink-0 mt-0.5">
        {icon || defaultIcon}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm mt-1">{message}</p>
      </div>
      {dismissible && onDismiss && (
        <Button
          type="button"
          onClick={onDismiss}
          variant="ghost"
          size="icon"
          className={cn(
            'flex-shrink-0 h-6 w-6 rounded-full hover:bg-opacity-20 hover:bg-current',
            iconColor[variant]
          )}
          aria-label="エラーを閉じる"
        >
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}