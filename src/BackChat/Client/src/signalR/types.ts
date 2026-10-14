export interface ChatMessage {
  key: string;
  channel: string;
  message: string;
  userName: string;
  userKey?: string;
  date: string;
}

// Unread messages in one channel. Mentions of the current user are counted separately.
export interface UnreadCount {
  channel: string;
  unread: number;
  mentions: number;
}

export interface MentionableUser {
  key: string;
  name: string;
}

export interface MentionableGroup {
  key: string;
  alias: string;
  name: string;
}

export interface Mentionables {
  users: MentionableUser[];
  groups: MentionableGroup[];
}

export interface SendMessageResult {
  // People the sender mentioned by name who can't see the chat
  unreachable: string[];
}

export type ChannelKind = "Global" | "Document" | "Direct" | "Group";

export interface Conversation {
  channel: string;
  kind: ChannelKind;
  // Group or document name. Direct conversations are named from their participants.
  title?: string;
  participants: string[];
  latest?: ChatMessage;
}
