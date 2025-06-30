// ページコンテンツ用コンテナ

import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`flex-1 p-4 pb-24 ${className}`}>
      {children}
    </div>
  );
};