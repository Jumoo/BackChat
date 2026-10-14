import { UmbHeaderAppButtonElement } from "@umbraco-cms/backoffice/components";
import { customElement, html } from "@umbraco-cms/backoffice/external/lit";
import { UMB_MODAL_MANAGER_CONTEXT } from "@umbraco-cms/backoffice/modal";
import { BACKCHAT_CHAT_MODAL } from "../modal/chat-modal.token";

@customElement("backchat-header-app")
export class BackChatHeaderAppElement extends UmbHeaderAppButtonElement {
  override render() {
    return html`
      <uui-button look="primary" label=${this.localize.term("backchat_chat")} compact @click=${this.#onClick}>
        <uui-icon name="icon-chat"></uui-icon>
      </uui-button>
    `;
  }

  async #onClick() {
    const modalManager = await this.getContext(UMB_MODAL_MANAGER_CONTEXT);
    if (!modalManager) return;

    const chatModal = modalManager.open(this, BACKCHAT_CHAT_MODAL, { data: {} });
    await chatModal.onSubmit().catch(() => undefined);
  }
}

export default BackChatHeaderAppElement;
