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
