"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MealType, FoodItem } from "@/types/meal";
import { FoodFormFields } from "../food/FoodFormFields";

interface AddFoodModalProps {
  mealType: MealType;
  isOpen: boolean;
  onClose: () => void;
  onAdd: (mealType: MealType, food: FoodItem) => void;
}

export const AddFoodModal = ({
  mealType,
  isOpen,
  onClose,
  onAdd,
}: AddFoodModalProps) => {
  const [newFood, setNewFood] = useState<FoodItem>({
    name: "",
    category: "主食",
    servings: 1.0,
    memo: "",
  });

  if (!isOpen) return null;

  const handleAdd = () => {
    if (newFood.name.trim()) {
      onAdd(mealType, newFood);
      setNewFood({
        name: "",
        category: "主食",
        servings: 1.0,
        memo: "",
      });
      onClose();
    }
  };

  const getMealTitle = (mealType: MealType) => {
    switch (mealType) {
      case 'breakfast': return '朝食';
      case 'lunch': return '昼食';
      case 'dinner': return '夕食';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-border shadow-lg">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {getMealTitle(mealType)} - 食材を追加
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* フォーム */}
        <FoodFormFields
          food={newFood}
          setFood={setNewFood}
        />

        {/* ボタン */}
        <div className="flex space-x-3 mt-6">
          <Button 
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            キャンセル
          </Button>
          <Button 
            onClick={handleAdd}
            className="flex-1"
            disabled={!newFood.name.trim()}
          >
            追加
          </Button>
        </div>
      </div>
    </div>
  );
};