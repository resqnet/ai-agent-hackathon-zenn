// 画像分析機能のカスタムフック

import { useState, useRef } from 'react';
import { useAnalyzeFood } from '@/hooks/use-api';
import { AnalyzingState, AnalysisResult, MealType, FoodItem } from '@/types/meal';
import { compressForIOS, formatFileSize } from '@/utils/image-compression';

export const useImageAnalysis = () => {
  const [analyzingState, setAnalyzingState] = useState<AnalyzingState | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const onAnalysisCompleteRef = useRef<(() => void) | null>(null);
  const analyzeFoodMutation = useAnalyzeFood();

  // 画像分析機能
  const analyzeImage = async (file: File, mealType: MealType, onComplete?: () => void) => {
    if (onComplete) {
      onAnalysisCompleteRef.current = onComplete;
    }

    // ファイル形式チェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('サポートされていないファイル形式です。JPEG、PNG、WebP形式の画像を選択してください。');
      return;
    }

    console.log(`画像解析開始: ${file.name} (${formatFileSize(file.size)})`);

    // 画像URLを生成（元の画像用）
    const originalImageUrl = URL.createObjectURL(file);

    // 分析中状態を設定
    setAnalyzingState({
      file,
      imageUrl: originalImageUrl,
      mealType,
      progress: 0,
      status: 'uploading'
    });

    try {
      let processedFile = file;
      let imageUrl = originalImageUrl;

      // ファイルサイズが大きい場合は圧縮（特にiOSからの画像）
      if (file.size > 2 * 1024 * 1024) { // 2MB以上の場合
        console.log('大きな画像ファイルを検出。圧縮を開始します...');
        
        setAnalyzingState(prev => prev ? {
          ...prev,
          progress: 10,
          status: 'processing'
        } : null);

        const compressionResult = await compressForIOS(file);
        processedFile = compressionResult.compressedFile;
        
        console.log(`圧縮完了:`, {
          original: formatFileSize(compressionResult.originalSize),
          compressed: formatFileSize(compressionResult.compressedSize),
          ratio: `${(compressionResult.compressionRatio * 100).toFixed(1)}%`,
          format: compressionResult.processedFormat
        });

        // 圧縮後の画像URLを生成
        imageUrl = URL.createObjectURL(processedFile);
        
        // 分析状態を更新（圧縮された画像URLを使用）
        setAnalyzingState(prev => prev ? {
          ...prev,
          file: processedFile,
          imageUrl: imageUrl,
          progress: 25
        } : null);
      }

      // 非同期で分析を開始
      await performImageAnalysis(processedFile, imageUrl, mealType);

      // メモリ解放（元の画像URLのみ削除、圧縮後画像URLは分析結果で使用するため保持）
      if (originalImageUrl !== imageUrl) {
        URL.revokeObjectURL(originalImageUrl);
      }

    } catch (error) {
      console.error('画像処理エラー:', error);
      
      let errorMessage = '画像の処理中にエラーが発生しました。';
      if (error instanceof Error) {
        if (error.message.includes('compression')) {
          errorMessage = '画像の圧縮に失敗しました。別の画像をお試しください。';
        } else if (error.message.includes('load')) {
          errorMessage = '画像ファイルが破損している可能性があります。別の画像をお試しください。';
        }
      }

      setAnalyzingState(prev => prev ? {
        ...prev,
        status: 'error',
        error: errorMessage
      } : null);

      // メモリ解放（元の画像URLのみ削除）
      URL.revokeObjectURL(originalImageUrl);
    }
  };

  const performImageAnalysis = async (file: File, imageUrl: string, mealType: MealType) => {
    try {
      const progressCallback = (progress: number) => {
        setAnalyzingState(prev => prev ? {
          ...prev,
          progress: Math.max(prev.progress, progress), // 既存の進捗を下回らないように
          status: progress < 50 ? 'uploading' : progress < 100 ? 'processing' : 'completed'
        } : null);
      };

      const analysis = await analyzeFoodMutation.mutateAsync({ 
        image: file, 
        progressCallback 
      });
      
      // プログレス100%に設定
      progressCallback(100);
      
      // 分析結果を保存
      setAnalysisResult({
        analysis: analysis as unknown as Record<string, unknown>,
        imageUrl,
        mealType
      });
      
      // 少し待ってから画面遷移（ユーザーが完了を認識できるように）
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 分析中状態をクリア
      setAnalyzingState(null);
      
      // 完了コールバックを呼び出し
      if (onAnalysisCompleteRef.current) {
        onAnalysisCompleteRef.current();
        onAnalysisCompleteRef.current = null;
      }

    } catch (error) {
      console.error('画像分析エラー:', error);

      // エラーの種類に応じたメッセージ
      let errorMessage = '画像の分析中にエラーが発生しました。';

      if (error instanceof TypeError && error.message.includes('fetch')) {
        errorMessage = 'ネットワーク接続が不安定です。インターネット接続を確認して再度お試しください。';
      } else if (error instanceof Error && error.message.includes('timeout')) {
        errorMessage = '処理がタイムアウトしました。しばらく待ってから再度お試しください。';
      } else if (error instanceof Error && error.message.includes('server')) {
        errorMessage = 'サーバーで一時的な問題が発生しています。しばらく待ってから再度お試しください。';
      }

      // エラー状態を設定
      setAnalyzingState(prev => prev ? {
        ...prev,
        status: 'error',
        error: errorMessage
      } : null);
    }
  };

  // 分析結果を食材として変換
  const convertAnalysisToFoodItem = (result: AnalysisResult): FoodItem => {
    const analysis = result.analysis;
    const ingredients = Array.isArray(analysis.ingredients) ? analysis.ingredients : [];
    const dishName = typeof analysis.dish_name === 'string' ? analysis.dish_name : '分析した食材';

    const ingredientText = ingredients.length > 0
      ? `原材料: ${ingredients.join('、')}`
      : '';

    return {
      name: dishName,
      memo: ingredientText
    };
  };

  const clearAnalysisState = () => {
    // 画像URLのメモリ解放
    if (analysisResult?.imageUrl) {
      URL.revokeObjectURL(analysisResult.imageUrl);
    }
    if (analyzingState?.imageUrl) {
      URL.revokeObjectURL(analyzingState.imageUrl);
    }
    
    setAnalyzingState(null);
    setAnalysisResult(null);
  };

  return {
    analyzingState,
    analysisResult,
    analyzeImage,
    performImageAnalysis,
    convertAnalysisToFoodItem,
    clearAnalysisState,
  };
};