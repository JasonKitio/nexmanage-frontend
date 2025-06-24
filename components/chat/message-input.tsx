import React from "react";
import { SendHorizontal, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MessageInputProps {
  message: string;
  setMessage: (message: string) => void;
  handleSend: (e: React.FormEvent) => void;
}

export default function MessageInput({
  message,
  setMessage,
  handleSend,
}: MessageInputProps) {
  
  return (
    <form
      className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-white"
      onSubmit={handleSend}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="p-2 hover:bg-gray-100 rounded-full"
      >
        <Paperclip size={20} className="text-gray-500" />
      </Button>

      <div className="flex-1 relative">
        <Input
          type="text"
          placeholder="Écrivez un message..."
          className="pr-10 border border-gray shadow-none focus:bg-white rounded-full"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>

      <Button
        type="submit"
        size="sm"
        className="p-2 bg-blue-500 hover:bg-blue-600 rounded-full w-fit px-3"
      >
        <SendHorizontal size={20} className="text-white" />
      </Button>
    </form>
  );
}