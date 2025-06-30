"use client";
import { FoodItem } from "@/types/meal";

interface NutritionSummaryProps {
  foods: FoodItem[];
  showDetails?: boolean;
}

export const NutritionSummary = ({
  foods,
  showDetails = false,
}: NutritionSummaryProps) => {
  const foodCount = foods.length;

  if (!showDetails) {
    // 簡易表示
    return (
      <div className="flex justify-center items-center">
        <div className="flex flex-col items-center">
          <div className="text-xs text-muted-foreground mb-1">
            🍽️ 食材数
          </div>
          <div className="text-xs text-center">
            {foodCount}品目
          </div>
        </div>
      </div>
    );
  }

  // 詳細表示
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm">🍽️</span>
            <span className="text-sm font-medium text-foreground">食材数</span>
          </div>
          <div className="flex items-center">
            <span className="text-xs text-muted-foreground">
              {foodCount}品目
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};