"use client";

import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { formatConversationTime, formatSessionDisplayName } from "@/utils/date-formatter";

interface ConversationListItemProps {
  sessionId: string;
  displayName?: string | null;
  createTime: string;
  updateTime: string;
}

export function ConversationListItem({
  sessionId,
  displayName,
  createTime,
  updateTime,
}: ConversationListItemProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/chat/${sessionId}`);
  };

  const sessionName = formatSessionDisplayName(displayName, createTime);
  const timeDisplay = formatConversationTime(updateTime);

  return (
    <div
      className="flex items-center p-4 border-b border-gray-100 hover:bg-gray-50 active:bg-gray-100 cursor-pointer transition-colors"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* アイコン */}
      <div className="flex-shrink-0 mr-3">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-primary" />
        </div>
      </div>

      {/* コンテンツ */}
      <div className="flex-grow min-w-0">
        <div className="flex items-start justify-between">
          <h3 className="text-base font-medium text-gray-900 truncate pr-2">
            {sessionName}
          </h3>
          <span className="text-sm text-gray-500 flex-shrink-0">
            {timeDisplay}
          </span>
        </div>
      </div>
    </div>
  );
}