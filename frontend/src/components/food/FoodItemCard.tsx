// 食材カードコンポーネント

import React from 'react';
import { FoodItem, MealType } from '@/types/meal';

interface FoodItemCardProps {
  food: FoodItem;
  index: number;
  mealType: MealType;
  onEdit: (mealType: MealType, foodIndex: number, food: FoodItem) => void;
}

export const FoodItemCard: React.FC<FoodItemCardProps> = ({
  food,
  index,
  mealType,
  onEdit
}) => {
  return (
    <div
      className="bg-card rounded-lg p-3 shadow-sm cursor-pointer transform transition-transform hover:-translate-y-0.5 hover:shadow-md border border-border"
      onClick={() => onEdit(mealType, index, { ...food })}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-sm font-medium text-foreground truncate">{food.name}</span>
        </div>
      </div>
      {food.memo && food.memo.trim() && (
        <div className="mt-1 text-xs text-muted-foreground truncate">
          {food.memo}
        </div>
      )}
    </div>
  );
};