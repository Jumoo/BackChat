import { css, customElement, html } from "@umbraco-cms/backoffice/external/lit";
import { UmbModalBaseElement } from "@umbraco-cms/backoffice/modal";
import type { ChatModalData, ChatModalResult } from "./chat-modal.token";
import { BACKCHAT_GLOBAL_CHANNEL } from "../constants";
import "../components/chat-messages.element";

@customElement("backchat-chat-modal")
export class BackChatChatModalElement extends UmbModalBaseElement<ChatModalData, ChatModalResult> {
  #onClose() {
    this.modalContext?.reject();
  }

  override render() {
    return html`
      <umb-body-layout>
        <div slot="header" class="header">
          <uui-icon name="icon-chat"></uui-icon>
          <h3>Back.Chat</h3>
        </div>
        <div class="layout">
          <backchat-chat-messages .channel=${BACKCHAT_GLOBAL_CHANNEL}></backchat-chat-messages>
        </div>
        <div slot="actions">
          <uui-button label=${this.localize.term("backchat_close")} @click=${this.#onClose}></uui-button>
        </div>
      </umb-body-layout>
    `;
  }

  static override styles = css`
    .header {
      display: flex;
      gap: var(--uui-size-space-2);
      align-items: center;
    }

    .layout {
      height: 100%;
      overflow: hidden;
    }
  `;
}

export default BackChatChatModalElement;
