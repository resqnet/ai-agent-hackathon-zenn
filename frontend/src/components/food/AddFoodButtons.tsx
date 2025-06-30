"use client";
import { Plus, Camera } from "lucide-react";
import { MealType } from "@/types/meal";
import { Button } from "@/components/ui/button";

interface AddFoodButtonsProps {
  mealType: MealType;
  onAddFood: (mealType: MealType) => void;
  onImageAnalysis: (mealType: MealType, file?: File) => void;
  variant?: "full" | "compact";
}

export const AddFoodButtons = ({
  mealType,
  onAddFood,
  onImageAnalysis,
  variant = "full",
}: AddFoodButtonsProps) => {
  if (variant === "compact") {
    return (
      <div className="flex">
        <Button
          onClick={() => onAddFood(mealType)}
          variant="ghost"
          size="icon"
          title="手動入力"
        >
          <Plus className="w-5 h-5" />
        </Button>
        <Button variant="ghost" size="icon" asChild>
          <label title="写真で入力">
            <Camera className="w-5 h-5" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImageAnalysis(mealType, file);
                }
                e.target.value = "";
              }}
            />
          </label>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => onAddFood(mealType)}
        variant="secondary"
        className="flex-1"
      >
        <Plus className="w-5 h-5" />
        手動入力
      </Button>
      <Button asChild variant="secondary" className="flex-1">
        <label>
          <Camera className="w-5 h-5" /> 写真で入力
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onImageAnalysis(mealType, file);
              }
              e.target.value = "";
            }}
          />
        </label>
      </Button>
    </div>
  );
};
