// These types are for frontend display purposes only,
// extending your core backend types from types/index.ts
import { Conversation as BackendConversation, Message as BackendMessage, Utilisateur } from './index';

export interface FrontendConversation extends BackendConversation {
  name: string; // Name of the other participant for 1-to-1 chats
  initials?: string; // For avatar fallback
  avatar?: string; // URL for the avatar image
  preview: string; // Content of the last message
  time: string; // Formatted time of the last message
  unreadCount: number; // Number of unread messages for the current user in this conversation
  isOnline: boolean; // Real-time online status of the other participant
  lastSeen?: string; // Last seen timestamp of the other participant
}

export interface FrontendMessage extends BackendMessage {
  // `from` and `text` are derived for simpler rendering in MessageList
  from: "me" | string; // "me" for current user, or the other user's name
  text: string; // Content of the message
  time: string; // Formatted time of the message (e.g., "10:30 AM")
  status?: "sent" | "delivered" | "read"; // For message delivery status display
}