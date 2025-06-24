import React from "react";
import { ArrowLeft, MoreHorizontal, Video, Phone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FrontendConversation } from "@/types/frontend-chat"; // Use frontend-specific type

interface ChatHeaderProps {
  currentConversation: FrontendConversation; // Changed to FrontendConversation
  isMobileView: boolean;
  handleBackToList: () => void;
}

export default function ChatHeader({
  currentConversation,
  isMobileView,
  handleBackToList,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center gap-3">
        {isMobileView && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToList}
            className="p-2 hover:bg-gray-200 rounded-full"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Button>
        )}
        <Avatar className="h-10 w-10">
          <AvatarImage src={currentConversation.avatar || "/placeholder.svg"} />
          <AvatarFallback className="bg-blue-500 text-white font-semibold">
            {currentConversation.initials || currentConversation.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="font-semibold text-gray-900">
            {currentConversation.name}
          </h3>
          <p className="text-xs text-gray-500">
            {currentConversation.isOnline ? "En ligne" : currentConversation.lastSeen}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="p-2 hover:bg-gray-200 rounded-full"
        >
          <Phone size={20} className="text-gray-600" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="p-2 hover:bg-gray-200 rounded-full"
        >
          <Video size={20} className="text-gray-600" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="p-2 hover:bg-gray-200 rounded-full"
        >
          <MoreHorizontal size={20} className="text-gray-600" />
        </Button>
      </div>
    </div>
  );
}