import React, { useRef, useEffect } from "react";
import { Check, CheckCheck, Clock } from "lucide-react";
import { FrontendMessage } from "@/types/frontend-chat"; // Use frontend-specific type
import { ScrollArea } from "@/components/ui/scroll-area";

interface MessageListProps {
  messages: FrontendMessage[]; // Changed to FrontendMessage[]
}

export default function MessageList({ messages }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getMessageStatus = (status?: string) => {
    switch (status) {
      case "sent":
        return <Clock size={16} className="text-gray-400" />; // Clock for "sent" (pending delivery)
      case "delivered":
        return <CheckCheck size={16} className="text-gray-400" />; // Two checks for "delivered"
      case "read":
        return <CheckCheck size={16} className="text-blue-500" />; // Blue two checks for "read"
      default:
        return null; // Or some other default icon
    }
  };

  return (
    <ScrollArea className="flex-1 px-4 py-4 bg-white">
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.from === "me" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                msg.from === "me"
                  ? "bg-blue-500 text-white rounded-br-md"
                  : "bg-white text-gray-800 rounded-bl-md shadow-sm border"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">
                {msg.text}
              </p>
              <div
                className={`flex items-center justify-end gap-1 mt-1 ${
                  msg.from === "me"
                    ? "text-blue-100"
                    : "text-gray-500"
                }`}
              >
                <span className="text-xs">{msg.time}</span>
                {msg.from === "me" && getMessageStatus(msg.status)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}