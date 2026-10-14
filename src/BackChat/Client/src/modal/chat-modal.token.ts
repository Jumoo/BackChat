import { UmbModalToken } from "@umbraco-cms/backoffice/modal";
import type { Conversation } from "../signalR/types";

export interface ChatModalData {
  // Open straight into this conversation rather than the list
  conversation?: Conversation;
}

export type ChatModalResult = Record<string, never>;

export const BACKCHAT_CHAT_MODAL_ALIAS = "BackChat.Modal";

export const BACKCHAT_CHAT_MODAL = new UmbModalToken<ChatModalData, ChatModalResult>(
  BACKCHAT_CHAT_MODAL_ALIAS,
  {
    modal: {
      size: "small",
      type: "sidebar",
    },
  }
);
