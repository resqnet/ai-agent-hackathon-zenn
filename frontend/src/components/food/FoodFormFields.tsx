// 食材入力フォームフィールド

import React from 'react';
import { FoodItem } from '@/types/meal';

interface FoodFormFieldsProps {
  food: FoodItem;
  setFood: (food: FoodItem) => void;
  showNamePlaceholder?: boolean;
}

export const FoodFormFields: React.FC<FoodFormFieldsProps> = ({ 
  food, 
  setFood, 
  showNamePlaceholder = false 
}) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-foreground mb-1">食材名</label>
      <input
        type="text"
        value={food.name}
        onChange={(e) => setFood({ ...food, name: e.target.value })}
        placeholder={showNamePlaceholder ? "例: ヨーグルト" : ""}
        className={`w-full px-3 py-2 border border-input rounded-lg text-foreground bg-background ${
          showNamePlaceholder ? 'placeholder:text-muted-foreground' : ''
        }`}
      />
    </div>



    <div>
      <label className="block text-sm font-medium text-foreground mb-1">メモ（原材料・詳細など）</label>
      <textarea
        value={food.memo || ''}
        onChange={(e) => setFood({ ...food, memo: e.target.value })}
        placeholder="例: 無添加パン、バターあり、原材料：小麦粉、バター、卵"
        className="w-full px-3 py-2 border border-input rounded-lg text-foreground bg-background placeholder:text-muted-foreground resize-none"
        rows={3}
      />
    </div>
  </div>
);