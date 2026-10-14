import { css, customElement, html, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_DOCUMENT_WORKSPACE_CONTEXT } from "@umbraco-cms/backoffice/document";
import "../components/chat-messages.element";

// Chat on the document being edited. The document key is the channel.
@customElement("backchat-workspace-view")
export class BackChatWorkspaceViewElement extends UmbLitElement {
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
      <umb-body-layout>
        <uui-box headline=${this.localize.term("backchat_chat")} class="chat-box">
          ${canChat
            ? html`<backchat-chat-messages .channel=${this._unique!}></backchat-chat-messages>`
            : html`<p>${this.localize.term("backchat_saveToStart")}</p>`}
        </uui-box>
      </umb-body-layout>
    `;
  }

  static override styles = css`
    .chat-box {
      height: 100%;
    }

    backchat-chat-messages {
      height: 60vh;
    }
  `;
}

export { BackChatWorkspaceViewElement as element };
