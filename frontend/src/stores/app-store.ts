import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useMemo } from 'react';
import type { 
  AppState, 
  UserPreferences, 
  MealRecord,
  ChatSession, 
  ChatMessage,
  AppError,
  ChildInfo,
  AllergyInfo,
  DailyMealData,
  FoodItem,
  MealType,
  AuthUser 
} from '@/types';

interface AppStore extends AppState {
  // Children Meal Data Storage
  childrenMealData: Record<string, DailyMealData>;
  
  // Pending Consultation Message
  pendingConsultationMessage: string | null;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: AppError | null) => void;
  
  // Auth Actions
  setAuthUser: (user: AuthUser | null) => void;
  setAuthLoading: (loading: boolean) => void;
  
  // User Actions
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  
  // Child Management Actions
  addChild: (child: Omit<ChildInfo, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateChild: (childId: string, updates: Partial<ChildInfo>) => void;
  deleteChild: (childId: string) => void;
  setActiveChild: (childId: string) => void;
  
  // Allergy Actions
  addAllergy: (allergy: Omit<AllergyInfo, 'id'>) => void;
  removeAllergy: (allergyId: string) => void;
  
  // Meal Record Actions
  addMealRecord: (meal: Omit<MealRecord, 'id'>) => void;
  updateMealRecord: (mealId: string, updates: Partial<MealRecord>) => void;
  deleteMealRecord: (mealId: string) => void;
  
  // Daily Meal Data Actions
  addMealFood: (mealType: MealType, food: FoodItem) => void;
  updateMealFood: (mealType: MealType, index: number, food: FoodItem) => void;
  deleteMealFood: (mealType: MealType, index: number) => void;
  updateSpecialNotes: (notes: string) => void;
  clearDailyMealData: () => void;
  
  // Chat Actions
  createChatSession: (session: Omit<ChatSession, 'id' | 'createdAt' | 'updatedAt'>) => void;
  deleteChatSession: (sessionId: string) => void;
  setCurrentChatSession: (sessionId: string | null) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateChatMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  setChatTyping: (isTyping: boolean) => void;
  setChatConnected: (isConnected: boolean) => void;
  
  // UI Actions
  setCurrentPage: (page: string) => void;
  setDrawerOpen: (open: boolean) => void;
  setActiveModal: (modal: string | null) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  
  // Consultation Actions
  setConsultationTitle: (title: string) => void;
  setPendingConsultationMessage: (message: string | null) => void;
  clearPendingConsultationMessage: () => void;
  
  // Utility Actions
  resetStore: () => void;
  clearError: () => void;
}

// デフォルト値
const defaultUserPreferences: UserPreferences = {
  children: [],
  activeChildId: null,
  allergies: [],
  dietaryRestrictions: {},
  notificationSettings: {
    mealReminders: true,
    nutritionTips: true,
    weeklyReports: false,
  },
  theme: 'system',
};

// デフォルトの日別食事データを作成する関数
const createDefaultDailyMealData = (childId: string): DailyMealData => ({
  childId,
  breakfast: [],
  lunch: [],
  dinner: [],
  specialNotes: '',
  updatedAt: new Date().toISOString(),
});

const defaultState: AppState = {
  isLoading: false,
  error: null,
  auth: {
    user: null,
    isLoading: true,
  },
  user: {
    preferences: defaultUserPreferences,
    mealHistory: [],
    chatSessions: [],
  },
  ui: {
    currentPage: '/',
    isDrawerOpen: false,
    activeModal: null,
    theme: 'light',
    consultationTitle: '夕食相談',
  },
  chat: {
    currentSession: null,
    isTyping: false,
    isConnected: false,
  },
  dailyMeal: createDefaultDailyMealData(''),
  childrenMealData: {},
};

const defaultStoreState = {
  ...defaultState,
  childrenMealData: {} as Record<string, DailyMealData>,
  pendingConsultationMessage: null,
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...defaultStoreState,
      
      // Loading & Error Actions
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      
      // Auth Actions
      setAuthUser: (user) => 
        set((state) => ({
          auth: { ...state.auth, user },
        })),
      setAuthLoading: (isLoading) =>
        set((state) => ({
          auth: { ...state.auth, isLoading },
        })),
      
      // User Actions
      updateUserPreferences: (preferences) =>
        set((state) => ({
          user: {
            ...state.user,
            preferences: { ...state.user.preferences, ...preferences },
          },
        })),
      
      // Child Management Actions
      addChild: (childData) => {
        const childId = crypto.randomUUID();
        const now = new Date().toISOString();
        const child: ChildInfo = {
          id: childId,
          createdAt: now,
          updatedAt: now,
          ...childData,
        };
        
        set((state) => {
          const currentChildren = state.user?.preferences?.children || [];
          const isFirstChild = currentChildren.length === 0;
          return {
            user: {
              ...state.user,
              preferences: {
                ...state.user.preferences,
                children: [...currentChildren, child],
                activeChildId: isFirstChild ? childId : state.user.preferences.activeChildId,
              },
            },
            // 最初の子どもの場合、その子ども用のdailyMealを作成
            dailyMeal: isFirstChild ? createDefaultDailyMealData(childId) : state.dailyMeal,
          };
        });
        
        return childId;
      },
      
      updateChild: (childId, updates) =>
        set((state) => {
          const currentChildren = state.user?.preferences?.children || [];
          return {
            user: {
              ...state.user,
              preferences: {
                ...state.user.preferences,
                children: currentChildren.map(child =>
                  child.id === childId 
                    ? { ...child, ...updates, updatedAt: new Date().toISOString() }
                    : child
                ),
              },
            },
          };
        }),
      
      deleteChild: (childId) =>
        set((state) => {
          const currentChildren = state.user?.preferences?.children || [];
          const currentAllergies = state.user?.preferences?.allergies || [];
          const currentDietaryRestrictions = state.user?.preferences?.dietaryRestrictions || {};
          const currentMealHistory = state.user?.mealHistory || [];
          const currentChatSessions = state.user?.chatSessions || [];
          
          const remainingChildren = currentChildren.filter(c => c.id !== childId);
          const wasActive = state.user?.preferences?.activeChildId === childId;
          const newActiveChildId = wasActive && remainingChildren.length > 0 
            ? remainingChildren[0].id 
            : state.user?.preferences?.activeChildId;
          
          // 削除される子どもの食事データも削除
          const updatedChildrenMealData = { ...state.childrenMealData };
          delete updatedChildrenMealData[childId];
          
          // 新しいアクティブな子どもの食事データを取得
          const newDailyMeal = wasActive && newActiveChildId 
            ? (updatedChildrenMealData[newActiveChildId] || createDefaultDailyMealData(newActiveChildId))
            : state.dailyMeal;
          
          return {
            user: {
              ...state.user,
              preferences: {
                ...state.user.preferences,
                children: remainingChildren,
                activeChildId: remainingChildren.length === 0 ? null : newActiveChildId,
                allergies: currentAllergies.filter(a => a.childId !== childId),
                dietaryRestrictions: Object.fromEntries(
                  Object.entries(currentDietaryRestrictions)
                    .filter(([id]) => id !== childId)
                ),
              },
              mealHistory: currentMealHistory.filter(m => m.childId !== childId),
              chatSessions: currentChatSessions.filter(s => s.childId !== childId),
            },
            dailyMeal: newDailyMeal,
            childrenMealData: updatedChildrenMealData,
          };
        }),
      
      setActiveChild: (childId) =>
        set((state) => {
          // 現在のお子さまの食事データを保存
          const currentChildId = state.user.preferences.activeChildId;
          const updatedChildrenMealData = { ...state.childrenMealData };
          
          if (currentChildId) {
            updatedChildrenMealData[currentChildId] = state.dailyMeal;
          }
          
          // 新しいお子さまの食事データを取得（なければ新規作成）
          const newDailyMeal = updatedChildrenMealData[childId] || createDefaultDailyMealData(childId);
          
          return {
            user: {
              ...state.user,
              preferences: {
                ...state.user.preferences,
                activeChildId: childId,
              },
            },
            dailyMeal: newDailyMeal,
            childrenMealData: updatedChildrenMealData,
          };
        }),
      
      // Allergy Actions
      addAllergy: (allergyData) => {
        const allergy: AllergyInfo = {
          id: crypto.randomUUID(),
          ...allergyData,
        };
        
        set((state) => {
          const currentAllergies = state.user?.preferences?.allergies || [];
          return {
            user: {
              ...state.user,
              preferences: {
                ...state.user.preferences,
                allergies: [...currentAllergies, allergy],
              },
            },
          };
        });
      },
      
      removeAllergy: (allergyId) =>
        set((state) => {
          const currentAllergies = state.user?.preferences?.allergies || [];
          return {
            user: {
              ...state.user,
              preferences: {
                ...state.user.preferences,
                allergies: currentAllergies.filter(a => a.id !== allergyId),
              },
            },
          };
        }),
      
      // Meal Record Actions
      addMealRecord: (mealData) => {
        const meal: MealRecord = {
          id: crypto.randomUUID(),
          ...mealData,
        };
        
        set((state) => ({
          user: {
            ...state.user,
            mealHistory: [meal, ...state.user.mealHistory],
          },
        }));
      },
      
      updateMealRecord: (mealId, updates) =>
        set((state) => ({
          user: {
            ...state.user,
            mealHistory: state.user.mealHistory.map(meal =>
              meal.id === mealId ? { ...meal, ...updates } : meal
            ),
          },
        })),
      
      deleteMealRecord: (mealId) =>
        set((state) => ({
          user: {
            ...state.user,
            mealHistory: state.user.mealHistory.filter(meal => meal.id !== mealId),
          },
        })),
      
      // Chat Actions
      createChatSession: (sessionData) => {
        const session: ChatSession = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...sessionData,
        };
        
        set((state) => ({
          user: {
            ...state.user,
            chatSessions: [session, ...state.user.chatSessions],
          },
          chat: {
            ...state.chat,
            currentSession: session,
          },
        }));
      },
      
      deleteChatSession: (sessionId) =>
        set((state) => ({
          user: {
            ...state.user,
            chatSessions: state.user.chatSessions.filter(s => s.id !== sessionId),
          },
          chat: {
            ...state.chat,
            currentSession: state.chat.currentSession?.id === sessionId ? null : state.chat.currentSession,
          },
        })),
      
      setCurrentChatSession: (sessionId) => {
        const session = sessionId ? get().user.chatSessions.find(s => s.id === sessionId) : null;
        set((state) => ({
          chat: {
            ...state.chat,
            currentSession: session || null,
          },
        }));
      },
      
      addChatMessage: (messageData) => {
        const message: ChatMessage = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          ...messageData,
        };
        
        set((state) => {
          const currentSession = state.chat.currentSession;
          if (!currentSession) return state;
          
          const updatedSession = {
            ...currentSession,
            messages: [...currentSession.messages, message],
            updatedAt: new Date().toISOString(),
          };
          
          return {
            user: {
              ...state.user,
              chatSessions: state.user.chatSessions.map(s =>
                s.id === currentSession.id ? updatedSession : s
              ),
            },
            chat: {
              ...state.chat,
              currentSession: updatedSession,
            },
          };
        });
      },
      
      updateChatMessage: (messageId, updates) =>
        set((state) => {
          const currentSession = state.chat.currentSession;
          if (!currentSession) return state;
          
          const updatedSession = {
            ...currentSession,
            messages: currentSession.messages.map(msg =>
              msg.id === messageId ? { ...msg, ...updates } : msg
            ),
            updatedAt: new Date().toISOString(),
          };
          
          return {
            user: {
              ...state.user,
              chatSessions: state.user.chatSessions.map(s =>
                s.id === currentSession.id ? updatedSession : s
              ),
            },
            chat: {
              ...state.chat,
              currentSession: updatedSession,
            },
          };
        }),
      
      setChatTyping: (isTyping) =>
        set((state) => ({
          chat: { ...state.chat, isTyping },
        })),
      
      setChatConnected: (isConnected) =>
        set((state) => ({
          chat: { ...state.chat, isConnected },
        })),
      
      // UI Actions
      setCurrentPage: (currentPage) =>
        set((state) => ({
          ui: { ...state.ui, currentPage },
        })),
      
      setDrawerOpen: (isDrawerOpen) =>
        set((state) => ({
          ui: { ...state.ui, isDrawerOpen },
        })),
      
      setActiveModal: (activeModal) =>
        set((state) => ({
          ui: { ...state.ui, activeModal },
        })),
      
      setTheme: (theme) =>
        set((state) => ({
          ui: { ...state.ui, theme },
        })),
      
      // Consultation Actions
      setConsultationTitle: (consultationTitle) =>
        set((state) => ({
          ui: { ...state.ui, consultationTitle },
        })),
      
      setPendingConsultationMessage: (pendingConsultationMessage) =>
        set({ pendingConsultationMessage }),
      
      clearPendingConsultationMessage: () =>
        set({ pendingConsultationMessage: null }),
      
      // Daily Meal Data Actions
      addMealFood: (mealType, food) =>
        set((state) => {
          const updatedDailyMeal = {
            ...state.dailyMeal,
            [mealType]: [...state.dailyMeal[mealType], food],
            updatedAt: new Date().toISOString(),
          };
          
          // 現在のお子さまのchildrenMealDataも同期更新
          const currentChildId = state.user.preferences.activeChildId;
          const updatedChildrenMealData = currentChildId
            ? { ...state.childrenMealData, [currentChildId]: updatedDailyMeal }
            : state.childrenMealData;
          
          return {
            dailyMeal: updatedDailyMeal,
            childrenMealData: updatedChildrenMealData,
          };
        }),
      
      updateMealFood: (mealType, index, food) =>
        set((state) => {
          const newMealData = [...state.dailyMeal[mealType]];
          newMealData[index] = food;
          const updatedDailyMeal = {
            ...state.dailyMeal,
            [mealType]: newMealData,
            updatedAt: new Date().toISOString(),
          };
          
          // 現在のお子さまのchildrenMealDataも同期更新
          const currentChildId = state.user.preferences.activeChildId;
          const updatedChildrenMealData = currentChildId
            ? { ...state.childrenMealData, [currentChildId]: updatedDailyMeal }
            : state.childrenMealData;
          
          return {
            dailyMeal: updatedDailyMeal,
            childrenMealData: updatedChildrenMealData,
          };
        }),
      
      deleteMealFood: (mealType, index) =>
        set((state) => {
          const updatedDailyMeal = {
            ...state.dailyMeal,
            [mealType]: state.dailyMeal[mealType].filter((_, i) => i !== index),
            updatedAt: new Date().toISOString(),
          };
          
          // 現在のお子さまのchildrenMealDataも同期更新
          const currentChildId = state.user.preferences.activeChildId;
          const updatedChildrenMealData = currentChildId
            ? { ...state.childrenMealData, [currentChildId]: updatedDailyMeal }
            : state.childrenMealData;
          
          return {
            dailyMeal: updatedDailyMeal,
            childrenMealData: updatedChildrenMealData,
          };
        }),
      
      updateSpecialNotes: (specialNotes) =>
        set((state) => {
          const updatedDailyMeal = {
            ...state.dailyMeal,
            specialNotes,
            updatedAt: new Date().toISOString(),
          };
          
          // 現在のお子さまのchildrenMealDataも同期更新
          const currentChildId = state.user.preferences.activeChildId;
          const updatedChildrenMealData = currentChildId
            ? { ...state.childrenMealData, [currentChildId]: updatedDailyMeal }
            : state.childrenMealData;
          
          return {
            dailyMeal: updatedDailyMeal,
            childrenMealData: updatedChildrenMealData,
          };
        }),
      
      clearDailyMealData: () =>
        set((state) => ({
          dailyMeal: createDefaultDailyMealData(
            state.user.preferences.activeChildId || ''
          ),
        })),
      
      // Utility Actions
      resetStore: () => set(defaultStoreState),
    }),
    {
      name: 'kids-food-advisor-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        ui: {
          theme: state.ui.theme,
        },
        dailyMeal: state.dailyMeal,
        childrenMealData: state.childrenMealData,
      }),
      onRehydrateStorage: () => (state) => {
        // ハイドレーション後の状態を正常化
        if (state && state.user?.preferences?.children?.length === 0) {
          state.user.preferences.activeChildId = null;
        }
      },
    }
  )
);

// Selectors using direct state access and useMemo for caching
export const useUserPreferences = () => {
  const preferences = useAppStore((state) => state.user?.preferences);
  return useMemo(() => preferences || defaultUserPreferences, [preferences]);
};

export const useChildren = () => {
  const children = useAppStore((state) => state.user?.preferences?.children);
  return useMemo(() => children || [], [children]);
};

export const useActiveChild = () => {
  const children = useAppStore((state) => state.user?.preferences?.children);
  const activeChildId = useAppStore((state) => state.user?.preferences?.activeChildId);
  return useMemo(() => {
    if (!children || !activeChildId) return null;
    return children.find(child => child.id === activeChildId) || null;
  }, [children, activeChildId]);
};

export const useActiveChildId = () => useAppStore((state) => state.user?.preferences?.activeChildId || null);

export const useChildAllergies = (childId: string) => {
  const allergies = useAppStore((state) => state.user?.preferences?.allergies);
  return useMemo(() => {
    if (!allergies || !childId) return [];
    return allergies.filter(a => a.childId === childId);
  }, [allergies, childId]);
};

export const useMealHistory = () => {
  const mealHistory = useAppStore((state) => state.user?.mealHistory);
  const activeChildId = useAppStore((state) => state.user?.preferences?.activeChildId);
  return useMemo(() => {
    if (!mealHistory || !activeChildId) return [];
    return mealHistory.filter(m => m.childId === activeChildId);
  }, [mealHistory, activeChildId]);
};

export const useChatSessions = () => {
  const chatSessions = useAppStore((state) => state.user?.chatSessions);
  const activeChildId = useAppStore((state) => state.user?.preferences?.activeChildId);
  return useMemo(() => {
    if (!chatSessions || !activeChildId) return [];
    return chatSessions.filter(s => s.childId === activeChildId);
  }, [chatSessions, activeChildId]);
};

export const useCurrentChatSession = () => useAppStore((state) => state.chat?.currentSession || null);

export const useIsLoading = () => useAppStore((state) => state.isLoading);
export const useError = () => useAppStore((state) => state.error);
export const useTheme = () => useAppStore((state) => state.ui?.theme || 'light');

// Auth Selectors
export const useAuthUser = () => useAppStore((state) => state.auth?.user || null);
export const useAuthLoading = () => useAppStore((state) => state.auth?.isLoading || false);
export const useIsAuthenticated = () => useAppStore((state) => !!state.auth?.user);

// Daily Meal Data Selectors
export const useDailyMealData = () => {
  const dailyMeal = useAppStore((state) => state.dailyMeal);
  return useMemo(() => dailyMeal || createDefaultDailyMealData(''), [dailyMeal]);
};

export const useBreakfastFoods = () => {
  const breakfast = useAppStore((state) => state.dailyMeal?.breakfast);
  return useMemo(() => breakfast || [], [breakfast]);
};

export const useLunchFoods = () => {
  const lunch = useAppStore((state) => state.dailyMeal?.lunch);
  return useMemo(() => lunch || [], [lunch]);
};

export const useDinnerFoods = () => {
  const dinner = useAppStore((state) => state.dailyMeal?.dinner);
  return useMemo(() => dinner || [], [dinner]);
};

export const useSpecialNotes = () => useAppStore((state) => state.dailyMeal?.specialNotes || '');

// Daily Meal Data Actions
export const useDailyMealActions = () => ({
  addMealFood: useAppStore((state) => state.addMealFood),
  updateMealFood: useAppStore((state) => state.updateMealFood),
  deleteMealFood: useAppStore((state) => state.deleteMealFood),
  updateSpecialNotes: useAppStore((state) => state.updateSpecialNotes),
  clearDailyMealData: useAppStore((state) => state.clearDailyMealData),
});

// Child Management Actions
export const useChildActions = () => ({
  addChild: useAppStore((state) => state.addChild),
  updateChild: useAppStore((state) => state.updateChild),
  deleteChild: useAppStore((state) => state.deleteChild),
  setActiveChild: useAppStore((state) => state.setActiveChild),
});

// Allergy Actions
export const useAllergyActions = () => ({
  addAllergy: useAppStore((state) => state.addAllergy),
  removeAllergy: useAppStore((state) => state.removeAllergy),
});

// Auth Actions
export const useAuthActions = () => ({
  setAuthUser: useAppStore((state) => state.setAuthUser),
  setAuthLoading: useAppStore((state) => state.setAuthLoading),
});

// Consultation Actions
export const useConsultationActions = () => ({
  setPendingConsultationMessage: useAppStore((state) => state.setPendingConsultationMessage),
  clearPendingConsultationMessage: useAppStore((state) => state.clearPendingConsultationMessage),
});

export const usePendingConsultationMessage = () => useAppStore((state) => state.pendingConsultationMessage);