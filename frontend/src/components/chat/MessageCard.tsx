'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Markdown } from '@/components/ui/markdown';
import { safeText } from '@/utils/security';
import { replacePdfNamesInText } from '@/utils/pdf-display';

interface AgentMessage {
  id: string;
  agentName: string;
  content: string;
  isComplete: boolean;
}

interface MessageCardProps {
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  agentMessages?: AgentMessage[];
}

export function MessageCard({ 
  content, 
  timestamp, 
  isStreaming = false, 
  agentMessages 
}: MessageCardProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // エージェントメッセージがある場合、FinalCoordinatorのみ表示し、他は問い合わせ中表示
  if (agentMessages && agentMessages.length > 0) {
    // デバッグ用ログ（詳細版）
    console.log('=== 全エージェントメッセージ詳細 ===', agentMessages.map(msg => ({
      agentName: msg.agentName,
      agentNameType: typeof msg.agentName,
      id: msg.id,
      contentLength: msg.content?.length || 0,
      isComplete: msg.isComplete,
      contentPreview: msg.content?.substring(0, 100) + '...'
    })));
    
    // エージェント名の正常性チェック（必要に応じてデバッグ時のみ有効化）
    // agentMessages.forEach((msg, index) => {
    //   if (msg.agentName?.includes('Recipe') || msg.agentName?.includes('Advisor')) {
    //     console.warn(`🚨 問題のあるエージェント名を検出 [${index}]:`, {
    //       agentName: msg.agentName,
    //       rawAgentName: JSON.stringify(msg.agentName),
    //       id: msg.id
    //     });
    //   }
    // });
    
    // 実際のエージェント名に基づく検出
    const finalCoordinator = agentMessages.find(msg => 
      msg.agentName === '総合アドバイザー' ||
      msg.agentName === 'FinalCoordinator' || 
      msg.agentName === 'final_coordinator' ||
      msg.agentName === 'KidsFoodAdvisor' ||
      msg.agentName?.includes('総合') ||
      msg.agentName?.toLowerCase().includes('final') ||
      msg.agentName?.toLowerCase().includes('coordinator')
    );
    const otherAgents = agentMessages.filter(msg => 
      msg.agentName !== '総合アドバイザー' &&
      msg.agentName !== 'FinalCoordinator' && 
      msg.agentName !== 'final_coordinator' &&
      msg.agentName !== 'KidsFoodAdvisor' &&
      !msg.agentName?.includes('総合') &&
      !msg.agentName?.toLowerCase().includes('final') &&
      !msg.agentName?.toLowerCase().includes('coordinator')
    );
    
    console.log('FinalCoordinator found:', !!finalCoordinator);
    console.log('Other agents count:', otherAgents.length);
    
    return (
      <div className="space-y-0">
        {/* 他のエージェントのストリーミング表示 */}
        {otherAgents.map((agentMsg) => (
          <div key={agentMsg.id} className="w-full bg-muted/10 border-t border-muted/30 py-4">
            <div className="max-w-full mx-auto px-2 lg:px-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {agentMsg.agentName || 'エージェント'}
                </span>
                {!agentMsg.isComplete && (
                  <Loader2 className="w-3 h-3 animate-spin text-secondary" />
                )}
              </div>
              <div className="text-base text-foreground leading-relaxed">
                {agentMsg.content ? (
                  <Markdown content={safeText(replacePdfNamesInText(agentMsg.content))} />
                ) : (
                  <div className="text-muted-foreground italic">
                    {agentMsg.isComplete ? '分析完了' : '問い合わせ中...'}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* final_coordinatorのメッセージを表示 */}
        {finalCoordinator && (
          <div className="w-full bg-muted/20 border-t border-muted/40 py-6">
            <div className="max-w-full mx-auto px-2 lg:px-3">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-muted-foreground">
                  {finalCoordinator.agentName || 'AIアシスタント'}
                </span>
                {!finalCoordinator.isComplete && (
                  <Loader2 className="w-3 h-3 animate-spin text-secondary" />
                )}
              </div>
              <div className="text-base text-foreground leading-relaxed">
                <Markdown content={safeText(replacePdfNamesInText(finalCoordinator.content))} />
              </div>
              <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
                <span>{formatTime(timestamp)}</span>
                {isStreaming && !finalCoordinator.isComplete && (
                  <Loader2 className="w-3 h-3 animate-spin text-secondary" />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 通常のアシスタントメッセージ（エージェントメッセージがない場合）
  return (
    <div className="w-full bg-muted/20 border-t border-muted/40 py-6">
      <div className="max-w-full mx-auto px-2 lg:px-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-medium text-muted-foreground">
            AI アシスタント
          </span>
          {isStreaming && (
            <Loader2 className="w-3 h-3 animate-spin text-secondary" />
          )}
        </div>
        <div className="text-base text-foreground leading-relaxed">
          <Markdown content={safeText(replacePdfNamesInText(content))} />
        </div>
        {/* タイムスタンプ */}
        <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
          <span>{formatTime(timestamp)}</span>
          {isStreaming && (
            <Loader2 className="w-3 h-3 animate-spin text-secondary" />
          )}
        </div>
      </div>
    </div>
  );
}