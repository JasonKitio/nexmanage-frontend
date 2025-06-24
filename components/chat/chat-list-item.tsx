import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FrontendConversation } from "@/types/frontend-chat"; // Use frontend-specific type

interface ChatListItemProps {
  chat: FrontendConversation; // Changed to FrontendConversation
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export default function ChatListItem({
  chat,
  isSelected,
  onSelect,
}: ChatListItemProps) {
  return (
    <button
      key={chat.id}
      onClick={() => onSelect(chat.id)}
      className={`flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
        isSelected
          ? "bg-blue-50 border-b-0 border-l-4 border-blue-500"
          : ""
      }`}
    >
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage src={chat.avatar || "/placeholder.svg"} />
          <AvatarFallback className="bg-blue-500 text-white font-semibold">
            {chat.initials || chat.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {chat.isOnline && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="font-semibold text-gray-900 truncate pr-2">
            {chat.name}
          </p>
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">
              {chat.time}
            </span>
            {chat.unreadCount > 0 && (
              <Badge className="bg-green-500 text-white text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center">
                {chat.unreadCount}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600 truncate">
          {chat.preview}
        </p>
      </div>
    </button>
  );
}