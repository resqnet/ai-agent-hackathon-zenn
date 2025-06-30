"use client";
import { useState, useMemo } from "react";
import { useRouter } from 'next/navigation';
import { Utensils, MessageSquare, Sunrise, Sun, Moon, ArrowLeft, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useHealthCheck } from '@/hooks/use-api';
import { useMealData } from '@/hooks/useMealData';
import { useImageAnalysis } from '@/hooks/useImageAnalysis';
import { useScreenNavigation } from '@/hooks/useScreenNavigation';
import { useSpecialNotes, useDailyMealActions, useAppStore, useActiveChild, useChildren, useChildActions, useChildAllergies, useMealHistory, useConsultationActions } from '@/stores/app-store';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TabMealContent } from '@/components/food/TabMealContent';
import { EditFoodModal } from '@/components/modals/EditFoodModal';
import { AddFoodModal } from '@/components/modals/AddFoodModal';
import { ImageAnalysisResult } from '@/components/image/ImageAnalysisResult';
import { MealType, FoodItem } from '@/types/meal';
import { CONSULTATION_BUTTON_TEXTS } from '@/constants/consultation';
import { apiClient } from '@/utils/api-client';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// 月数を「○歳○ヶ月」形式に変換する関数
const formatAge = (months: number): string => {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (months === 0) {
    return '0歳0ヶ月';
  } else if (years === 0) {
    return `0歳${remainingMonths}ヶ月`;
  } else if (remainingMonths === 0) {
    return `${years}歳`;
  } else {
    return `${years}歳${remainingMonths}ヶ月`;
  }
};

export default function HomeClientPage() {
  // 状態管理
  const [activeTab, setActiveTab] = useState<'breakfast' | 'lunch' | 'dinner'>('breakfast');
  const router = useRouter();
  
  // セッション作成状態
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  
  // Zustandストアから特記事項を取得
  const specialNotes = useSpecialNotes();
  const { updateSpecialNotes } = useDailyMealActions();
  const { setPendingConsultationMessage } = useConsultationActions();
  
  // 子ども管理関連
  const activeChild = useActiveChild();
  const children = useChildren();
  const { setActiveChild } = useChildActions();
  
  const childMealHistory = useMealHistory();
  const [editingFood, setEditingFood] = useState<{ mealType: MealType, foodIndex: number, food: FoodItem } | null>(null);
  const [addingFood, setAddingFood] = useState<MealType | null>(null);
  const specialNote = useSpecialNotes();

  // API連携とグローバルステート
  useHealthCheck(); // ヘルスチェック実行
  
  // カスタムフック
  const { 
    breakfastFoods, 
    lunchFoods, 
    dinnerFoods, 
    addMealFood,
    updateMealFood,
    deleteMealFood
  } = useMealData();
  
  const { analyzingState, analysisResult, analyzeImage, convertAnalysisToFoodItem, clearAnalysisState } = useImageAnalysis();
  const { currentScreen, navigateToHome, navigateToImageAnalyzing, navigateToImageResult } = useScreenNavigation();

  // ハンドラー関数
  const handleEditFood = (mealType: MealType, index: number, food: FoodItem) => {
    setEditingFood({ mealType, foodIndex: index, food });
  };


  const handleAddFood = (mealType: MealType) => {
    setAddingFood(mealType);
  };

  const handleImageAnalysis = (mealType: MealType, file?: File) => {
    if (file) {
      analyzeImage(file, mealType, () => {
        navigateToImageResult();
      });
      navigateToImageAnalyzing();
    } else {
      // フォールバック: ファイルピッカーを開く
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const selectedFile = (e.target as HTMLInputElement).files?.[0];
        if (selectedFile) {
          analyzeImage(selectedFile, mealType, () => {
            navigateToImageResult();
          });
          navigateToImageAnalyzing();
        }
      };
      input.click();
    }
  };

  // 相談ボタンのテキストを動的に決定（useMemoでメモ化）
  const consultationButtonText = useMemo(() => {
    const hasBreakfast = breakfastFoods.length > 0;
    const hasLunch = lunchFoods.length > 0;
    const hasDinner = dinnerFoods.length > 0;

    if (hasDinner) {
      return CONSULTATION_BUTTON_TEXTS.general;
    } else if (hasLunch) {
      return CONSULTATION_BUTTON_TEXTS.dinner;
    } else if (hasBreakfast) {
      return CONSULTATION_BUTTON_TEXTS.lunch;
    } else {
      return CONSULTATION_BUTTON_TEXTS.breakfast;
    }
  }, [breakfastFoods.length, lunchFoods.length, dinnerFoods.length]);

  // 食事データから相談対象の時間帯を動的に決定
  const mealTime = useMemo(() => {
    const hasBreakfast = breakfastFoods.length > 0;
    const hasLunch = lunchFoods.length > 0;
    const hasDinner = dinnerFoods.length > 0;

    if (hasDinner) {
      return '総合'; // 夕食まで入力済みの場合は総合相談
    } else if (hasLunch) {
      return '夕食';
    } else if (hasBreakfast) {
      return '昼食';
    } else {
      return '朝食';
    }
  }, [breakfastFoods.length, lunchFoods.length, dinnerFoods.length]);

  // 食事内容を文字列に変換
  const breakfastContent = breakfastFoods.map(food => 
    `${food.name}（${food.memo ? ` - ${food.memo}` : ''}`
  ).join('\n') || '';

  const lunchContent = lunchFoods.map(food => 
    `${food.name}（${food.memo ? ` - ${food.memo}` : ''}`
  ).join('\n') || '';

  const dinnerContent = dinnerFoods.map(food => 
    `${food.name}（${food.memo ? ` - ${food.memo}` : ''}`
  ).join('\n') || '';

  // ユーザー情報を取得
  const user = useAppStore((state) => state.user);

  // 食事の登録状況をもとにプロンプトを組み立てる機能（consultation-client.tsxから移管）
  const consultationMessage = useMemo(() => {
    const { children = [], activeChildId, allergies = [] } = user.preferences;
    
    // 子どもが登録されていない場合
    if (!children || children.length === 0) {
      return 'お子さまの情報がまだ登録されていません。\n\n栄養相談を始めるには、まず設定画面でお子さまの基本情報（お名前、年齢など）を登録してください。\n\n設定は画面下のメニューから「設定」をタップして進めていただけます。';
    }
    
    // アクティブな子どもの情報を取得
    const currentActiveChild = children.find(child => child.id === activeChildId);
    
    // 子どもの情報がない場合のデフォルト処理
    if (!currentActiveChild) {
      return 'お子さまの情報が正しく設定されていません。設定画面から情報を確認・入力してください。';
    }
    
    // 年齢グループの判定（エージェントの栄養基準に合わせる）
    const ageInMonths = currentActiveChild.age;
    const ageGroup = ageInMonths < 36 ? "1-2歳" : "3歳";
    
    // 基本情報（簡潔に）
    let message = `${currentActiveChild.name ? `${currentActiveChild.name}ちゃん` : 'お子さま'}（${Math.floor(ageInMonths / 12)}歳${ageInMonths % 12}ヶ月）の栄養分析をお願いします。\n\n`;
    
    // 年齢グループ（エージェントの栄養基準用）
    message += `年齢: ${ageGroup}\n`;

    if (currentActiveChild.height) {
      message += `身長: ${currentActiveChild.height}cm\n`;
    }
    if (currentActiveChild.weight) {
      message += `体重: ${currentActiveChild.weight}kg\n`;
    }
    
    // 朝食情報（必須項目として強調）
    message += `朝食: ${breakfastContent.trim() || "まだ食べていません"}\n`;
    
    // 昼食情報
    message += `昼食: ${lunchContent.trim() || "まだ食べていません"}\n`;
    
    // 夕食情報（総合相談の場合のみ表示）
    if (mealTime === '総合') {
      message += `夕食: ${dinnerContent.trim() || "まだ食べていません"}\n`;
    }
    
    // アレルギー情報（エージェントが理解しやすい形式）
    const childAllergies = allergies.filter(allergy => allergy.childId === currentActiveChild.id);
    if (childAllergies.length > 0) {
      message += `アレルギー: ${childAllergies.map(allergy => allergy.name).join(", ")}\n`;
    } else {
      message += `アレルギー: なし\n`;
    }
    
    // 特別な事情（空でも明記）
    if (specialNotes) {
      message += `特別な事情: ${specialNotes}\n`;
    } else {
      message += `特別な事情: なし\n`;
    }
    
    // エージェントが最適な分析をするための明確な依頼
    if (mealTime === '総合') {
      message += `上記の食事内容について栄養バランスの分析と今後の食事改善提案をお願いします。\n`;
    } else {
      message += `上記の食事内容について栄養バランスの分析と${mealTime}での補完提案をお願いします。\n`;
    }
    message += `併せて、不足栄養素を補う手軽な提案もお願いします。`;
    
    return message;
  }, [breakfastContent, lunchContent, dinnerContent, user.preferences, mealTime]);

  // 相談ボタンクリック - セッション作成→Zustandストアに保存→チャット遷移
  const handleConsultationClick = async () => {
    try {
      setIsCreatingSession(true);
      
      // 1. 新しいセッションを作成
      const response = await apiClient.createSession();
      
      if (response.success && response.sessionId) {
        // 2. 相談メッセージをZustandストアに保存
        setPendingConsultationMessage(consultationMessage);
        
        // 3. /chat/:sessionId に遷移（クエリパラメータなし）
        router.push(`/chat/${response.sessionId}`);
      } else {
        // エラーハンドリング
        console.error("セッション作成に失敗:", response.error);
        alert(`セッション作成に失敗しました: ${response.error || "不明なエラー"}`);
      }
    } catch (error) {
      console.error("セッション作成中にエラー:", error);
      alert("セッション作成中にエラーが発生しました。");
    } finally {
      setIsCreatingSession(false);
    }
  };

  // 分析結果を食事記録に追加
  const handleAddAnalysisToMealRecord = () => {
    if (analysisResult) {
      // プロトタイプのようにdetected_foodsから複数の食材を追加
      const detectedFoods = analysisResult.analysis.detected_foods;
      if (Array.isArray(detectedFoods)) {
        detectedFoods.forEach((detectedFood: unknown) => {
          const food = detectedFood as Record<string, unknown>;
          const ingredients = Array.isArray(food.ingredients) ? food.ingredients : [];
          
          const ingredientText = ingredients.length > 0
            ? `原材料: ${ingredients.join('、')}`
            : '';

          const foodItem: FoodItem = {
            name: String(food.name || "分析した食材"),
            memo: ingredientText
          };

          addMealFood(analysisResult.mealType, foodItem);
        });
      } else {
        // フォールバック: 単一食材として追加
        const foodItem = convertAnalysisToFoodItem(analysisResult);
        addMealFood(analysisResult.mealType, foodItem);
      }
    }
    clearAnalysisState();
    navigateToHome();
  };

  const handleCancelAnalysis = () => {
    clearAnalysisState();
    navigateToHome();
  };

  return (
    <AuthGuard>
      <AppLayout>
        <Header 
          title="きっずフード アドバイザー" 
          showBackButton={false}
        />
      {/* ホーム画面 */}
      {currentScreen === "home" && (
        <div className="flex-1 flex flex-col bg-background">
          <div className="flex-1 p-5 pb-24">
            <div className="flex flex-col gap-3">
              {/* 1. 挨拶セクション */}
              <section className="text-center pt-2">
                <p className="text-foreground">今日も元気に栄養バランスを整えましょう 🍎</p>
              </section>

            {/* 2. お子さま情報カード */}
            <div className="bg-card-background border border-border rounded-3xl p-4 mb-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-text-primary">
                  お子さまの情報
                </h3>
                {/* 複数の子どもがいる場合の切り替えボタン */}
                {children.length > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => {
                        const currentIndex = children.findIndex(c => c.id === activeChild?.id);
                        const prevIndex = currentIndex > 0 ? currentIndex - 1 : children.length - 1;
                        setActiveChild(children[prevIndex].id);
                      }}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {children.findIndex(c => c.id === activeChild?.id) + 1} / {children.length}
                    </span>
                    <Button
                      onClick={() => {
                        const currentIndex = children.findIndex(c => c.id === activeChild?.id);
                        const nextIndex = currentIndex < children.length - 1 ? currentIndex + 1 : 0;
                        setActiveChild(children[nextIndex].id);
                      }}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              {/* アクティブな子どもの情報を表示 */}
              {activeChild ? (
                <div>
                  {/* 子どもの名前（設定されている場合） */}
                  {activeChild.name && (
                    <p className="text-base font-medium text-primary mb-2">
                      {activeChild.name}
                    </p>
                  )}
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex flex-col items-center min-w-0 flex-1">
                      <p className="text-lg font-bold text-primary truncate">
                        {formatAge(activeChild.age)}
                      </p>
                      <p className="text-sm text-foreground">年齢</p>
                    </div>
                    {
                      activeChild.weight && (
                        <div className="flex flex-col items-center min-w-0 flex-1">
                          <p className="text-lg font-bold text-primary">
                            {activeChild.weight}kg
                          </p>
                          <p className="text-sm text-foreground">体重</p>
                        </div>
                      )
                    }
                    {
                      activeChild.height && (
                        <div className="flex flex-col items-center min-w-0 flex-1">
                          <p className="text-lg font-bold text-primary">
                            {activeChild.height}cm
                          </p>
                          <p className="text-sm text-foreground">身長</p>
                        </div>
                      )
                    }
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    お子さまの情報を設定すると、より適切な栄養アドバイスが受けられます
                  </p>
                  <Button
                    onClick={() => router.push('/settings')}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    お子さまを追加
                  </Button>
                </div>
              )}
            </div>


            {/* 3. 食事記録タブ */}
            <div className="mb-6">
              <div className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <Utensils className="w-5 h-5" /> 今日の食事記録
              </div>
              <Tabs 
                value={activeTab} 
                onValueChange={(value) => setActiveTab(value as 'breakfast' | 'lunch' | 'dinner')}
                className="w-full"
              >
                <TabsList className="w-full">
                  <TabsTrigger value="breakfast">
                    <Sunrise className="w-4 h-4" />
                    朝食
                  </TabsTrigger>
                  <TabsTrigger value="lunch">
                    <Sun className="w-4 h-4" />
                    昼食
                  </TabsTrigger>
                  <TabsTrigger value="dinner">
                    <Moon className="w-4 h-4" />
                    夕食
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="breakfast" className="mt-4">
                  <TabMealContent
                    mealType="breakfast"
                    foods={breakfastFoods}
                    onEditFood={handleEditFood}
                    onAddFood={handleAddFood}
                    onImageAnalysis={handleImageAnalysis}
                  />
                </TabsContent>
                <TabsContent value="lunch" className="mt-4">
                  <TabMealContent
                    mealType="lunch"
                    foods={lunchFoods}
                    onEditFood={handleEditFood}
                    onAddFood={handleAddFood}
                    onImageAnalysis={handleImageAnalysis}
                  />
                </TabsContent>
                <TabsContent value="dinner" className="mt-4">
                  <TabMealContent
                    mealType="dinner"
                    foods={dinnerFoods}
                    onEditFood={handleEditFood}
                    onAddFood={handleAddFood}
                    onImageAnalysis={handleImageAnalysis}
                  />
                </TabsContent>
              </Tabs>
            </div>

            {/* 5. 特別な事情入力セクション */}
            <div className="mb-6">
              <div className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> 特別な事情があれば（任意）
              </div>
              <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
                <Textarea
                  value={specialNotes}
                  onChange={(e) => updateSpecialNotes(e.target.value)}
                  placeholder="例: 最近食べる量が少ない、便秘気味、時間がない など"
                  className="text-sm"
                />
              </div>
            </div>
          </div>

            {/* 相談ボタン（固定配置） */}
            <div className="py-3">
              <Button
                onClick={handleConsultationClick}
                disabled={isCreatingSession}
                className="w-full text-base font-bold py-6 px-4 rounded-2xl shadow-lg transform transition-transform hover:-translate-y-1 cursor-pointer"
                size="lg"
              >
                {isCreatingSession ? "会話作成中..." : consultationButtonText}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 画像分析中画面 */}
      {currentScreen === "image-analyzing" && (
        <div className="flex-1 flex flex-col">
          {/* 分析中コンテンツ */}
          <div className="flex-1 p-5 bg-background">
            {analyzingState && (
              <div className="max-w-md mx-auto space-y-4">
                {/* 画像プレビュー */}
                <img
                  src={analyzingState.imageUrl}
                  alt="分析中の食事の写真"
                  className="w-full h-64 object-cover rounded-2xl border-2 border-border"
                />
                <div className="bg-card border border-border rounded-3xl p-6 mb-6 flex flex-col gap-4">
                  {analyzingState.status !== 'error' ? (
                    <div className="flex flex-col items-center gap-4">
                      {/* プログレスバー */}
                      <div className="w-full bg-muted rounded-full h-4">
                        <div
                          className="bg-chart-1 h-4 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${analyzingState.progress}%` }}
                        ></div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xl font-bold text-primary">
                            {analyzingState.status === 'uploading' ? 'アップロード中...' :
                             analyzingState.status === 'processing' ? 'AI分析中...' :
                             '完了'}
                          </span>
                        </div>
                        <p className="text-lg text-primary font-bold mb-2">
                          {analyzingState.progress}% 完了
                        </p>
                        <p className="text-sm text-foreground">
                          食材の識別と栄養分析を行っています...
                        </p>
                        <Button 
                          className="mt-2"
                          variant="ghost" 
                          onClick={() => {
                            clearAnalysisState();
                            navigateToHome();
                          }}
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-destructive text-5xl mb-4">❌</div>
                      <h3 className="text-xl font-bold text-destructive mb-3">分析エラー</h3>
                      <p className="text-destructive mb-6 text-sm leading-relaxed">{analyzingState.error}</p>
                      <div className="flex flex-col gap-3">
                        <Button
                          className="w-full"
                          onClick={() => {
                            if (analyzingState) {
                              analyzeImage(analyzingState.file, analyzingState.mealType);
                            }
                          }}
                        >再試行</Button>
                        <Button className="w-full" onClick={() => navigateToHome()} variant="ghost">ホームに戻る</Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 画像分析結果画面 */}
      {currentScreen === "image-result" && (
        analysisResult ? (
          <ImageAnalysisResult
            analysisResult={analysisResult}
            onBack={navigateToHome}
            onAddToMealRecord={handleAddAnalysisToMealRecord}
            onCancel={handleCancelAnalysis}
          />
        ) : (
          <div className="flex-1 flex flex-col">
            <div className="bg-primary p-4 flex items-center gap-3">
              <button onClick={() => navigateToHome()}>
                <ArrowLeft className="text-primary-foreground w-5 h-5" />
              </button>
              <div className="text-primary-foreground text-lg font-bold">分析結果</div>
            </div>
            <div className="flex-1 p-5 bg-card border border-border">
              <div className="text-center">
                <p>分析結果を読み込み中...</p>
              </div>
            </div>
          </div>
        )
      )}

      {/* ボトムナビゲーション（固定） */}
      <BottomNavigation />

      {/* モーダル */}
      <EditFoodModal
        mealType={editingFood?.mealType || 'breakfast'}
        foodIndex={editingFood?.foodIndex || 0}
        food={editingFood?.food || { name: '', memo: '' }}
        isOpen={!!editingFood}
        onClose={() => setEditingFood(null)}
        onSave={updateMealFood}
        onDelete={deleteMealFood}
      />

      <AddFoodModal
        mealType={addingFood || 'breakfast'}
        isOpen={!!addingFood}
        onClose={() => setAddingFood(null)}
        onAdd={addMealFood}
      />
      </AppLayout>
    </AuthGuard>
  );
}