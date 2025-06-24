"use client";

import type React from "react";
import { useState, useCallback } from "react";
import { fetcher } from "@/lib/api";
import { useAuthStore } from "@/stores/auth-store";

import type { Utilisateur, Conversation as BackendConversation, Message as BackendMessage, User } from "@/types";
import type { FrontendConversation, FrontendMessage } from "@/types/frontend-chat";

interface UseChatApiProps {
  currentUser: User;
}

interface ChatApiReturn {
  conversations: FrontendConversation[];
  setConversations: React.Dispatch<React.SetStateAction<FrontendConversation[]>>;
  isLoadingConversations: boolean;
  errorConversations: string | null;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<FrontendMessage[]>;
  sendMessage: (conversationId: string, contenu: string) => Promise<FrontendMessage>;
  createConversation: (participantIds: string[]) => Promise<FrontendConversation>;
  markMessageAsRead: (messageId: string, readerId: string) => Promise<BackendMessage>;
}

export const useChatApi = ({ currentUser }: UseChatApiProps): ChatApiReturn => {
  const [conversations, setConversations] = useState<FrontendConversation[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [errorConversations, setErrorConversations] = useState<string | null>(null);

  const { getAuthHeaders } = useAuthStore();

  const mapBackendMessageToFrontend = useCallback(
    (
      msg: BackendMessage,
      currentUserId: string,
      allParticipants: Utilisateur[],
    ): FrontendMessage => {
      const participantsArray = allParticipants || [];
      const fromUser = participantsArray.find((p) => p.idUtilisateur === msg.auteur.idUtilisateur);

      return {
        ...msg,
        from: msg.auteur.idUtilisateur === currentUserId ? "me" : fromUser?.nom || "Inconnu",
        text: msg.contenu,
        time: new Date(msg.dateEnvoi).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status:
          msg.auteur.idUtilisateur === currentUserId
            ? (msg.luPar || []).some((reader) => reader.idUtilisateur !== currentUserId)
              ? "read"
              : "delivered"
            : undefined,
      };
    },
    [],
  );

  const mapBackendConversationToFrontend = useCallback(
    (backendConv: BackendConversation, currentUserId: string): FrontendConversation => {
      const participantsArray = backendConv.participants || [];
      const otherParticipant = participantsArray.find((p) => p.idUtilisateur !== currentUserId);

      const messagesArray = backendConv.messages || [];
      const lastMessage = messagesArray.length > 0 ? messagesArray[messagesArray.length - 1] : null;

      const unreadCount = messagesArray.filter(
        (msg) =>
          msg.auteur.idUtilisateur !== currentUserId &&
          !(msg.luPar || []).some((reader) => reader.idUtilisateur === currentUserId),
      ).length;

      const frontendMessages: FrontendMessage[] = messagesArray.map((msg) =>
        mapBackendMessageToFrontend(msg, currentUserId, participantsArray),
      );

      return {
        ...backendConv,
        name: otherParticipant?.nom || "Inconnu",
        initials: otherParticipant?.nom?.charAt(0).toUpperCase() || "",
        avatar: otherParticipant ? "/user.png" : "/placeholder.png",
        preview: lastMessage?.contenu || "",
        time: lastMessage
          ? new Date(lastMessage.dateEnvoi).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
          : "",
        unreadCount: unreadCount,
        isOnline: false,
        lastSeen: "il y a x min",
        messages: frontendMessages,
      };
    },
    [mapBackendMessageToFrontend],
  );

  // --- API Endpoints and Fetching Logic ---

  const markMessageAsRead = useCallback(
    async (messageId: string, readerId: string): Promise<BackendMessage> => {
      try {
        const headers = getAuthHeaders();
        const updatedMessage: BackendMessage = await fetcher(`/messages/${messageId}/read`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify({ readerId }),
        });
        return updatedMessage;
      } catch (err: any) {
        console.error(`Failed to mark message ${messageId} as read:`, err);
        throw err;
      }
    },
    [getAuthHeaders],
  );

  const fetchConversations = useCallback(async () => {
    if (!currentUser?.idUtilisateur) return;
    setIsLoadingConversations(true);
    setErrorConversations(null);
    try {
      const headers = getAuthHeaders();
      const backendConversations: BackendConversation[] = await fetcher(
        `/messages/user/${currentUser.idUtilisateur}`,
        {
          method: "GET",
          headers: headers,
        },
      );
      const formattedConversations: FrontendConversation[] = backendConversations.map((conv) =>
        mapBackendConversationToFrontend(conv, currentUser.idUtilisateur),
      );
      setConversations(formattedConversations);
    } catch (err: any) {
      console.log("Current user ID: ", currentUser.idUtilisateur);
      console.error("Failed to fetch user conversations:", err);
      setErrorConversations(err.message || "Failed to load conversations.");
    } finally {
      setIsLoadingConversations(false);
    }
  }, [currentUser, mapBackendConversationToFrontend, getAuthHeaders]);

  const fetchMessages = useCallback(
    async (conversationId: string): Promise<FrontendMessage[]> => {
      console.log("[fetchMessages] Called for conversationId:", conversationId);
      console.log("[fetchMessages] Current conversations state (start):", conversations);

      if (!currentUser?.idUtilisateur || !conversationId) {
        console.log("[fetchMessages] Missing currentUser or conversationId, returning empty.");
        return [];
      }

      const currentFullFrontendConversation = conversations.find((conv) => conv.id === conversationId);

      console.log("[fetchMessages] Found conversation by ID:", currentFullFrontendConversation);

      // Vérification renforcée
      if (
        !currentFullFrontendConversation ||
        !Array.isArray(currentFullFrontendConversation.participants) ||
        currentFullFrontendConversation.participants.length < 2 // Une conversation doit avoir au moins 2 participants pour cette logique
      ) {
        console.warn(
          `[fetchMessages] Conversation ${conversationId} not found, or participants array is invalid/incomplete.`,
          {
            conversation: currentFullFrontendConversation,
            participants: currentFullFrontendConversation?.participants,
          }
        );
        return [];
      }

      // À ce stade, currentFullFrontendConversation et ses participants devraient être valides.
      // Chercher l'autre participant
      const otherParticipant = currentFullFrontendConversation.participants.find(
        (p) => p.idUtilisateur !== currentUser.idUtilisateur,
      );

      if (!otherParticipant) {
        console.error(
          `[fetchMessages] Could not find the other participant in conversation ${conversationId}. Participants:`,
          currentFullFrontendConversation.participants
        );
        return [];
      }

      const user1Id = currentUser.idUtilisateur;
      const user2Id = otherParticipant.idUtilisateur;
      const endpoint = `/messages/conversation/${user1Id}/${user2Id}`;
      console.log(`[fetchMessages] Constructed endpoint: ${endpoint}`);

      try {
        const headers = getAuthHeaders();
        const backendMessages: BackendMessage[] = await fetcher(endpoint, {
          method: "GET",
          headers: headers,
        });

        await Promise.all(
          backendMessages.map(async (msg) => {
            if (
              msg.auteur.idUtilisateur !== currentUser.idUtilisateur &&
              !(msg.luPar || []).some((reader) => reader.idUtilisateur === currentUser.idUtilisateur)
            ) {
              try {
                await markMessageAsRead(msg.id, currentUser.idUtilisateur);
              } catch (readError) {
                console.error(`[fetchMessages] Failed to mark message ${msg.id} as read:`, readError);
              }
            }
          }),
        );

        const mappedMessages = backendMessages.map((msg) =>
          mapBackendMessageToFrontend(msg, currentUser.idUtilisateur, currentFullFrontendConversation.participants),
        );

        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                messages: mappedMessages,
                unreadCount: 0,
                preview: mappedMessages.length > 0 ? mappedMessages[mappedMessages.length - 1].contenu : conv.preview,
                time: mappedMessages.length > 0 ? mappedMessages[mappedMessages.length - 1].time : conv.time,
              };
            }
            return conv;
          }),
        );

        return mappedMessages;
      } catch (err: any) {
        console.error(`[fetchMessages] Failed to fetch messages for conversation ${conversationId} from ${endpoint}:`, err);
        return [];
      }
    },
    [
      currentUser,
      conversations, // 'conversations' est une dépendance car nous l'utilisons pour trouver les IDs des participants
      mapBackendMessageToFrontend,
      markMessageAsRead,
      setConversations,
      getAuthHeaders,
    ],
  );

  const sendMessage = useCallback(
    async (conversationId: string, contenu: string): Promise<FrontendMessage> => {
      if (!currentUser?.idUtilisateur || !conversationId || !contenu.trim()) {
        throw new Error("Missing message data.");
      }

      const payload = {
        conversationId: conversationId,
        auteurId: currentUser.idUtilisateur,
        contenu: contenu,
      };

      try {
        const headers = getAuthHeaders();
        const sentBackendMessage: BackendMessage = await fetcher(`/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify(payload),
        });

        const currentFrontendConv = conversations.find((conv) => conv.id === conversationId);
        const participantsForMapping = currentFrontendConv?.participants || [];

        const frontendMessage = mapBackendMessageToFrontend(
          sentBackendMessage,
          currentUser.idUtilisateur,
          participantsForMapping,
        );

        return frontendMessage;
      } catch (err: any) {
        console.error("Failed to send message:", err);
        throw err;
      }
    },
    [currentUser, conversations, mapBackendMessageToFrontend, getAuthHeaders],
  );

  const createConversation = useCallback(
    async (participantIds: string[]): Promise<FrontendConversation> => {
      try {
        const headers = getAuthHeaders();
        const newBackendConversation: BackendConversation = await fetcher(`/conversations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          body: JSON.stringify({ participantIds }),
        });

        const newConvFormatted = mapBackendConversationToFrontend(newBackendConversation, currentUser.idUtilisateur);
        return newConvFormatted;
      } catch (err: any) {
        console.error("Failed to create new conversation:", err);
        throw err;
      }
    },
    [currentUser, mapBackendConversationToFrontend, getAuthHeaders],
  );

  return {
    conversations,
    setConversations,
    isLoadingConversations,
    errorConversations,
    fetchConversations,
    fetchMessages,
    sendMessage,
    createConversation,
    markMessageAsRead,
  };
};