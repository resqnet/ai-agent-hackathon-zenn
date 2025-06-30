// 食材カード用の分量表示

import React from 'react';

interface MealServingDotProps {
  servings: number;
  icon?: string;
}

export const MealServingDot: React.FC<MealServingDotProps> = ({ 
  servings, 
  icon 
}) => {
  return (
    <div className="flex items-center gap-1">
      {icon && <span className="text-xs">{icon}</span>}
      <div className="flex gap-0.5">
        {Array.from({ length: Math.ceil(servings) }, (_, i) => {
          const dotValue = i + 1;
          const isFull = servings >= dotValue;
          const isHalf = !isFull && servings >= dotValue - 0.5;

          return (
            <div key={i} className="relative w-2 h-2">
              {/* 背景の空ドット */}
              <div className="w-2 h-2 rounded-full bg-muted absolute" />
              {/* 満ドット */}
              {isFull && (
                <div className={`w-2 h-2 rounded-full absolute bg-primary`} />
              )}
              {/* 半ドット */}
              {isHalf && (
                <div className={`w-2 h-2 rounded-full absolute bg-primary`} style={{
                  clipPath: 'polygon(0% 0%, 50% 0%, 50% 100%, 0% 100%)'
                }} />
              )}
            </div>
          );
        })}
      </div>
      <span className="text-sm text-foreground ml-1">{servings}つ</span>
    </div>
  );
};