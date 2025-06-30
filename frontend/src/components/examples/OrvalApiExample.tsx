/**
 * Orval生成APIの使用例コンポーネント
 * 新規機能開発時の参考実装
 */

import React, { useState } from 'react';
// 一時的にOrval APIフックをコメントアウト
// import { 
//   useKidsFoodChat, 
//   useKidsFoodImageAnalysis, 
//   useKidsUserSettings,
//   useHealthCheck 
// } from '@/hooks/useOrvalApi';

export const OrvalApiExample: React.FC = () => {
  const [message, setMessage] = useState('');
  const [, setImageFile] = useState<File | null>(null);

  // 一時的にダミー実装
  const healthCheck = { isLoading: false, error: null, data: { success: true } };
  const chat = { 
    sendMessage: () => {}, 
    isLoading: false, 
    error: null, 
    data: { success: true, data: "ダミー応答" }, 
    reset: () => {} 
  };
  const imageAnalysis = { 
    analyzeImage: () => {}, 
    isLoading: false, 
    error: null, 
    data: { success: true, data: { foods: ["サンプル食品"] } }, 
    reset: () => {} 
  };
  const userSettings = { 
    preferences: { child_age_months: 24, allergies: [], dietary_restrictions: [] }, 
    updatePreferences: () => {}, 
    isLoading: false, 
    error: null, 
    refetch: () => {} 
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      chat.sendMessage(message);
      setMessage('');
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      imageAnalysis.analyzeImage(file);
    }
  };

  const handleUpdateAge = () => {
    userSettings.updatePreferences({
      child_age_months: 30, // 2歳6ヶ月に更新
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h1 className="text-2xl font-bold text-blue-900 mb-2">
          🚀 Orval API統合デモ
        </h1>
        <p className="text-blue-700">
          Java不要・React Query完全統合・型安全なAPI開発
        </p>
      </div>

      {/* ヘルスチェック */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">📊 システムヘルスチェック</h2>
        <div className="flex items-center space-x-4">
          <div className={`w-3 h-3 rounded-full ${
            healthCheck.isLoading ? 'bg-yellow-500' :
            healthCheck.error ? 'bg-red-500' : 'bg-green-500'
          }`} />
          <span className="font-medium">
            {healthCheck.isLoading ? '確認中...' :
             healthCheck.error ? 'エラー' : '正常'}
          </span>
          {healthCheck.data?.success && (
            <span className="text-sm text-gray-600">
              最終確認: {new Date().toLocaleTimeString()}
            </span>
          )}
        </div>
      </section>

      {/* チャット機能 */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">💬 AIチャット（Orval統合）</h2>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="栄養相談やレシピリクエストを入力..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              disabled={chat.isLoading || !message.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {chat.isLoading ? '送信中...' : '送信'}
            </button>
          </div>
          
          {chat.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              エラー: {String(chat.error)}
            </div>
          )}
          
          {chat.data?.success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <strong className="text-green-800">AI応答:</strong>
              <p className="mt-2 text-gray-700">{JSON.stringify(chat.data.data)}</p>
            </div>
          )}
        </div>
      </section>

      {/* 画像解析 */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">📸 食事画像解析（Orval統合）</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              食事画像をアップロード
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          
          {imageAnalysis.isLoading && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
              画像を解析中...
            </div>
          )}
          
          {imageAnalysis.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              解析エラー: {String(imageAnalysis.error)}
            </div>
          )}
          
          {imageAnalysis.data?.success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <strong className="text-green-800">解析結果:</strong>
              <pre className="mt-2 text-sm text-gray-700 overflow-auto">
                {JSON.stringify(imageAnalysis.data.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </section>

      {/* ユーザー設定 */}
      <section className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">⚙️ ユーザー設定（Orval統合）</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong className="text-gray-700">現在の設定:</strong>
              {userSettings.isLoading ? (
                <p className="text-gray-500">読み込み中...</p>
              ) : userSettings.preferences ? (
                <div className="mt-2 text-sm">
                  <p>年齢: {userSettings.preferences.child_age_months}ヶ月</p>
                  <p>アレルギー: {userSettings.preferences.allergies?.join(', ') || 'なし'}</p>
                  <p>食事制限: {userSettings.preferences.dietary_restrictions?.join(', ') || 'なし'}</p>
                </div>
              ) : (
                <p className="text-gray-500">設定未取得</p>
              )}
            </div>
            
            <div>
              <button
                onClick={handleUpdateAge}
                disabled={userSettings.isLoading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                年齢を30ヶ月に更新
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 技術情報 */}
      <section className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">🔧 技術仕様</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h3 className="font-semibold mb-2">✅ Orvalの利点</h3>
            <ul className="space-y-1 text-gray-600">
              <li>• Java不要（純粋Node.js）</li>
              <li>• React Query完全統合</li>
              <li>• TypeScript型安全性</li>
              <li>• 自動キャッシュ・リフレッシュ</li>
              <li>• カスタムフック自動生成</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">🎯 使用フック</h3>
            <ul className="space-y-1 text-gray-600">
              <li>• useHealthCheck()</li>
              <li>• useKidsFoodChat()</li>
              <li>• useKidsFoodImageAnalysis()</li>
              <li>• useKidsUserSettings()</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
};