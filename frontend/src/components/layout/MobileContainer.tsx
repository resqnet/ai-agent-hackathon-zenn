// モバイル向けコンテナ

import React from 'react';

interface MobileContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileContainer: React.FC<MobileContainerProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`flex-1 flex flex-col bg-gradient-to-b from-red-100 to-yellow-50 min-h-0 ${className}`}>
      {children}
    </div>
  );
};