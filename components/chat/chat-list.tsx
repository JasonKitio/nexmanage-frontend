import React from "react";
import { Search, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatListItem from "./chat-list-item";
import { FrontendConversation } from "@/types/frontend-chat"; // Use frontend-specific type

interface ChatListProps {
  conversations: FrontendConversation[]; // Changed to FrontendConversation[]
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  currentConvId: string | null;
  handleSelectConversation: (convId: string) => void;
  setIsModalOpen: (isOpen: boolean) => void;
}

export default function ChatList({
  conversations,
  searchQuery,
  setSearchQuery,
  currentConvId,
  handleSelectConversation,
  setIsModalOpen,
}: ChatListProps) {
  return (
    <div className="h-full border-r border-gray-200 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4.5 bg-gray-50 border-b border-gray-200">
        <h2 className="font-semibold text-lg text-gray-800">Messages</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsModalOpen(true)}
            className="p-2 hover:bg-gray-200 rounded-full"
          >
            <MessageSquare size={20} className="text-gray-600" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <Input
            placeholder="Rechercher une conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-1 border-gray shadow-none focus:bg-white"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-gray-100">
          {conversations.map((chat) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              isSelected={chat.id === currentConvId}
              onSelect={handleSelectConversation}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}