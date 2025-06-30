import { act, renderHook } from '@testing-library/react';
import { useMealData } from '../useMealData';
import { useAppStore } from '@/stores/app-store';
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

describe('useMealData', () => {
  beforeEach(() => {
    // ストアをリセット
    const { result } = renderHook(() => useAppStore());
    act(() => {
      result.current.resetStore();
    });
    jest.clearAllMocks();
  });

  describe('初期データ', () => {
    it('空のストアは空の配列を返す', async () => {
      const { result } = renderHook(() => useMealData());
      
      // 初期効果が実行されるまで待機
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(result.current.breakfastFoods).toHaveLength(0);
      expect(result.current.lunchFoods).toHaveLength(0);
      expect(result.current.dinnerFoods).toHaveLength(0);
    });
  });

  describe('食材操作', () => {
    it('食材を追加できる', async () => {
      const { result } = renderHook(() => useMealData());
      
      // 初期効果が実行されるまで待機
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const newFood: FoodItem = {
        name: 'パン',
        category: '主食',
        servings: 1.5,
        memo: 'テスト用食材'
      };

      act(() => {
        result.current.addMealFood('lunch', newFood);
      });

      expect(result.current.lunchFoods).toHaveLength(1);
      expect(result.current.lunchFoods[0]).toEqual(newFood);
    });

    it('食材を更新できる', async () => {
      const { result } = renderHook(() => useMealData());
      
      // 初期効果が実行されるまで待機
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const updatedFood: FoodItem = {
        name: 'パン',
        category: '主食',
        servings: 2,
        memo: '更新済み'
      };

      act(() => {
        result.current.updateMealFood('breakfast', 0, updatedFood);
      });

      expect(result.current.breakfastFoods[0]).toEqual(updatedFood);
    });

    it('食材を削除できる', async () => {
      const { result } = renderHook(() => useMealData());
      
      // 初期効果が実行されるまで待機
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // まず食材を追加
      const testFood: FoodItem = {
        name: 'テスト食材',
        category: '主食',
        servings: 1.0,
        memo: ''
      };

      act(() => {
        result.current.addMealFood('breakfast', testFood);
      });

      expect(result.current.breakfastFoods).toHaveLength(1);

      // 追加した食材を削除
      act(() => {
        result.current.deleteMealFood('breakfast', 0);
      });

      expect(result.current.breakfastFoods).toHaveLength(0);
    });
  });

  describe('食事サマリー計算', () => {
    it('食材数が正しく計算される', async () => {
      const { result } = renderHook(() => useMealData());
      
      // 初期効果が実行されるまで待機
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // 朝食に食材を追加
      const breakfastFoods: FoodItem[] = [
        { name: 'ご飯', category: '主食', servings: 1.0, memo: '' },
        { name: '野菜炒め', category: '副菜', servings: 1.0, memo: '' },
        { name: '味噌汁', category: '副菜', servings: 0.5, memo: '' }
      ];

      act(() => {
        breakfastFoods.forEach(food => {
          result.current.addMealFood('breakfast', food);
        });
      });

      expect(result.current.dailySummary.totalFoodCount).toBe(3);
    });

    it('複数の食事にまたがる食材数が正しく計算される', async () => {
      const { result } = renderHook(() => useMealData());
      
      // 初期効果が実行されるまで待機
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // 朝食に食材を追加
      const breakfastFoods: FoodItem[] = [
        { name: 'ご飯', category: '主食', servings: 1.0, memo: '' },
        { name: '野菜炒め', category: '副菜', servings: 1.0, memo: '' },
        { name: '味噌汁', category: '副菜', servings: 0.5, memo: '' }
      ];

      const lunchFood: FoodItem = {
        name: '魚',
        category: '主菜',
        servings: 1,
        memo: ''
      };

      const dinnerFood: FoodItem = {
        name: 'りんご',
        category: '果物',
        servings: 0.5,
        memo: ''
      };

      act(() => {
        breakfastFoods.forEach(food => {
          result.current.addMealFood('breakfast', food);
        });
        result.current.addMealFood('lunch', lunchFood);
        result.current.addMealFood('dinner', dinnerFood);
      });

      // 朝食3品 + 昼食1品 + 夕食1品 = 5品
      expect(result.current.dailySummary.totalFoodCount).toBe(5);
    });
  });

  describe('永続化', () => {
    it('ストア状態が永続化される', async () => {
      const { result } = renderHook(() => useMealData());
      
      // 初期効果が実行されるまで待機
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      const newFood: FoodItem = {
        name: 'パン',
        category: '主食',
        servings: 1,
      };

      act(() => {
        result.current.addMealFood('lunch', newFood);
      });

      // 新しいフックインスタンスで同じデータが取得できることを確認
      const { result: newResult } = renderHook(() => useMealData());
      
      expect(newResult.current.lunchFoods).toHaveLength(1);
      expect(newResult.current.lunchFoods[0]).toEqual(newFood);
    });
  });
});