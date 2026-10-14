import { UmbModalToken } from "@umbraco-cms/backoffice/modal";

export type ChatModalData = Record<string, never>;

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
