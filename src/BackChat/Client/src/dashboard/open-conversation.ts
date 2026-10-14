import type { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_MODAL_MANAGER_CONTEXT } from "@umbraco-cms/backoffice/modal";
import { BACKCHAT_CHAT_MODAL } from "../modal/chat-modal.token";
import { openDocumentComms } from "../comms/open-comms";
import type { ChannelKind, Conversation } from "../signalR/types";

/**
 * Opens a channel where it lives: a document's chat on the document, anything else in the
 * header chat, straight into that conversation.
 */
export async function openChannel(
  host: UmbLitElement,
  channel: string,
  kind: ChannelKind,
  title?: string | null
) {
  if (kind === "Document") {
    openDocumentComms(channel);
    return;
  }

  const conversation: Conversation = {
    channel,
    kind,
    title: title ?? undefined,
    participants: kind === "Direct" ? channel.substring("dm:".length).split(",") : [],
  };

  const modalManager = await host.getContext(UMB_MODAL_MANAGER_CONTEXT);
  modalManager?.open(host, BACKCHAT_CHAT_MODAL, { data: { conversation } });
}
