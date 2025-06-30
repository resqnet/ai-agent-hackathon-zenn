"use client";
import { MessageCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/layout/PageContainer";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Button } from "@/components/ui/button";
import { usePostApiSessions, useGetApiSessions } from "@/generated/api";
import { ConversationListItem } from "@/components/chat/ConversationListItem";
import { useMemo } from "react";
import { BottomNavigation } from "@/components/layout/BottomNavigation";

export default function ChatPage() {
  const router = useRouter();
  const createSession = usePostApiSessions();
  const { data: sessionsData, isLoading, error, refetch } = useGetApiSessions(undefined, {
    query: {
      refetchOnWindowFocus: true, // ウィンドウフォーカス時にstaleしていたら自動更新
      refetchOnMount: 'always',       // マウント時に常に自動更新
    }
  });

  // セッションを更新日時順でソート
  const sortedSessions = useMemo(() => {
    if (!sessionsData?.success || !sessionsData.sessions) {
      return [];
    }
    
    return [...sessionsData.sessions].sort((a, b) => {
      const aUpdateTime = new Date(a.updateTime || a.createTime || 0);
      const bUpdateTime = new Date(b.updateTime || b.createTime || 0);
      return bUpdateTime.getTime() - aUpdateTime.getTime();
    });
  }, [sessionsData]);

  const handleCreateNewChat = async () => {
    try {
      let response = await createSession.mutateAsync();
      if (typeof response === 'string') {
        // レスポンスが文字列の場合はJSON.parseしてオブジェクトに変換
        response = JSON.parse(response);
      }
      if (response.success && response.sessionId) {
        // セッション作成成功時はチャットページへリダイレクト
        router.push(`/chat/${response.sessionId}`);
      } else {
        // エラーメッセージを表示
        console.error("セッション作成に失敗:", response.error);
        alert(`セッション作成に失敗しました: ${response.error}`);
      }
    } catch (error) {
      console.error("セッション作成中にエラー:", error);
      alert("セッション作成中にエラーが発生しました。");
    }
  };

  return (
    <AuthGuard>
      <AppLayout>
        <Header 
          title="会話"
        />
        <PageContainer className="pb-20 px-0">
          {/* セッション一覧 */}
          <div className="flex flex-col h-full">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                  <p>読み込み中...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground py-12">
                  <p className="mb-4">会話の読み込みに失敗しました</p>
                  <Button variant="outline" onClick={() => refetch()}>
                    再試行
                  </Button>
                </div>
              </div>
            ) : sortedSessions.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground py-12">
                  <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="mb-2">まだ会話がありません</p>
                  <p className="text-sm mb-4">
                    新しい相談を始めてみましょう
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleCreateNewChat}
                    disabled={createSession.isPending}
                  >
                    {createSession.isPending ? "作成中..." : "新しい相談を始める"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {sortedSessions.map((session) => (
                  <ConversationListItem
                    key={session.name}
                    sessionId={session.name?.split('/').pop() || ''}
                    displayName={session.displayName}
                    createTime={session.createTime || ''}
                    updateTime={session.updateTime || session.createTime || ''}
                  />
                ))}
              </div>
            )}
          </div>

          {/* フローティング新規作成ボタン */}
          <Button
            size="icon"
            className="fixed bottom-18 right-4 w-14 h-14 rounded-full shadow-lg z-40"
            onClick={handleCreateNewChat}
            disabled={createSession.isPending}
          >
            <Plus className="w-6 h-6" />
          </Button>
        </PageContainer>
        <BottomNavigation />
      </AppLayout>
    </AuthGuard>
  );
}
