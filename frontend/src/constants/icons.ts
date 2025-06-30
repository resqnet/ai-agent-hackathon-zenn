// アイコン関連定数

import { MealType } from '@/types/meal';
import { Sunrise, Sun, Moon } from 'lucide-react';

// 食事アイコンマッピング
export const MEAL_ICONS: Record<MealType, React.ComponentType> = {
  breakfast: Sunrise,
  lunch: Sun,
  dinner: Moon,
};

// 食事名マッピング
export const MEAL_NAMES: Record<MealType, string> = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
};