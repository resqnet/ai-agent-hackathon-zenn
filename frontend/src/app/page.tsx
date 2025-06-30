"use client";
import dynamic from 'next/dynamic';

// 重要：コンポーネントを動的インポートしてSSRを無効化
const DynamicHomePage = dynamic(() => import('./home-client'), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  )
});

export default function HomePage() {
  return <DynamicHomePage />;
}