import { UmbModalToken } from "@umbraco-cms/backoffice/modal";
import type { ChatMessage } from "../signalR/types";

export interface ConfirmationStatusModalData {
  message: ChatMessage;
}

export type ConfirmationStatusModalValue = Record<string, never>;

export const BACKCHAT_CONFIRMATION_STATUS_MODAL = new UmbModalToken<
  ConfirmationStatusModalData,
  ConfirmationStatusModalValue
>("BackChat.Modal.ConfirmationStatus", {
  modal: {
    type: "sidebar",
    size: "small",
  },
});
