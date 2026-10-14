export interface ChatMessage {
  key: string;
  channel: string;
  message: string;
  userName: string;
  userKey?: string;
  date: string;
}
