import { act, renderHook } from '@testing-library/react';
import { 
  useAppStore, 
  useBreakfastFoods, 
  useLunchFoods, 
  useDinnerFoods, 
  useSpecialNotes,
  useDailyMealActions 
} from '../app-store';
import type { FoodItem } from '@/types';

// ローカルストレージのモック
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('app-store 食事データ機能', () => {
  beforeEach(() => {
    // ストアをリセット
    const { result } = renderHook(() => useAppStore());
    act(() => {
      result.current.resetStore();
    });
    jest.clearAllMocks();
  });

  describe('初期状態', () => {
    it('食事データが空配列で初期化される', () => {
      const { result: breakfastResult } = renderHook(() => useBreakfastFoods());
      const { result: lunchResult } = renderHook(() => useLunchFoods());
      const { result: dinnerResult } = renderHook(() => useDinnerFoods());
      
      expect(breakfastResult.current).toEqual([]);
      expect(lunchResult.current).toEqual([]);
      expect(dinnerResult.current).toEqual([]);
    });

    it('特記事項が空文字で初期化される', () => {
      const { result } = renderHook(() => useSpecialNotes());
      expect(result.current).toBe('');
    });
  });

  describe('食材追加機能', () => {
    it('朝食に食材を追加できる', () => {
      const { result: actionsResult } = renderHook(() => useDailyMealActions());
      const { result: breakfastResult } = renderHook(() => useBreakfastFoods());

      const food: FoodItem = {
        name: 'ご飯',
        category: '主食',
        servings: 1,
        memo: 'テスト用'
      };

      act(() => {
        actionsResult.current.addMealFood('breakfast', food);
      });

      expect(breakfastResult.current).toHaveLength(1);
      expect(breakfastResult.current[0]).toEqual(food);
    });

    it('昼食に食材を追加できる', () => {
      const { result: actionsResult } = renderHook(() => useDailyMealActions());
      const { result: lunchResult } = renderHook(() => useLunchFoods());

      const food: FoodItem = {
        name: 'パン',
        category: '主食',
        servings: 1.5
      };

      act(() => {
        actionsResult.current.addMealFood('lunch', food);
      });

      expect(lunchResult.current).toHaveLength(1);
      expect(lunchResult.current[0]).toEqual(food);
    });

    it('夕食に食材を追加できる', () => {
      const { result: actionsResult } = renderHook(() => useDailyMealActions());
      const { result: dinnerResult } = renderHook(() => useDinnerFoods());

      const food: FoodItem = {
        name: '野菜炒め',
        category: '副菜',
        servings: 0.5
      };

      act(() => {
        actionsResult.current.addMealFood('dinner', food);
      });

      expect(dinnerResult.current).toHaveLength(1);
      expect(dinnerResult.current[0]).toEqual(food);
    });
  });

  describe('食材更新機能', () => {
    it('食材を更新できる', () => {
      const { result: actionsResult } = renderHook(() => useDailyMealActions());
      const { result: breakfastResult } = renderHook(() => useBreakfastFoods());

      const originalFood: FoodItem = {
        name: 'ご飯',
        category: '主食',
        servings: 1
      };

      const updatedFood: FoodItem = {
        name: 'パン',
        category: '主食',
        servings: 2,
        memo: '更新済み'
      };

      // 食材を追加
      act(() => {
        actionsResult.current.addMealFood('breakfast', originalFood);
      });

      // 食材を更新
      act(() => {
        actionsResult.current.updateMealFood('breakfast', 0, updatedFood);
      });

      expect(breakfastResult.current).toHaveLength(1);
      expect(breakfastResult.current[0]).toEqual(updatedFood);
    });
  });

  describe('食材削除機能', () => {
    it('食材を削除できる', () => {
      const { result: actionsResult } = renderHook(() => useDailyMealActions());
      const { result: breakfastResult } = renderHook(() => useBreakfastFoods());

      const food1: FoodItem = { name: 'ご飯', category: '主食', servings: 1 };
      const food2: FoodItem = { name: 'パン', category: '主食', servings: 1 };

      // 2つの食材を追加
      act(() => {
        actionsResult.current.addMealFood('breakfast', food1);
        actionsResult.current.addMealFood('breakfast', food2);
      });

      expect(breakfastResult.current).toHaveLength(2);

      // 最初の食材を削除
      act(() => {
        actionsResult.current.deleteMealFood('breakfast', 0);
      });

      expect(breakfastResult.current).toHaveLength(1);
      expect(breakfastResult.current[0]).toEqual(food2);
    });
  });

  describe('特記事項機能', () => {
    it('特記事項を更新できる', () => {
      const { result: actionsResult } = renderHook(() => useDailyMealActions());
      const { result: notesResult } = renderHook(() => useSpecialNotes());

      const notes = '今日は食欲がない様子です';

      act(() => {
        actionsResult.current.updateSpecialNotes(notes);
      });

      expect(notesResult.current).toBe(notes);
    });
  });

  describe('データクリア機能', () => {
    it('全ての食事データをクリアできる', () => {
      const { result: actionsResult } = renderHook(() => useDailyMealActions());
      const { result: breakfastResult } = renderHook(() => useBreakfastFoods());
      const { result: notesResult } = renderHook(() => useSpecialNotes());

      const food: FoodItem = { name: 'ご飯', category: '主食', servings: 1 };

      // データを追加
      act(() => {
        actionsResult.current.addMealFood('breakfast', food);
        actionsResult.current.updateSpecialNotes('テスト');
      });

      expect(breakfastResult.current).toHaveLength(1);
      expect(notesResult.current).toBe('テスト');

      // データをクリア
      act(() => {
        actionsResult.current.clearDailyMealData();
      });

      expect(breakfastResult.current).toHaveLength(0);
      expect(notesResult.current).toBe('');
    });
  });
});