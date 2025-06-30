'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/ui/error-message';
import { useAppStore } from '@/stores/app-store';
import type { UserPreferences } from '@/types';
import { Save, Settings, MessageSquare } from 'lucide-react';

const settingsFormSchema = z.object({
  notificationSettings: z.object({
    mealReminders: z.boolean(),
    nutritionTips: z.boolean(),
    weeklyReports: z.boolean(),
  }),
  theme: z.enum(['light', 'dark']),
});

type SettingsFormData = z.infer<typeof settingsFormSchema>;

interface SettingsFormProps {
  onSave?: (preferences: UserPreferences) => void;
}

export function SettingsForm({ onSave }: SettingsFormProps) {
  const { user, updateUserPreferences } = useAppStore();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      notificationSettings: {
        mealReminders: false,
        nutritionTips: false,
        weeklyReports: false,
      },
      theme: 'light',
    },
    values: {
      notificationSettings: user.preferences.notificationSettings,
      theme: user.preferences.theme === 'system' ? 'light' : user.preferences.theme,
    },
  });

  const onFormSubmit = async (data: SettingsFormData) => {
    try {
      setSubmitError(null);
      setSaveSuccess(false);

      const updatedPreferences: Partial<UserPreferences> = {
        notificationSettings: data.notificationSettings,
        theme: data.theme,
      };

      updateUserPreferences(updatedPreferences);
      onSave?.(user.preferences);
      
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      setSubmitError('設定の保存に失敗しました。もう一度お試しください。');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-3">
        {/* エラーメッセージ */}
        {submitError && (
          <ErrorMessage
            message={submitError}
            dismissible
            onDismiss={() => setSubmitError(null)}
          />
        )}

        {/* 成功メッセージ */}
        {saveSuccess && (
          <ErrorMessage
            message="設定が正常に保存されました"
            title="成功"
            variant="info"
            dismissible
            onDismiss={() => setSaveSuccess(false)}
          />
        )}

        {/* 表示設定カード */}
        <div className="bg-card rounded-3xl p-3 mb-3">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Settings className="w-5 h-5" /> 表示設定
          </h3>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('notificationSettings.nutritionTips')}
                className="w-4 h-4 text-primary border-border rounded focus:ring-ring"
              />
              <div>
                <span className="text-base font-medium text-foreground">栄養情報を詳しく表示</span>
                <p className="text-sm text-muted-foreground">栄養バランスの詳細分析を表示します</p>
              </div>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                {...register('notificationSettings.weeklyReports')}
                className="w-4 h-4 text-primary border-border rounded focus:ring-ring"
              />
              <div>
                <span className="text-base font-medium text-foreground">実践的なコツを表示</span>
                <p className="text-sm text-muted-foreground">食事準備の実用的なアドバイスを表示します</p>
              </div>
            </label>
          </div>
          
          <div className="space-y-4 mt-4">
            <h4 className="text-base font-medium text-foreground">表示テーマ</h4>
          
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="light"
                {...register('theme')}
                className="w-4 h-4 text-primary border-border focus:ring-ring"
              />
              <span className="text-sm text-foreground">ライト</span>
            </label>
            
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="dark"
                {...register('theme')}
                className="w-4 h-4 text-primary border-border focus:ring-ring"
              />
              <span className="text-sm text-foreground">ダーク</span>
            </label>
          </div>
          </div>
        </div>

        {/* サポート情報カード */}
        <div className="bg-card rounded-3xl p-3 mb-3">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> サポート
          </h3>
          
          <div className="bg-accent p-4 rounded-lg">
            <div className="space-y-2">
              <p className="text-sm font-medium text-accent-foreground">対象年齢: 0歳〜3歳</p>
              <p className="text-sm text-accent-foreground">相談内容: 栄養バランス、レシピ提案、食事の悩み</p>
              <p className="text-sm text-accent-foreground">注意: 医療アドバイスは提供していません</p>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <Button
              type="button"
              onClick={() => {
                // チャット履歴クリア機能を実装予定
                if (confirm('チャット履歴をすべて削除しますか？')) {
                  alert('チャット履歴をクリアしました');
                }
              }}
              variant="outline"
              className="w-full"
            >
              🗑️ チャット履歴をクリア
            </Button>
          </div>
        </div>

        <div className="pt-6 space-y-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-white"
            title={isSubmitting ? '設定を保存しています' : undefined}
          >
            {!isSubmitting && <Save className="w-4 h-4" />}
            設定を保存
          </Button>
        </div>
      </form>
    </div>
  );
}