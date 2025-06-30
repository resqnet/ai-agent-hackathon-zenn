// 相談関連の定数定義

// 相談ボタンテキスト
export const CONSULTATION_BUTTON_TEXTS = {
  breakfast: "🌅 朝食を相談する",
  lunch: "☀️ 昼食を相談する", 
  dinner: "🌙 夕食を相談する",
  general: "💬 AIと相談"
} as const;

// 相談ページタイトル
export const CONSULTATION_PAGE_TITLES = {
  breakfast: "朝食相談",
  lunch: "昼食相談", 
  dinner: "夕食相談"
} as const;

// 汎用相談タイトル
export const GENERAL_CONSULTATION_TITLE = "栄養相談" as const;

// ボタンテキストからページタイトルに変換する関数
export const convertButtonTextToPageTitle = (buttonText: string): string => {
  switch (buttonText) {
    case CONSULTATION_BUTTON_TEXTS.breakfast:
      return CONSULTATION_PAGE_TITLES.breakfast;
    case CONSULTATION_BUTTON_TEXTS.lunch:
      return CONSULTATION_PAGE_TITLES.lunch;
    case CONSULTATION_BUTTON_TEXTS.dinner:
      return CONSULTATION_PAGE_TITLES.dinner;
    case CONSULTATION_BUTTON_TEXTS.general:
      return GENERAL_CONSULTATION_TITLE;
    default:
      return "栄養相談";
  }
};