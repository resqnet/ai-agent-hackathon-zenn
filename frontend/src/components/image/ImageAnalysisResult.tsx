"use client";
import { useState, useRef, useEffect } from "react";
import { 
  ArrowLeft, 
  Utensils, 
  User, 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert,
  Edit2,
  Check,
  X,
  Plus
} from "lucide-react";
import { AnalysisResult } from "@/types/meal";
import { Button } from "@/components/ui/button";

interface ImageAnalysisResultProps {
  analysisResult: AnalysisResult;
  onBack: () => void;
  onAddToMealRecord: () => void;
  onCancel: () => void;
}

interface EditableAnalysisResult extends AnalysisResult {
  analysis: {
    dish_name?: string;
    ingredients?: string[];
    detected_foods?: DetectedFood[];
    confidence?: number;
    potential_allergens?: string[];
    age_appropriateness?: unknown;
    [key: string]: unknown;
  };
}

interface DetectedFood {
  name: string;
  ingredients?: string[];
  allergens?: string[];
}

interface AgeAppropriateInfo {
  suitable: boolean;
  concerns: string[];
  recommendations: string[];
}


// 編集可能な分析結果から食材情報を抽出するヘルパー
const extractEditableDetectedFoods = (analysis: Record<string, unknown>): DetectedFood[] => {
  const detectedFoods = analysis.detected_foods;
  if (Array.isArray(detectedFoods)) {
    return detectedFoods.map(food => ({
      name: String(food.name || ""),
      ingredients: Array.isArray(food.ingredients) ? food.ingredients : [],
      allergens: Array.isArray(food.allergens) ? food.allergens : []
    }));
  }
  
  // フォールバック: 単一食材として処理
  return [{
    name: String(analysis.dish_name || "分析した食材"),
    ingredients: Array.isArray(analysis.ingredients) ? analysis.ingredients : [],
    allergens: Array.isArray(analysis.potential_allergens) ? analysis.potential_allergens : []
  }];
};

// 編集可能な分析結果の初期化ヘルパー
const initializeEditableAnalysis = (analysisResult: AnalysisResult): EditableAnalysisResult => {
  const analysis = analysisResult.analysis;
  
  // detected_foodsが存在しない場合は初期化
  if (!analysis.detected_foods) {
    const detectedFoods = [{
      name: String(analysis.dish_name || "分析した食材"),
      ingredients: Array.isArray(analysis.ingredients) ? analysis.ingredients : [],
      allergens: Array.isArray(analysis.potential_allergens) ? analysis.potential_allergens : []
    }];
    
    return {
      ...analysisResult,
      analysis: {
        ...analysis,
        detected_foods: detectedFoods
      }
    };
  }
  
  // detected_foodsが存在する場合も、ingredientsがない場合は空配列で初期化
  const detectedFoods = Array.isArray(analysis.detected_foods) 
    ? analysis.detected_foods.map((food: any) => ({
        ...food,
        ingredients: Array.isArray(food.ingredients) ? food.ingredients : []
      }))
    : [];
  
  return {
    ...analysisResult,
    analysis: {
      ...analysis,
      detected_foods: detectedFoods
    }
  };
};

const extractAgeAppropriateInfo = (analysis: Record<string, unknown>): AgeAppropriateInfo => {
  const ageInfo = analysis.age_appropriateness;
  if (typeof ageInfo === 'object' && ageInfo !== null) {
    const ageInfoTyped = ageInfo as Record<string, unknown>;
    return {
      suitable: Boolean(ageInfoTyped.suitable),
      concerns: Array.isArray(ageInfoTyped.concerns) ? ageInfoTyped.concerns : [],
      recommendations: Array.isArray(ageInfoTyped.recommendations) ? ageInfoTyped.recommendations : []
    };
  }
  
  return {
    suitable: true,
    concerns: [],
    recommendations: []
  };
};

export const ImageAnalysisResult = ({
  analysisResult,
  onBack,
  onAddToMealRecord,
  onCancel,
}: ImageAnalysisResultProps) => {
  const { imageUrl } = analysisResult;
  
  // 編集可能な状態管理
  const [editableAnalysis, setEditableAnalysis] = useState(() => 
    initializeEditableAnalysis(analysisResult)
  );
  
  // 編集状態管理
  const [isEditingDishName, setIsEditingDishName] = useState(false);
  const [tempDishName, setTempDishName] = useState("");
  const dishNameInputRef = useRef<HTMLInputElement>(null);
  
  // 原材料追加管理
  const [addingIngredient, setAddingIngredient] = useState<{ foodIndex: number } | null>(null);
  const [newIngredient, setNewIngredient] = useState("");
  const ingredientInputRef = useRef<HTMLInputElement>(null);
  
  const dishName = editableAnalysis.analysis.dish_name || "分析した食材";
  const confidence = typeof editableAnalysis.analysis.confidence === 'number' ? editableAnalysis.analysis.confidence : 0;
  const detectedFoods = extractEditableDetectedFoods(editableAnalysis.analysis);
  const ageAppropriateInfo = extractAgeAppropriateInfo(editableAnalysis.analysis);
  
  
  // 料理名編集開始
  const startEditingDishName = () => {
    setTempDishName(dishName);
    setIsEditingDishName(true);
  };
  
  // 料理名編集保存
  const saveDishName = () => {
    const trimmed = tempDishName.trim();
    if (trimmed && trimmed.length <= 50) { // 50文字制限
      setEditableAnalysis(prev => ({
        ...prev,
        analysis: {
          ...prev.analysis,
          dish_name: trimmed
        }
      }));
      setIsEditingDishName(false);
    } else if (!trimmed) {
      // 空文字の場合はキャンセル
      cancelEditingDishName();
    }
    // 50文字超過の場合は編集続行
  };
  
  // 料理名編集キャンセル
  const cancelEditingDishName = () => {
    setTempDishName("");
    setIsEditingDishName(false);
  };
  
  // 料理名編集のキーボードハンドラ
  const handleDishNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveDishName();
    } else if (e.key === 'Escape') {
      cancelEditingDishName();
    }
  };
  
  // 編集完了時の分析結果を返す関数
  const getEditedAnalysisResult = (): AnalysisResult => {
    return editableAnalysis;
  };
  
  // フォーカス管理
  useEffect(() => {
    if (isEditingDishName && dishNameInputRef.current) {
      dishNameInputRef.current.focus();
      dishNameInputRef.current.select();
    }
  }, [isEditingDishName]);
  
  useEffect(() => {
    if (addingIngredient && ingredientInputRef.current) {
      ingredientInputRef.current.focus();
    }
  }, [addingIngredient]);
  
  // 原材料削除関数
  const removeIngredient = (foodIndex: number, ingredientIndex: number) => {
    setEditableAnalysis(prev => {
      const newAnalysis = { ...prev };
      const newDetectedFoods = [...(newAnalysis.analysis.detected_foods || [])];
      
      if (newDetectedFoods[foodIndex]) {
        const newFood = { ...newDetectedFoods[foodIndex] };
        const newIngredients = [...(newFood.ingredients || [])];
        newIngredients.splice(ingredientIndex, 1);
        newFood.ingredients = newIngredients;
        newDetectedFoods[foodIndex] = newFood;
        
        newAnalysis.analysis = {
          ...newAnalysis.analysis,
          detected_foods: newDetectedFoods
        };
      }
      
      return newAnalysis;
    });
  };
  
  // 原材料追加開始
  const startAddingIngredient = (foodIndex: number) => {
    setAddingIngredient({ foodIndex });
    setNewIngredient("");
  };
  
  // 原材料追加保存
  const saveNewIngredient = () => {
    if (!addingIngredient) {
      return;
    }
    
    const trimmed = newIngredient.trim();
    if (!trimmed || trimmed.length > 30) { // 30文字制限
      if (!trimmed) {
        // 空文字の場合はキャンセル
        cancelAddingIngredient();
      }
      // 30文字超過の場合は編集続行
      return;
    }
    
    const { foodIndex } = addingIngredient;
    
    setEditableAnalysis(prev => {
      const newAnalysis = { ...prev };
      const newDetectedFoods = [...(newAnalysis.analysis.detected_foods || [])];
      
      if (newDetectedFoods[foodIndex]) {
        const newFood = { ...newDetectedFoods[foodIndex] };
        // ingredientsが存在しない場合は空配列で初期化
        if (!Array.isArray(newFood.ingredients)) {
          newFood.ingredients = [];
        }
        const newIngredients = [...newFood.ingredients];
        
        // 重複チェック
        if (!newIngredients.includes(trimmed)) {
          newIngredients.push(trimmed);
          newFood.ingredients = newIngredients;
          newDetectedFoods[foodIndex] = newFood;
          
          newAnalysis.analysis = {
            ...newAnalysis.analysis,
            detected_foods: newDetectedFoods
          };
        }
      }
      
      return newAnalysis;
    });
    
    setAddingIngredient(null);
    setNewIngredient("");
  };
  
  // 原材料追加キャンセル
  const cancelAddingIngredient = () => {
    setAddingIngredient(null);
    setNewIngredient("");
  };
  
  // 原材料追加のキーボードハンドラ
  const handleIngredientKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveNewIngredient();
    } else if (e.key === 'Escape') {
      cancelAddingIngredient();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-background min-h-0">
      {/* 結果ヘッダー */}
      <div className="bg-background p-4 flex items-center gap-3">
        <button onClick={onBack}>
          <ArrowLeft className="text-foreground w-5 h-5" />
        </button>
        <div className="text-lg font-bold">分析結果</div>
      </div>

      {/* 結果コンテンツ */}
      <div className="flex-1 min-h-0 overflow-y-auto p-5 pb-24">
        <div className="max-w-md mx-auto space-y-4">
          {/* 画像と基本情報 */}
          <div className="text-center mb-4">
            <img
              src={imageUrl}
              alt="分析済みの食事の写真"
              className="w-full h-64 object-cover rounded-2xl border-2 border-gray-200 mb-4"
            />
            {/* 料理名編集エリア */}
            <div className="flex items-center justify-center gap-2 mb-2">
              {isEditingDishName ? (
                <div className="flex items-center gap-2 relative">
                  <input
                    ref={dishNameInputRef}
                    type="text"
                    value={tempDishName}
                    onChange={(e) => setTempDishName(e.target.value)}
                    onKeyDown={handleDishNameKeyPress}
                    onBlur={saveDishName}
                    maxLength={50}
                    className={`text-xl font-bold bg-white border-2 rounded-lg px-3 py-1 text-center min-w-0 max-w-xs ${
                      tempDishName.length > 50 
                        ? 'text-red-900 border-red-300 bg-red-50' 
                        : 'text-gray-900 border-blue-300'
                    }`}
                    placeholder="料理名を入力"
                  />
                  {tempDishName.length > 45 && (
                    <span className={`absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs ${
                      tempDishName.length > 50 ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {tempDishName.length}/50
                    </span>
                  )}
                  <button
                    onClick={saveDishName}
                    className="p-1 text-green-600 hover:text-green-700 transition-colors cursor-pointer"
                    title="保存"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={cancelEditingDishName}
                    className="p-1 text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                    title="キャンセル"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 group">
                  <div className="relative">
                    <h3 className="text-xl font-bold text-gray-900 px-2 py-1 rounded-lg group-hover:bg-blue-50 transition-colors cursor-pointer border-2 border-transparent group-hover:border-blue-200"
                        onClick={startEditingDishName}>
                      {String(dishName)}
                    </h3>
                  </div>
                  <button
                    onClick={startEditingDishName}
                    className="p-1 text-gray-400 hover:text-blue-600 group-hover:text-blue-600 transition-colors cursor-pointer"
                    title="料理名を編集"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-full">
              <CheckCircle className="w-4 h-4" />
              <span className="font-bold text-sm">信頼度 {Math.round(confidence * 100)}%</span>
            </div>
          </div>

          {/* 検出された食材セクション */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <Utensils className="w-5 h-5" /> 検出された食材
              </div>
            </div>

            <div className="space-y-2">
              {detectedFoods.map((food: DetectedFood, index: number) => {
                return (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-3 shadow-sm border border-gray-100"
                  >
                    {/* 原材料 */}
                    <div className="mb-2">
                      <p className="text-xs font-medium text-gray-600 mb-1">原材料:</p>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(food.ingredients) && food.ingredients.length > 0 ? (
                          food.ingredients.map((ingredient: string, idx: number) => (
                            <div
                              key={idx}
                              className="group relative flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-red-50 transition-all duration-200"
                            >
                              <span className="group-hover:text-gray-800">{ingredient}</span>
                              <button
                                onClick={() => removeIngredient(index, idx)}
                                className="ml-1 text-gray-400 hover:text-red-600 group-hover:text-red-500 transition-colors cursor-pointer"
                                title="原材料を削除"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))
                        ) : null}
                        
                        {/* 原材料追加エリア */}
                        {addingIngredient?.foodIndex === index ? (
                          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 border-2 border-blue-300 text-xs rounded">
                            <input
                              ref={ingredientInputRef}
                              type="text"
                              value={newIngredient}
                              onChange={(e) => setNewIngredient(e.target.value)}
                              onKeyDown={handleIngredientKeyPress}
                              onBlur={saveNewIngredient}
                              maxLength={30}
                              className={`bg-transparent border-none outline-none placeholder-blue-500 min-w-0 w-20 ${
                                newIngredient.length > 30 
                                  ? 'text-red-800' 
                                  : 'text-blue-800'
                              }`}
                              placeholder="原材料名"
                            />
                            <button
                              onClick={saveNewIngredient}
                              className="text-green-600 hover:text-green-700 transition-colors cursor-pointer"
                              title="追加"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={cancelAddingIngredient}
                              className="text-red-600 hover:text-red-700 transition-colors cursor-pointer"
                              title="キャンセル"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startAddingIngredient(index)}
                            className="group relative flex items-center gap-1 px-2 py-1 text-xs rounded transition-all duration-200 bg-green-100 text-green-700 hover:bg-green-200 hover:text-green-800 cursor-pointer"
                            title="原材料を追加"
                          >
                            <Plus className="w-3 h-3" />
                            <span>追加</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* アレルギー情報 */}
                    {food.allergens && food.allergens.length > 0 && (
                      <div className="bg-red-50 rounded-lg p-2 border border-red-200">
                        <p className="text-xs font-bold text-red-900 mb-1 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          アレルギー注意:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {food.allergens.map((allergen: string, idx: number) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-red-200 text-red-900 text-xs rounded font-bold"
                            >
                              {allergen}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 年齢適合性セクション */}
          <div className="mb-6">
            <div className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <User className="w-5 h-5" /> 年齢適合性
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
              <div className={`p-3 rounded-lg border-2 ${ageAppropriateInfo.suitable
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
                }`}>
                <div className={`p-3 rounded-lg text-center mb-3 ${ageAppropriateInfo.suitable
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                  }`}>
                  <p className="font-bold text-lg flex items-center justify-center gap-2">
                    {ageAppropriateInfo.suitable ? (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        適切
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-5 h-5" />
                        注意が必要
                      </>
                    )}
                  </p>
                </div>

                {ageAppropriateInfo.concerns.length > 0 && (
                  <div className="mb-3">
                    <p className="font-bold text-sm mb-2 text-yellow-800 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      注意点:
                    </p>
                    <ul className="text-sm space-y-1">
                      {ageAppropriateInfo.concerns.map((concern: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-yellow-600">•</span>
                          <span className="text-yellow-800">{concern}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {ageAppropriateInfo.recommendations.length > 0 && (
                  <div>
                    <p className="font-bold text-sm mb-2 text-green-800 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      推奨事項:
                    </p>
                    <ul className="text-sm space-y-1">
                      {ageAppropriateInfo.recommendations.map((recommendation: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-600">•</span>
                          <span className="text-green-800">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 固定フッターボタン */}
      <div className="absolute bottom-14 left-0 right-0 px-5 py-3">
        {/* 編集状態表示 */}
        {(isEditingDishName || addingIngredient) && (
          <div className="mb-3 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded-full text-sm">
              <Edit2 className="w-4 h-4" />
              <span>編集中... {isEditingDishName ? '料理名' : '原材料'}を変更しています</span>
            </div>
          </div>
        )}
        <div className="flex gap-3">
          <Button
            onClick={() => {
              // 編集された結果を親コンポーネントに渡す
              const editedResult = getEditedAnalysisResult();
              // 元のコールバック関数を呼び出し、編集結果を使用させる
              analysisResult.analysis = editedResult.analysis;
              onAddToMealRecord();
            }}
            className="flex-1 bg-gradient-to-r from-red-400 to-red-500 text-white text-lg font-bold py-4 px-4 rounded-2xl shadow-lg transform transition-transform hover:-translate-y-1"
            size="lg"
          >
            食事記録に追加
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="px-6 text-lg font-bold py-4 rounded-2xl"
            size="lg"
          >
            キャンセル
          </Button>
        </div>
      </div>
    </div>
  );
};