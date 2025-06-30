"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Bot } from "lucide-react";
import { useChatStream } from "@/hooks/use-api";
import { sanitizeInput } from "@/utils/security";
import { validateInput, chatMessageRules } from "@/utils/validation";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { MessageCard } from "@/components/chat/MessageCard";
import { useDeleteApiSessionsSessionId, useGetApiSessionsSessionIdEvents } from "@/generated/api";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { PageContainer } from "@/components/layout/PageContainer";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { usePendingConsultationMessage, useConsultationActions } from "@/stores/app-store";

interface AgentMessage {
  id: string;
  agentName: string;
  content: string;
  isComplete: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  agentMessages?: AgentMessage[];
}

interface ChatInterfaceProps {
  sessionId: string;
  remoteMessages: ChatMessage[];
  initialMessage?: string;
  onMessageSent?: (message: string) => void;
  placeholder?: string;
  className?: string;
}

export default function ChatSessionPage() {
  const router = useRouter();
  const params = useParams<{ sessionId: string }>();
  const sessionId = params.sessionId;

  // Zustandストアから初期メッセージを取得
  const pendingMessage = usePendingConsultationMessage();
  const { clearPendingConsultationMessage } = useConsultationActions();

  // セッション削除処理
  const deleteSessionMutation = useDeleteApiSessionsSessionId();
  const handleDeleteSession = useCallback(async () => {
    try {
      await deleteSessionMutation.mutateAsync({ sessionId });
      // 削除成功後、チャット一覧に戻る
      router.push('/chat');
    } catch (error) {
      console.error('セッション削除エラー:', error);
      alert('セッションの削除に失敗しました。もう一度お試しください。');
    }
  }, [deleteSessionMutation, sessionId, router]);

  return (
    <AuthGuard>
      <AppLayout>
        <Header
          title="栄養アドバイザー"
          onBack={() => router.push("/")}
          fixed={true}
          showMenu={true}
          onDelete={handleDeleteSession}
          deleteLabel="会話を削除"
          deleteDescription="この会話を削除しますか？すべてのメッセージが完全に削除され、この操作は取り消せません。"
        />
        <PageContainer className="pt-20 px-0">
          <PageContent 
            sessionId={sessionId} 
            initialMessage={pendingMessage ?? undefined} 
            onMessageSent={() => clearPendingConsultationMessage()}
          />
        </PageContainer>
      </AppLayout>
    </AuthGuard>
  );
}

function PageContent({ 
  sessionId, 
  initialMessage, 
  onMessageSent 
}: { 
  sessionId: string;
  initialMessage?: string;
  onMessageSent?: () => void;
}) {
  const { data: remoteEventsData } = useGetApiSessionsSessionIdEvents(sessionId);

  return (
    <>
      {!remoteEventsData ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          読み込み中...
        </div>
      ) : !remoteEventsData.success ? (
        <div className="text-destructive text-center">
          エラー: {remoteEventsData.error}
        </div>
      ) : (
        <ChatInterface
          remoteMessages={remoteEventsData.events!.map((event) => ({
            id: `remote_${event.name}`,
            role: (event.author as "user" | "assistant") || "assistant",
            content:
              event.content?.parts?.map((part) => part.text || "").join("") ||
              "",
            timestamp: new Date(event.timestamp!),
            isStreaming: false,
          }))}
          sessionId={sessionId}
          initialMessage={initialMessage}
          onMessageSent={onMessageSent}
        />
      )}
    </>
  );
}

// プレースホルダーのリスト
const PLACEHOLDER_MESSAGES = [
  "ビタミンDを摂るのに良い食材は？",
  "野菜嫌いを克服する方法は？",
  "カルシウムが豊富な幼児向けレシピを知りたい",
  "鉄分不足を解消する食材を教えて",
  "アレルギーがある子の食事について相談したい",
  "幼児の便秘に良い食事を知りたい",
  "タンパク質を上手に摂る方法は？",
];

function ChatInterface({
  sessionId,
  initialMessage,
  onMessageSent,
  placeholder,
  className = "",
}: ChatInterfaceProps) {
  // ランダムなプレースホルダーを選択（初回レンダリング時のみ）
  const randomPlaceholder = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * PLACEHOLDER_MESSAGES.length);
    return PLACEHOLDER_MESSAGES[randomIndex];
  }, []);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatStreamMutation = useChatStream();
  const isMountedRef = useRef(true);

  const { data: remoteEventsData } = useGetApiSessionsSessionIdEvents(sessionId);

  const remoteMessages: ChatMessage[] | undefined =
    remoteEventsData?.events?.map((event) => ({
      id: `remote_${event.name}`,
      role: (event.author as "user" | "assistant") || "assistant",
      content:
        event.content?.parts?.map((part) => part.text || "").join("") || "",
      timestamp: new Date(event.timestamp!),
      isStreaming: false,
    }));

  const [messages, setMessages] = useState<ChatMessage[]>(remoteMessages ?? []);

  // onMessageSentコールバックの安定化
  const stableOnMessageSent = useCallback(
    (message: string) => {
      onMessageSent?.(message);
    },
    [onMessageSent]
  );

  // アンマウント時の処理
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // メッセージリストの最下部にスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 初期メッセージがある場合は送信
  const [hasInitialMessageSent, setHasInitialMessageSent] = useState(false);
  const [isInitialMessageSending, setIsInitialMessageSending] = useState(false);
  const initialMessageProcessedRef = useRef(false);

  useEffect(() => {
    const sendInitialMessage = async (messageText: string) => {
      // 重複実行を防ぐための厳密なチェック
      if (
        !messageText.trim() ||
        isStreaming ||
        hasInitialMessageSent ||
        isInitialMessageSending ||
        chatStreamMutation.isPending ||
        !isMountedRef.current ||
        initialMessageProcessedRef.current
      ) {
        console.log("初期メッセージ送信スキップ:", {
          messageText: messageText.trim(),
          isStreaming,
          hasInitialMessageSent,
          isInitialMessageSending,
          isPending: chatStreamMutation.isPending,
          isMounted: isMountedRef.current,
          processed: initialMessageProcessedRef.current,
        });
        return;
      }

      console.log("初期メッセージ送信開始:", messageText);

      // 処理開始をマーク
      initialMessageProcessedRef.current = true;
      setIsInitialMessageSending(true);

      // メッセージのバリデーション
      const validation = validateInput(messageText, chatMessageRules);
      if (!validation.isValid) {
        console.error(
          "初期メッセージのバリデーションエラー:",
          validation.errors
        );
        return;
      }

      // メッセージのサニタイズ
      const sanitizedMessage = sanitizeInput(validation.sanitizedValue);

      // 送信開始フラグを即座に設定（React.StrictMode対策）
      initialMessageProcessedRef.current = true;
      setIsInitialMessageSending(true);
      setHasInitialMessageSent(true);

      // ユーザーメッセージを追加
      addMessage({
        role: "user",
        content: sanitizedMessage,
      });

      // アシスタントメッセージの準備
      const assistantMessage = addMessage({
        role: "assistant",
        content: "",
        isStreaming: true,
      });

      setIsStreaming(true);
      stableOnMessageSent(messageText);

      try {
        console.log("React Query mutateAsync開始");
        // ストリーミングでレスポンスを取得（内部でトークンストリーミング使用）
        const stream = await chatStreamMutation.mutateAsync({
          message: sanitizedMessage,
          sessionId,
        });

        console.log("ストリーミング取得成功:", stream);

        // マウント状態チェック（一時的にスキップ）
        console.log("マウント状態確認:", isMountedRef.current);
        // if (!isMountedRef.current) {
        //   console.log('コンポーネントがアンマウントされています');
        //   return;
        // }

        const reader = stream.getReader();
        let currentAgentMessages: AgentMessage[] = [];
        let currentAgentId: string | null = null;

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("ストリーム終了");
            break;
          }

          console.log("受信イベント:", value);
          console.log("エージェント名:", value.agent_name);

          // ストリームイベントを処理
          switch (value.type) {
            case "agent_start":
              if (value.agent_name) {
                // 前のエージェントが存在し、新しいエージェントが異なる場合
                const previousAgent = currentAgentMessages.find(
                  (msg) => msg.id === currentAgentId
                );
                if (
                  previousAgent &&
                  previousAgent.agentName !== value.agent_name
                ) {
                  // 前のエージェントを完了状態に設定
                  const updatedMessages = currentAgentMessages.map((msg) =>
                    msg.id === currentAgentId
                      ? { ...msg, isComplete: true }
                      : msg
                  );
                  currentAgentMessages = updatedMessages;
                }

                currentAgentId = `agent_${Date.now()}_${Math.random()}`;
                currentAgentMessages.push({
                  id: currentAgentId,
                  agentName: value.agent_name,
                  content: "",
                  isComplete: false,
                });
                updateMessage(assistantMessage.id, {
                  agentMessages: [...currentAgentMessages],
                  isStreaming: true,
                });
              }
              break;

            case "chunk":
              if (currentAgentId && value.content) {
                const updatedMessages = currentAgentMessages.map((msg) =>
                  msg.id === currentAgentId
                    ? { ...msg, content: msg.content + value.content }
                    : msg
                );
                currentAgentMessages = updatedMessages;
                updateMessage(assistantMessage.id, {
                  agentMessages: [...currentAgentMessages],
                  isStreaming: true,
                });
              }
              break;

            case "token":
              // トークンストリーミング用の処理
              if (currentAgentId && value.content) {
                const updatedMessages = currentAgentMessages.map((msg) =>
                  msg.id === currentAgentId
                    ? { ...msg, content: msg.content + value.content }
                    : msg
                );
                currentAgentMessages = updatedMessages;
                updateMessage(assistantMessage.id, {
                  agentMessages: [...currentAgentMessages],
                  isStreaming: true,
                });
              }
              break;

            case "agent_complete":
              if (currentAgentId) {
                const updatedMessages = currentAgentMessages.map((msg) =>
                  msg.id === currentAgentId ? { ...msg, isComplete: true } : msg
                );
                currentAgentMessages = updatedMessages;
                updateMessage(assistantMessage.id, {
                  agentMessages: [...currentAgentMessages],
                  isStreaming: true,
                });
                currentAgentId = null;
              }
              break;

            case "stream_end":
              // 全エージェントメッセージを確実に完了状態に設定
              const initialCompletedAgentMessages = currentAgentMessages.map(
                (msg) => ({
                  ...msg,
                  isComplete: true,
                })
              );

              // 全体の応答テキストを構成
              const fullContent = initialCompletedAgentMessages
                .map((msg) => `**${msg.agentName}**\n\n${msg.content}`)
                .join("\n\n---\n\n");

              updateMessage(assistantMessage.id, {
                content: fullContent,
                agentMessages: initialCompletedAgentMessages,
                isStreaming: false,
              });
              break;

            case "error":
              // エラー時も全エージェントメッセージを完了状態に設定
              const initialErrorCompletedMessages = currentAgentMessages.map(
                (msg) => ({
                  ...msg,
                  isComplete: true,
                })
              );

              updateMessage(assistantMessage.id, {
                content: value.content || "エラーが発生しました",
                agentMessages: initialErrorCompletedMessages,
                isStreaming: false,
              });
              break;
          }
        }
      } catch (error) {
        console.error("チャットエラー詳細:", error);
        if (error instanceof Error) {
          console.error("エラーメッセージ:", error.message);
          console.error("エラースタック:", error.stack);
        }
        updateMessage(assistantMessage.id, {
          content: `エラーが発生しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
          agentMessages: [],
          isStreaming: false,
        });
      } finally {
        setIsStreaming(false);
        setIsInitialMessageSending(false);
        setHasInitialMessageSent(true);
      }
    };

    // 初期メッセージが存在し、まだ送信されていない場合のみ実行
    if (
      initialMessage &&
      initialMessage.trim() &&
      !hasInitialMessageSent &&
      !isInitialMessageSending &&
      !initialMessageProcessedRef.current
    ) {
      console.log(
        "初期メッセージ送信条件満たした:",
        initialMessage.substring(0, 100) + "..."
      );
      sendInitialMessage(initialMessage);
    }
  }, [
    initialMessage,
    hasInitialMessageSent,
    isInitialMessageSending,
    isStreaming,
    sessionId,
    chatStreamMutation.isPending,
  ]);

  const addMessage = (message: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  };

  const updateMessage = (id: string, updates: Partial<ChatMessage>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  };

  const handleSendMessage = async (messageText: string = currentMessage) => {
    if (!messageText.trim() || isStreaming) return;

    // メッセージのバリデーション
    const validation = validateInput(messageText, chatMessageRules);
    if (!validation.isValid) {
      alert(`入力エラー:\n${validation.errors.join("\n")}`);
      return;
    }

    // メッセージのサニタイズ
    const sanitizedMessage = sanitizeInput(validation.sanitizedValue);

    // ユーザーメッセージを追加
    addMessage({
      role: "user",
      content: sanitizedMessage,
    });

    // アシスタントメッセージの準備
    const assistantMessage = addMessage({
      role: "assistant",
      content: "",
      isStreaming: true,
    });

    setCurrentMessage("");
    setIsStreaming(true);
    stableOnMessageSent(messageText);

    try {
      // ストリーミングでレスポンスを取得（内部でトークンストリーミング使用）
      const stream = await chatStreamMutation.mutateAsync({
        message: sanitizedMessage,
        sessionId,
      });

      const reader = stream.getReader();
      let currentAgentMessages: AgentMessage[] = [];
      let currentAgentId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // ストリームイベントを処理
        switch (value.type) {
          case "agent_start":
            if (value.agent_name) {
              // 前のエージェントが存在し、新しいエージェントが異なる場合
              const previousAgent = currentAgentMessages.find(
                (msg) => msg.id === currentAgentId
              );
              if (
                previousAgent &&
                previousAgent.agentName !== value.agent_name
              ) {
                // 前のエージェントを完了状態に設定
                const updatedMessages = currentAgentMessages.map((msg) =>
                  msg.id === currentAgentId ? { ...msg, isComplete: true } : msg
                );
                currentAgentMessages = updatedMessages;
              }

              currentAgentId = `agent_${Date.now()}_${Math.random()}`;
              currentAgentMessages.push({
                id: currentAgentId,
                agentName: value.agent_name,
                content: "",
                isComplete: false,
              });
              updateMessage(assistantMessage.id, {
                agentMessages: [...currentAgentMessages],
                isStreaming: true,
              });
            }
            break;

          case "chunk":
            if (currentAgentId && value.content) {
              const updatedMessages = currentAgentMessages.map((msg) =>
                msg.id === currentAgentId
                  ? { ...msg, content: msg.content + value.content }
                  : msg
              );
              currentAgentMessages = updatedMessages;
              updateMessage(assistantMessage.id, {
                agentMessages: [...currentAgentMessages],
                isStreaming: true,
              });
            }
            break;

          case "token":
            // トークンストリーミング用の処理
            if (currentAgentId && value.content) {
              const updatedMessages = currentAgentMessages.map((msg) =>
                msg.id === currentAgentId
                  ? { ...msg, content: msg.content + value.content }
                  : msg
              );
              currentAgentMessages = updatedMessages;
              updateMessage(assistantMessage.id, {
                agentMessages: [...currentAgentMessages],
                isStreaming: true,
              });
            }
            break;

          case "agent_complete":
            if (currentAgentId) {
              const updatedMessages = currentAgentMessages.map((msg) =>
                msg.id === currentAgentId ? { ...msg, isComplete: true } : msg
              );
              currentAgentMessages = updatedMessages;
              updateMessage(assistantMessage.id, {
                agentMessages: [...currentAgentMessages],
                isStreaming: true,
              });
              currentAgentId = null;
            }
            break;

          case "stream_end":
            // 全エージェントメッセージを確実に完了状態に設定
            const completedAgentMessages = currentAgentMessages.map((msg) => ({
              ...msg,
              isComplete: true,
            }));

            // 全体の応答テキストを構成
            const fullContent = completedAgentMessages
              .map((msg) => `**${msg.agentName}**\n\n${msg.content}`)
              .join("\n\n---\n\n");

            updateMessage(assistantMessage.id, {
              content: fullContent,
              agentMessages: completedAgentMessages,
              isStreaming: false,
            });
            break;

          case "error":
            // エラー時も全エージェントメッセージを完了状態に設定
            const errorCompletedMessages = currentAgentMessages.map((msg) => ({
              ...msg,
              isComplete: true,
            }));

            updateMessage(assistantMessage.id, {
              content: value.content || "エラーが発生しました",
              agentMessages: errorCompletedMessages,
              isStreaming: false,
            });
            break;
        }
      }
    } catch (error) {
      console.error("チャットエラー:", error);
      updateMessage(assistantMessage.id, {
        content: "エラーが発生しました。もう一度お試しください。",
        agentMessages: [],
        isStreaming: false,
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSessionDeleted = () => {
    console.log("セッションが削除されました:", sessionId);
    // セッション削除後の処理（必要に応じて追加）
    // 例: ページリロード、新しいセッションの開始など
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* メッセージエリア - 固定入力エリア分の下余白を確保 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-36">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="mb-2">お気軽にご質問やご相談をどうぞ！</p>
            <p className="text-sm">
              栄養や食事に関することなら何でもお答えします。
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) =>
              message.role === "user" ? (
                <ChatBubble
                  key={message.id}
                  content={message.content}
                  timestamp={message.timestamp}
                />
              ) : (
                <MessageCard
                  key={message.id}
                  content={message.content}
                  timestamp={message.timestamp}
                  isStreaming={message.isStreaming}
                  agentMessages={message.agentMessages}
                />
              )
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 入力エリア - 固定位置で画面下部に常に表示 */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 pb-safe z-40">
        <div className="flex gap-3 max-w-md mx-auto">
          <textarea
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder || randomPlaceholder}
            disabled={isStreaming}
            rows={3}
            className="flex-1 px-4 py-3 border border-border rounded-2xl focus:ring-2 focus:ring-ring focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed text-sm text-foreground placeholder-muted-foreground"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!currentMessage.trim() || isStreaming}
            className="px-6 py-3 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 self-end"
          >
            {isStreaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isStreaming ? "送信中..." : "送信"}
          </Button>
        </div>
      </div>
    </div>
  );
}
