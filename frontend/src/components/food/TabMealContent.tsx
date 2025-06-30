"use client";
import { MealType, FoodItem } from "@/types/meal";
import { MealSection } from "./MealSection";

interface TabMealContentProps {
  mealType: MealType;
  foods: FoodItem[];
  onEditFood: (mealType: MealType, index: number, food: FoodItem) => void;
  onAddFood: (mealType: MealType) => void;
  onImageAnalysis: (mealType: MealType, file?: File) => void;
}

export const TabMealContent = ({
  mealType,
  foods,
  onEditFood,
  onAddFood,
  onImageAnalysis,
}: TabMealContentProps) => {
  return (
    <div>
      <MealSection
        mealType={mealType}
        foods={foods}
        onEditFood={onEditFood}
        onAddFood={onAddFood}
        onImageAnalysis={onImageAnalysis}
      />
    </div>
  );
};