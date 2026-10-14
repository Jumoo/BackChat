import { css, customElement, html, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_DOCUMENT_WORKSPACE_CONTEXT } from "@umbraco-cms/backoffice/document";
import "../components/chat-messages.element";

// Chat on the document being edited. The document key is the channel.
@customElement("backchat-workspace-view")
export class BackChatWorkspaceViewElement extends UmbLitElement {
  @state()
  private _unique?: string;

  constructor() {
    super();

    this.consumeContext(UMB_DOCUMENT_WORKSPACE_CONTEXT, (context) => {
      this._unique = context?.getUnique() ?? undefined;
    });
  }

  override render() {
    return html`
      <umb-body-layout>
        <uui-box headline=${this.localize.term("backchat_chat")} class="chat-box">
          ${this._unique
            ? html`<backchat-chat-messages .channel=${this._unique}></backchat-chat-messages>`
            : html`<p>${this.localize.term("backchat_saveToStart")}</p>`}
        </uui-box>
      </umb-body-layout>
    `;
  }

  static override styles = css`
    .chat-box {
      height: 100%;
    }
  `;
}

export default BackChatWorkspaceViewElement;
