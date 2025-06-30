'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { ErrorMessage } from '@/components/ui/error-message';
import { useActiveChild, useChildren, useChildActions, useChildAllergies, useAllergyActions } from '@/stores/app-store';
import type { AllergyInfo } from '@/types';
import { Plus, Trash2, Save, User, AlertTriangle, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
import { validateInput, childNameRules, allergyNameRules } from '@/utils/validation';
import { sanitizeInput } from '@/utils/security';
import { CharacterCounter } from '@/components/ui/character-counter';
import { InputLimits } from '@/components/ui/input-limits';
import { AgeSelect } from '@/components/ui/age-select';

const childInfoFormSchema = z.object({
  name: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      const validation = validateInput(val, childNameRules);
      return validation.isValid;
    }, '使用できない文字が含まれています'),
  age: z.number().min(0, '0歳以上を入力してください').max(36, '3歳以下を入力してください'),
  weight: z.number().min(1, '体重を正しく入力してください').max(50, '体重を正しく入力してください').optional(),
  height: z.number().min(30, '身長を正しく入力してください').max(150, '身長を正しく入力してください').optional(),
});

type ChildInfoFormData = z.infer<typeof childInfoFormSchema>;

interface ChildSettingsFormProps {
  onSave?: (childId: string) => void;
}

export function ChildSettingsForm({ onSave }: ChildSettingsFormProps) {
  const activeChild = useActiveChild();
  const children = useChildren();
  const { addChild, updateChild, deleteChild, setActiveChild } = useChildActions();
  const { addAllergy, removeAllergy } = useAllergyActions();
  const activeChildAllergies = useChildAllergies(activeChild?.id || '');
  
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newAllergyName, setNewAllergyName] = useState('');
  const [showAllergyForm, setShowAllergyForm] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChildInfoFormData>({
    resolver: zodResolver(childInfoFormSchema),
    defaultValues: {
      name: '',
      age: 12,
      weight: undefined,
      height: undefined,
    },
    values: activeChild ? {
      name: activeChild.name || '',
      age: activeChild.age,
      weight: activeChild.weight || undefined,
      height: activeChild.height || undefined,
    } : undefined,
  });

  const onFormSubmit = async (data: ChildInfoFormData) => {
    try {
      setSubmitError(null);
      setSaveSuccess(false);

      // 入力データのサニタイズ
      const sanitizedData = {
        ...data,
        name: data.name ? sanitizeInput(data.name) : data.name,
      };

      if (isAddingChild || !activeChild) {
        // 新しい子どもを追加
        const childId = addChild(sanitizedData);
        setIsAddingChild(false);
        onSave?.(childId);
      } else {
        // 既存の子どもを更新
        updateChild(activeChild.id, sanitizedData);
        onSave?.(activeChild.id);
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('設定の保存に失敗しました:', error);
      setSubmitError('設定の保存に失敗しました。もう一度お試しください。');
    }
  };

  const addNewAllergy = () => {
    if (newAllergyName.trim() && activeChild) {
      // アレルギー名のバリデーション
      const validation = validateInput(newAllergyName, allergyNameRules);
      if (!validation.isValid) {
        alert(`入力エラー:\n${validation.errors.join('\n')}`);
        return;
      }

      const newAllergy: Omit<AllergyInfo, 'id'> = {
        childId: activeChild.id,
        name: sanitizeInput(validation.sanitizedValue),
        type: 'food',
      };
      
      addAllergy(newAllergy);
      setNewAllergyName('');
      setShowAllergyForm(false);
    }
  };

  const handleDeleteChild = (childId: string) => {
    if (confirm('このお子さまの情報を削除してもよろしいですか？\n関連する食事記録やアレルギー情報も削除されます。')) {
      deleteChild(childId);
    }
  };

  const commonAllergies = [
    { name: '🥚 卵', value: '卵' },
    { name: '🥛 乳', value: '乳' },
    { name: '🌾 小麦', value: '小麦' },
    { name: '🫘 大豆', value: '大豆' },
    { name: '🍜 そば', value: 'そば' },
    { name: '🥜 落花生', value: '落花生' },
    { name: '🦐 えび', value: 'えび' },
    { name: '🦀 かに', value: 'かに' },
  ];

  const severityColors = {
    mild: 'bg-chart-4 text-foreground',
    moderate: 'bg-chart-5 text-foreground',
    severe: 'bg-destructive text-primary-foreground',
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 子ども切り替え / 追加ヘッダー */}
      {children.length > 0 && !isAddingChild && (
        <div className="bg-card rounded-3xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                const currentIndex = children.findIndex(c => c.id === activeChild?.id);
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : children.length - 1;
                setActiveChild(children[prevIndex].id);
                reset();
              }}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={children.length <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              {activeChild?.name || `お子さま ${children.findIndex(c => c.id === activeChild?.id) + 1}`}
              ({children.findIndex(c => c.id === activeChild?.id) + 1} / {children.length})
            </span>
            <Button
              onClick={() => {
                const currentIndex = children.findIndex(c => c.id === activeChild?.id);
                const nextIndex = currentIndex < children.length - 1 ? currentIndex + 1 : 0;
                setActiveChild(children[nextIndex].id);
                reset();
              }}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={children.length <= 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={() => {
              setIsAddingChild(true);
              reset({
                name: '',
                age: 12,
                weight: undefined,
                height: undefined,
              });
            }}
            variant="outline"
            size="sm"
          >
            <UserPlus className="h-4 w-4 mr-1" />
            新しいお子さまを追加
          </Button>
        </div>
      )}

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

        {/* 基本情報カード */}
        <div className="bg-card rounded-3xl p-3 mb-3">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <User className="w-5 h-5" /> 
            {isAddingChild ? '新しいお子さまの基本情報' : 'お子さまの基本情報'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-base font-medium text-foreground mb-2">
                お名前（任意）
              </label>
              <div className="relative">
                <input
                  type="text"
                  {...register('name')}
                  placeholder="例: 太郎"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                />
                {watch('name') && (
                  <CharacterCounter
                    current={watch('name')?.length || 0}
                    max={childNameRules.maxLength || 50}
                    className="absolute -bottom-5 right-1 text-xs"
                  />
                )}
              </div>
              <InputLimits rules={childNameRules} className="mt-1" />
            </div>
            
            <div>
              <label className="block text-base font-medium text-foreground mb-2">
                👶 お子様の年齢 <span className="text-destructive">*</span>
              </label>
              <AgeSelect
                value={watch('age')}
                onChange={(value) => {
                  setValue('age', value);
                }}
              />
              <p className="mt-1 text-base text-muted-foreground">
                年齢に応じて栄養目標値とアドバイス内容が変わります
              </p>
              {errors.age && (
                <p className="mt-1 text-sm text-destructive">{errors.age.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-base font-medium text-foreground mb-2">
                体重（kg）
              </label>
              <input
                type="number"
                step="0.1"
                {...register('weight', { valueAsNumber: true })}
                placeholder="例: 8.5"
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
              />
              {errors.weight && (
                <p className="mt-1 text-sm text-destructive">{errors.weight.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-base font-medium text-foreground mb-2">
                身長（cm）
              </label>
              <input
                type="number"
                step="0.1"
                {...register('height', { valueAsNumber: true })}
                placeholder="例: 75.0"
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
              />
              {errors.height && (
                <p className="mt-1 text-sm text-destructive">{errors.height.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* アレルギー情報カード（既存の子どもの場合のみ表示） */}
        {!isAddingChild && activeChild && (
          <div className="bg-card rounded-3xl p-3 mb-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                アレルギー情報
              </h3>
              <Button
                type="button"
                onClick={() => setShowAllergyForm(!showAllergyForm)}
                size="sm"
                variant="outline"
                className="flex items-center gap-1"
              >
                <Plus size={16} />
                アレルギーを追加
              </Button>
            </div>

            {/* 既存アレルギー一覧 */}
            {activeChildAllergies.length > 0 && (
              <div className="space-y-2">
                {activeChildAllergies.map((allergy) => (
                  <div
                    key={allergy.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-medium text-foreground">{allergy.name}</span>
                    </div>
                    <Button
                      type="button"
                      onClick={() => removeAllergy(allergy.id)}
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive/60 h-8 w-8"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* アレルギー追加フォーム */}
            {showAllergyForm && (
              <div className="p-3 bg-muted rounded-lg space-y-3">
                <div className="grid grid-cols-1 gap-3">
                  {/* アレルギー名入力 */}
                  <div>
                    <label className="block text-base font-medium text-foreground mb-2">
                      アレルギー名
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newAllergyName}
                        onChange={(e) => setNewAllergyName(e.target.value)}
                        placeholder="例: 卵"
                        className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent text-foreground"
                      />
                      {newAllergyName && (
                        <CharacterCounter
                          current={newAllergyName.length}
                          max={allergyNameRules.maxLength || 100}
                          className="absolute -bottom-5 right-1 text-xs"
                        />
                      )}
                    </div>
                    <InputLimits rules={allergyNameRules} className="mt-1" />
                  </div>

                  {/* クイック選択ボタン */}
                  <div className="grid grid-cols-2 gap-2">
                    {commonAllergies.map((allergy) => (
                      <Button
                        key={allergy.value}
                        type="button"
                        onClick={() => setNewAllergyName(allergy.value)}
                        variant="outline"
                        className="px-3 py-2 text-sm text-left justify-start"
                        size="sm"
                      >
                        {allergy.name}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={addNewAllergy}
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    追加
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowAllergyForm(false)}
                    size="sm"
                    variant="outline"
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-6 space-y-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-white"
            title={isSubmitting ? '設定を保存しています' : undefined}
          >
            {!isSubmitting && <Save className="w-4 h-4" />}
            {isAddingChild ? '新しいお子さまを追加' : '設定を保存'}
          </Button>
          
          {/* 削除ボタン（既存の子どもで、かつ他に子どもがいる場合のみ表示） */}
          {!isAddingChild && activeChild && children.length > 1 && (
            <Button
              type="button"
              onClick={() => handleDeleteChild(activeChild.id)}
              variant="outline"
              className="w-full text-destructive hover:text-destructive/90"
            >
              <Trash2 className="w-4 h-4" />
              このお子さまの情報を削除
            </Button>
          )}
          
          {/* キャンセルボタン（新規追加時のみ） */}
          {isAddingChild && (
            <Button
              type="button"
              onClick={() => {
                setIsAddingChild(false);
                reset();
              }}
              variant="outline"
              className="w-full"
            >
              キャンセル
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}