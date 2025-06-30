"use client";
import { MealType, FoodItem } from "@/types/meal";
import { FoodItemCard } from "./FoodItemCard";
import { AddFoodButtons } from "./AddFoodButtons";

interface MealSectionProps {
  mealType: MealType;
  foods: FoodItem[];
  isCompact?: boolean;
  onEditFood: (mealType: MealType, index: number, food: FoodItem) => void;
  onAddFood: (mealType: MealType) => void;
  onImageAnalysis: (mealType: MealType, file?: File) => void;
}

export const MealSection = ({
  mealType,
  foods,
  onEditFood,
  onAddFood,
  onImageAnalysis,
}: MealSectionProps) => {
  const hasFoods = foods.length > 0;

  return (
    <div>
      {hasFoods ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-muted-foreground">
              {foods.length}品目登録済み
            </div>
            <AddFoodButtons
              variant="compact"
              mealType={mealType}
              onAddFood={onAddFood}
              onImageAnalysis={onImageAnalysis}
            />
          </div>
          <div className="space-y-2">
            {foods.map((food, index) => (
              <FoodItemCard
                key={index}
                food={food}
                index={index}
                mealType={mealType}
                onEdit={onEditFood}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-2xl p-8 text-center border-2 border-dashed border-border min-h-[120px] flex flex-col justify-center">
          <div className="text-4xl mb-3">🍽️</div>
          <div className="text-muted-foreground mb-6 text-sm">
            まだ{mealType === 'breakfast' ? '朝食' : mealType === 'lunch' ? '昼食' : '夕食'}の記録がありません
          </div>
          <AddFoodButtons
            mealType={mealType}
            onAddFood={onAddFood}
            onImageAnalysis={onImageAnalysis}
          />
        </div>
      )}
    </div>
  );
};