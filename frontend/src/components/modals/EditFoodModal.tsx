"use client";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MealType, FoodItem } from "@/types/meal";
import { FoodFormFields } from "../food/FoodFormFields";

interface EditFoodModalProps {
  mealType: MealType;
  foodIndex: number;
  food: FoodItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (mealType: MealType, index: number, food: FoodItem) => void;
  onDelete: (mealType: MealType, index: number) => void;
}

export const EditFoodModal = ({
  mealType,
  foodIndex,
  food,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: EditFoodModalProps) => {
  const [editedFood, setEditedFood] = useState<FoodItem>(food);

  // foodプロパティが変更された時にeditedFoodを更新
  useEffect(() => {
    setEditedFood(food);
  }, [food]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(mealType, foodIndex, editedFood);
    onClose();
  };

  const handleDelete = () => {
    if (confirm('この食材を削除しますか？')) {
      onDelete(mealType, foodIndex);
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
            {getMealTitle(mealType)} - 食材を編集
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* フォーム */}
        <FoodFormFields
          food={editedFood}
          setFood={setEditedFood}
        />

        {/* ボタン */}
        <div className="flex space-x-3 mt-6">
          <Button 
            onClick={handleSave}
            className="flex-1"
            disabled={!editedFood.name.trim()}
          >
            保存
          </Button>
          <Button 
            onClick={handleDelete}
            variant="outline"
            className="flex-1 border-destructive/20 text-destructive hover:bg-destructive/10"
          >
            削除
          </Button>
        </div>
      </div>
    </div>
  );
};