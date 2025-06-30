'use client';

import React from 'react';
import { safeText } from '@/utils/security';

interface ChatBubbleProps {
  content: string;
  timestamp: Date;
}

export function ChatBubble({ 
  content, 
  timestamp
}: ChatBubbleProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-[96%]">
        <div className="bg-primary rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
          <p className="text-base text-primary-foreground whitespace-pre-wrap leading-relaxed">
            {safeText(content)}
          </p>
          <div className="text-sm text-primary-foreground mt-2 text-right">
            {formatTime(timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
}