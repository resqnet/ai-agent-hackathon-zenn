"use client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/layout/PageContainer";
import { BottomNavigation } from "@/components/layout/BottomNavigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { ChildSettingsForm } from "@/components/forms/child-settings-form";
import { useScreenNavigation } from "@/hooks/useScreenNavigation";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const { navigateToHome } = useScreenNavigation();
  const router = useRouter();
  
  const handleChildSave = () => {
    // 子ども情報を保存したらトップページへ遷移
    setTimeout(() => {
      router.push('/');
    }, 1000);
  };

  return (
    <AuthGuard>
      <AppLayout>
      <Header title="設定" />
      <PageContainer>
        <ChildSettingsForm onSave={handleChildSave} />
      </PageContainer>
      <BottomNavigation />
      </AppLayout>
    </AuthGuard>
  );
}