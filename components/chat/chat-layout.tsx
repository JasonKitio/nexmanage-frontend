"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MessageSquare } from "lucide-react";
import ChatList from "./chat-list";
import ChatHeader from "./chat-header";
import MessageList from "./message-list";
import MessageInput from "./message-input";
import NewChatModal from "@/components/modal";

import { User } from "@/types"; // Only need Utilisateur from core types
import { FrontendConversation, FrontendMessage } from "@/types/frontend-chat";
import { useChatApi } from "@/hooks/use-chat-api"; // Import the custom hook

interface ChatLayoutProps {
  currentUser: User;
}

export default function ChatLayout({ currentUser }: ChatLayoutProps) {
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [showChatList, setShowChatList] = useState(true);

  const {
    conversations,
    setConversations,
    isLoadingConversations,
    errorConversations,
    fetchConversations,
    fetchMessages,
    sendMessage,
    createConversation,
  } = useChatApi({ currentUser });

  const [currentConvId, setCurrentConvId] = useState<string | null>(null);

  const currentConversation = conversations.find((c) => c.id === currentConvId);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowChatList(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (currentUser?.idUtilisateur) {
      fetchConversations();
    }
    const pollingInterval = setInterval(fetchConversations, 60000);
    return () => clearInterval(pollingInterval);
  }, [currentUser, fetchConversations]);

  useEffect(() => {
    if (!currentConvId && conversations.length > 0) {
      setCurrentConvId(conversations[0].id);
    }
  }, [conversations, currentConvId]);

  useEffect(() => {
    let messagePollingInterval: NodeJS.Timeout;
    if (currentConvId) {
      fetchMessages(currentConvId);
      messagePollingInterval = setInterval(() => fetchMessages(currentConvId), 5000);
    }
    return () => {
      if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
      }
    };
  }, [currentConvId, fetchMessages]);

  const handleSend = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !currentUser?.idUtilisateur || !currentConvId) return;

    const currentConv = conversations.find((c) => c.id === currentConvId);
    if (!currentConv) return;

    const optimisticMessage: FrontendMessage = {
      id: Date.now().toString(),
      auteur: currentUser,
      contenu: message,
      dateEnvoi: new Date(),
      conversation: {
        id: currentConv.id,
        participants: currentConv.participants,
        messages: [],
      },
      luPar: [currentUser],
      from: "me",
      text: message,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent",
    };

    setConversations((prevConversations: FrontendConversation[]) =>
      prevConversations.map((conv: FrontendConversation) => {
        if (conv.id === currentConvId) {
          // Explicitly type conv.messages as FrontendMessage[] here
          return {
            ...conv,
            messages: [...conv.messages as FrontendMessage[], optimisticMessage],
            preview: message,
            time: optimisticMessage.time,
          };
        }
        return conv;
      })
    );
    setMessage("");

    try {
      const sentFrontendMessage = await sendMessage(currentConvId, message);

      setConversations((prevConversations: FrontendConversation[]) =>
        prevConversations.map((conv: FrontendConversation) => {
          if (conv.id === currentConvId) {
            return {
              ...conv,
              // Explicitly type conv.messages as FrontendMessage[] here
              messages: (conv.messages as FrontendMessage[]).map((msg: FrontendMessage) =>
                msg.id === optimisticMessage.id ? sentFrontendMessage : msg
              ),
            };
          }
          return conv;
        })
      );
    } catch (err) {
      console.error("Failed to send message:", err);
      setConversations((prevConversations: FrontendConversation[]) =>
        prevConversations.map((conv: FrontendConversation) => {
          if (conv.id === currentConvId) {
            return {
              ...conv,
              // Explicitly type conv.messages as FrontendMessage[] here
              messages: (conv.messages as FrontendMessage[]).filter((msg: FrontendMessage) => msg.id !== optimisticMessage.id),
            };
          }
          return conv;
        })
      );
    }
  }, [message, currentConvId, currentUser, conversations, sendMessage, setConversations]);

  const handleAddConversation = useCallback(async (employee: User) => {
    const existingConv = conversations.find((conv) =>
      conv.participants.some(p => p.idUtilisateur === currentUser.idUtilisateur) &&
      conv.participants.some(p => p.idUtilisateur === employee.idUtilisateur) &&
      conv.participants.length === 2
    );

    if (existingConv) {
      setCurrentConvId(existingConv.id);
    } else {
      try {
        const newConvFormatted = await createConversation([currentUser.idUtilisateur, employee.idUtilisateur]);
        setConversations((prev: FrontendConversation[]) => [...prev, newConvFormatted]);
        setCurrentConvId(newConvFormatted.id);
      } catch (err) {
        console.error("Failed to create new conversation:", err);
      }
    }
    setIsModalOpen(false);
    if (isMobileView) {
      setShowChatList(false);
    }
  }, [conversations, isMobileView, currentUser, createConversation, setConversations]);

  const handleBackToList = useCallback(() => {
    setShowChatList(true);
  }, []);

  const handleSelectConversation = useCallback((convId: string) => {
    setCurrentConvId(convId);
    if (isMobileView) {
      setShowChatList(false);
    }
  }, [isMobileView]);

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full bg-gray-100 rounded-2xl overflow-hidden shadow-2xl">
      <div className="w-full h-full flex">
        <div
          className={`${
            isMobileView ? (showChatList ? "w-full" : "hidden") : "w-80"
          } h-full border-r border-gray-200 flex flex-col bg-white`}
        >
          {isLoadingConversations ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Chargement des conversations...
            </div>
          ) : errorConversations ? (
            <div className="flex-1 flex items-center justify-center text-red-500">
              Erreur: {errorConversations}
            </div>
          ) : (
            <ChatList
              conversations={filteredConversations}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              currentConvId={currentConvId}
              handleSelectConversation={handleSelectConversation}
              setIsModalOpen={setIsModalOpen}
            />
          )}
        </div>

        <div
          className={`${
            isMobileView ? (showChatList ? "hidden" : "w-full") : "flex-1"
          } h-full flex flex-col bg-white`}
        >
          {currentConversation ? (
            <>
              <ChatHeader
                currentConversation={currentConversation}
                isMobileView={isMobileView}
                handleBackToList={handleBackToList}
              />
              <MessageList messages={currentConversation.messages} />
              <MessageInput
                message={message}
                setMessage={setMessage}
                handleSend={handleSend}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquare
                  size={64}
                  className="text-gray-300 mx-auto mb-4"
                />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Sélectionnez une conversation
                </h3>
                <p className="text-gray-500">
                  Choisissez une conversation pour commencer à discuter
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <NewChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleAddConversation}
        currentUser={currentUser}
        conversations={conversations}
      />
    </div>
  );
}