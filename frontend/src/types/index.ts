// 認証ユーザー情報
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
}

// 認証状態
export interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
}

// 子どもの基本情報
export interface ChildInfo {
  id: string; // 子どもごとの一意ID
  age: number; // 年齢（月数）
  weight?: number; // 体重（kg）
  height?: number; // 身長（cm）
  name?: string; // 名前
  createdAt: string; // 作成日時
  updatedAt: string; // 更新日時
}

// アレルギー情報
export interface AllergyInfo {
  id: string;
  childId: string; // 紐付く子どものID
  name: string;
  type: 'food' | 'environmental' | 'medicine';
}

// ユーザー設定
export interface UserPreferences {
  children: ChildInfo[]; // 複数の子どもの情報
  activeChildId: string | null; // 現在選択中の子どものID
  allergies: AllergyInfo[]; // 全ての子どものアレルギー情報
  dietaryRestrictions: { [childId: string]: string[] }; // 子どもごとの食事制限
  notificationSettings: {
    mealReminders: boolean;
    nutritionTips: boolean;
    weeklyReports: boolean;
  };
  theme: 'light' | 'dark' | 'system';
}

// 詳細食材情報（栄養計算用）
export interface DetailedFoodItem {
  id: string;
  name: string;
  category: 'carbs' | 'protein' | 'vitamin' | 'dairy' | 'fruit' | 'vegetable' | 'other';
  nutritionPer100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sodium: number;
  };
  allergens: string[];
  ageAppropriate: {
    min: number; // 最小年齢（月数）
    max?: number; // 最大年齢（月数）
  };
}

// 食材情報（簡易版 - UI用）
export interface FoodItem {
  name: string;
  memo?: string;
}

// 食事記録
export interface MealRecord {
  id: string;
  childId: string; // 紐付く子どものID
  date: string; // ISO datetime
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: Array<{
    food: FoodItem;
    quantity: number; // グラム
  }>;
  imageUrl?: string;
  notes?: string;
  nutritionSummary?: NutritionSummary;
}

// 栄養素要約
export interface NutritionSummary {
  totalCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  vitamins: Record<string, number>;
  minerals: Record<string, number>;
}

// 画像解析結果
export interface FoodAnalysis {
  dish_name: string;
  ingredients: string[];
  confidence: number;
  nutrition_estimate?: NutritionSummary;
  potential_allergens: string[];
  age_appropriateness: {
    suitable: boolean;
    concerns: string[];
    recommendations: string[];
  };
}

// チャットメッセージ
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  type: 'text' | 'image' | 'food_analysis' | 'nutrition_advice';
  metadata?: {
    imageUrl?: string;
    foodAnalysis?: FoodAnalysis;
    mealRecord?: MealRecord;
  };
}

// チャットストリームイベント型
export interface ChatStreamEvent {
  type: 'agent_start' | 'chunk' | 'agent_complete' | 'stream_end' | 'error' | 'token';
  agent_name?: string;
  content?: string;
}

// チャットセッション
export interface ChatSession {
  id: string;
  childId: string; // 紐付く子どものID
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  metadata?: {
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    consultationType?: 'nutrition' | 'recipe' | 'general';
  };
}

// API応答の基本型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// エラー型
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// アプリケーション状態
export interface AppState {
  isLoading: boolean;
  error: AppError | null;
  auth: AuthState;
  user: {
    preferences: UserPreferences;
    mealHistory: MealRecord[];
    chatSessions: ChatSession[];
  };
  ui: {
    currentPage: string;
    isDrawerOpen: boolean;
    activeModal: string | null;
    theme: 'light' | 'dark';
    consultationTitle: string;
  };
  chat: {
    currentSession: ChatSession | null;
    isTyping: boolean;
    isConnected: boolean;
  };
  dailyMeal: DailyMealData;
  // 各お子さまごとの食事記録を保存
  childrenMealData: Record<string, DailyMealData>;
}

// フォーム関連の型
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'textarea' | 'select' | 'checkbox' | 'file';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    customValidator?: (value: unknown) => string | null;
  };
}

// API クライアント関連
export interface ApiClientConfig {
  baseUrl: string;
  timeout: number;
  retryCount: number;
  headers: Record<string, string>;
}

// WebSocket メッセージ型
export interface WebSocketMessage {
  type: 'chat' | 'typing' | 'error' | 'system';
  payload: unknown;
  timestamp: string;
  sessionId?: string;
}

// 栄養アドバイス関連
export interface NutritionAdvice {
  id: string;
  title: string;
  content: string;
  type: 'tip' | 'warning' | 'recommendation';
  category: 'balance' | 'allergen' | 'age_appropriate' | 'portion';
  priority: 'low' | 'medium' | 'high';
  targetAge?: {
    min: number;
    max: number;
  };
}

// ユーティリティ型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// 日付関連のユーティリティ型
export type DateString = string; // ISO date string
export type TimeString = string; // ISO time string
export type DateTimeString = string; // ISO datetime string


// ステータス型
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
export type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error';

// 環境設定型
export interface Environment {
  NODE_ENV: 'development' | 'production' | 'test';
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_WS_URL: string;
  NEXT_PUBLIC_UPLOAD_URL: string;
  NEXT_PUBLIC_APP_VERSION: string;
}

// 食事タイプ
export type MealType = 'breakfast' | 'lunch' | 'dinner';

// 食事データ
export interface DailyMealData {
  childId: string; // 紐付く子どものID
  breakfast: FoodItem[];
  lunch: FoodItem[];
  dinner: FoodItem[];
  specialNotes?: string;
  updatedAt?: string;
}

