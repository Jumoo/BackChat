import { css, customElement, html, nothing, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbModalBaseElement } from "@umbraco-cms/backoffice/modal";
import { UMB_CURRENT_USER_CONTEXT } from "@umbraco-cms/backoffice/current-user";
import type { ChatModalData, ChatModalResult } from "./chat-modal.token";
import type { Conversation, Mentionables } from "../signalR/types";
import { BACKCHAT_CONTEXT } from "../global/backchat.context.token";
import { conversationIcon, conversationTitle } from "../conversations/conversation-title";
import type { BackChatOpenConversationEvent } from "../conversations/conversation-list.element";
import { openDocumentComms } from "../comms/open-comms";
import "../components/chat-messages.element";
import "../conversations/conversation-list.element";
import "../conversations/new-conversation.element";

type View = { kind: "list" } | { kind: "new" } | { kind: "chat"; conversation: Conversation };

// The header chat: a list of conversations, each opening into its chat
@customElement("backchat-chat-modal")
export class BackChatChatModalElement extends UmbModalBaseElement<ChatModalData, ChatModalResult> {
  @state()
  private _view: View = { kind: "list" };

  @state()
  private _mentionables: Mentionables = { users: [], groups: [] };

  @state()
  private _currentUserKey?: string;

  constructor() {
    super();

    this.consumeContext(BACKCHAT_CONTEXT, (context) => {
      if (!context) return;
      this.observe(context.mentionables, (m) => (this._mentionables = m), "_mentionables");
    });

    this.consumeContext(UMB_CURRENT_USER_CONTEXT, (context) => {
      if (!context) return;
      this.observe(context.unique, (unique) => (this._currentUserKey = unique), "_currentUserKey");
    });
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.data?.conversation) this._view = { kind: "chat", conversation: this.data.conversation };
  }

  #onClose() {
    this.modalContext?.reject();
  }

  #onOpen(e: BackChatOpenConversationEvent) {
    const conversation = e.conversation;

    // A document's chat lives on the document, so go there
    if (conversation.kind === "Document") {
      this.modalContext?.reject();
      openDocumentComms(conversation.channel);
      return;
    }

    this._view = { kind: "chat", conversation };
  }

  #title() {
    switch (this._view.kind) {
      case "chat":
        return conversationTitle(this._view.conversation, this._mentionables, this._currentUserKey, (k) =>
          this.localize.term(k)
        );
      case "new":
        return this.localize.term("backchat_newConversation");
      default:
        return "Back.Chat";
    }
  }

  #renderHeader() {
    const icon = this._view.kind === "chat" ? conversationIcon(this._view.conversation) : "icon-chat";

    return html`
      <div slot="header" class="header">
        ${this._view.kind !== "list"
          ? html`<uui-button
              compact
              label=${this.localize.term("backchat_back")}
              @click=${() => (this._view = { kind: "list" })}
            >
              <uui-icon name="icon-arrow-left"></uui-icon>
            </uui-button>`
          : nothing}
        <uui-icon name=${icon}></uui-icon>
        <h3>${this.#title()}</h3>
        ${this._view.kind === "list"
          ? html`<uui-button
              class="new"
              look="secondary"
              compact
              label=${this.localize.term("backchat_newConversation")}
              @click=${() => (this._view = { kind: "new" })}
            >
              <uui-icon name="icon-add"></uui-icon> ${this.localize.term("backchat_new")}
            </uui-button>`
          : nothing}
      </div>
    `;
  }

  #renderBody() {
    switch (this._view.kind) {
      case "chat":
        return html`<backchat-chat-messages .channel=${this._view.conversation.channel}></backchat-chat-messages>`;
      case "new":
        return html`<backchat-new-conversation @open-conversation=${this.#onOpen}></backchat-new-conversation>`;
      default:
        return html`<backchat-conversation-list @open-conversation=${this.#onOpen}></backchat-conversation-list>`;
    }
  }

  override render() {
    return html`
      <umb-body-layout>
        ${this.#renderHeader()}
        <div class="layout ${this._view.kind}">${this.#renderBody()}</div>
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
      width: 100%;
      min-width: 0;
    }

    .header h3 {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .header .new {
      margin-left: auto;
    }

    .layout.chat {
      height: 100%;
      overflow: hidden;
    }
  `;
}

export default BackChatChatModalElement;
