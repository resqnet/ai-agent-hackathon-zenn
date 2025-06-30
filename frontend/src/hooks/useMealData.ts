// 食事データ管理のカスタムフック

import { useMemo } from 'react';
import { 
  useBreakfastFoods, 
  useLunchFoods, 
  useDinnerFoods, 
  useDailyMealActions
} from '@/stores/app-store';
import type { FoodItem } from '@/types';

export const useMealData = () => {
  // Zustandストアから食事データを取得
  const breakfastFoods = useBreakfastFoods();
  const lunchFoods = useLunchFoods();
  const dinnerFoods = useDinnerFoods();
  const { addMealFood, updateMealFood, deleteMealFood } = useDailyMealActions();

  // 総食材数の計算
  const calculateMealSummary = (meals: FoodItem[][]) => {
    let totalFoodCount = 0;

    meals.forEach(meal => {
      if (meal && Array.isArray(meal)) {
        totalFoodCount += meal.length;
      }
    });

    return { totalFoodCount };
  };

  // 1日の食事サマリー
  const dailySummary = useMemo(() => 
    calculateMealSummary([breakfastFoods, lunchFoods, dinnerFoods]),
    [breakfastFoods, lunchFoods, dinnerFoods]
  );

  return {
    // 食事データ
    breakfastFoods,
    lunchFoods,
    dinnerFoods,
    
    // 操作関数
    addMealFood,
    updateMealFood,
    deleteMealFood,
    
    // 計算結果（簡素化）
    dailySummary,
    calculateMealSummary,
  };
};