// 画面遷移管理のカスタムフック

import { useState } from 'react';
import { Screen } from '@/types/meal';

export const useScreenNavigation = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");

  const navigateToScreen = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const navigateToHome = () => {
    setCurrentScreen("home");
  };

  const navigateToChat = () => {
    setCurrentScreen("chat");
  };

  const navigateToSettings = () => {
    setCurrentScreen("settings");
  };


  const navigateToDinnerConsultation = () => {
    setCurrentScreen("dinner-consultation");
  };

  const navigateToImageAnalyzing = () => {
    setCurrentScreen("image-analyzing");
  };

  const navigateToImageResult = () => {
    setCurrentScreen("image-result");
  };

  const navigateToImageRecognition = () => {
    setCurrentScreen("image-recognition");
  };

  return {
    currentScreen,
    navigateToScreen,
    navigateToHome,
    navigateToChat,
    navigateToSettings,
    navigateToDinnerConsultation,
    navigateToImageAnalyzing,
    navigateToImageResult,
    navigateToImageRecognition,
  };
};