import { css, customElement, html, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_DOCUMENT_WORKSPACE_CONTEXT } from "@umbraco-cms/backoffice/document";
import "../../components/chat-messages.element";
import "../comms-app-layout.element";

// The chat about the document being edited. The document key is the channel.
@customElement("backchat-chat-comms-app")
export class BackChatChatCommsAppElement extends UmbLitElement {
  @state()
  private _unique?: string | null;

  @state()
  private _isNew?: boolean;

  constructor() {
    super();

    this.consumeContext(UMB_DOCUMENT_WORKSPACE_CONTEXT, (context) => {
      if (!context) return;
      this.observe(context.unique, (unique) => (this._unique = unique), "_unique");
      this.observe(context.isNew, (isNew) => (this._isNew = isNew), "_isNew");
    });
  }

  override render() {
    // A new document has a key before it is saved, but the server has nothing to check access against yet
    const canChat = !!this._unique && this._isNew === false;

    return html`
      <backchat-comms-app-layout headline="#backchat_chat" icon="icon-chat" ?fill=${canChat}>
        ${canChat
          ? html`<backchat-chat-messages .channel=${this._unique!}></backchat-chat-messages>`
          : html`<p>${this.localize.term("backchat_saveToStart")}</p>`}
      </backchat-comms-app-layout>
    `;
  }

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
    }

    p {
      margin: 0;
    }
  `;
}

export { BackChatChatCommsAppElement as element };

declare global {
  interface HTMLElementTagNameMap {
    "backchat-chat-comms-app": BackChatChatCommsAppElement;
  }
}
