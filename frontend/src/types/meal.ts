// 食事関連の型定義

export type Screen = "home" | "chat" | "image-analyzing" | "image-result" | "settings" | "dinner-consultation" | "image-recognition";

export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface FoodItem {
  name: string;
  memo?: string;
}

export interface EditingFood {
  mealType: MealType;
  foodIndex: number;
  food: FoodItem;
}

export interface AnalyzingImage {
  mealType: MealType | null;
  isAnalyzing: boolean;
}

export interface AnalyzingState {
  file: File;
  imageUrl: string;
  mealType: MealType;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface AnalysisResult {
  analysis: Record<string, unknown>; // FoodAnalysisの型に対応（将来的に詳細型定義が必要）
  imageUrl: string;
  mealType: MealType;
}