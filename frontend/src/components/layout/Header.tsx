// 画面共通ヘッダー

import React from 'react';
import { ArrowLeft, MoreVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/components/auth/UserProfile';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  title: string;
  onBack?: () => void;
  showBackButton?: boolean;
  fixed?: boolean;
  showUserProfile?: boolean;
  showMenu?: boolean;
  onDelete?: () => void;
  deleteLabel?: string;
  deleteDescription?: string;
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  onBack, 
  showBackButton = true,
  fixed = false,
  showUserProfile = true,
  showMenu = false,
  onDelete,
  deleteLabel = "削除",
  deleteDescription = "この操作は取り消せません。"
}) => {
  const baseClasses = "bg-background p-4 flex items-center gap-3 z-50";
  const fixedClasses = fixed ? "fixed top-0 left-0 right-0" : "";
  
  const handleDeleteClick = () => {
    if (confirm(deleteDescription)) {
      onDelete?.();
    }
  };
  
  return (
    <div className={`${baseClasses} ${fixedClasses}`}>
      {showBackButton && onBack && (
        <Button 
          onClick={onBack}
          variant="ghost"
          size="icon"
          className="text-foreground hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
      )}
      <div className="text-foreground text-lg font-bold flex-1">{title}</div>
      
      {/* メニューボタン */}
      {showMenu && onDelete && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost"
              size="icon"
              className="text-foreground hover:bg-accent"
            >
              <MoreVertical className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={handleDeleteClick}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {deleteLabel}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      
      {showUserProfile && (
        <UserProfile />
      )}
    </div>
  );
};