import { css, customElement, html, property, query, repeat, state } from "@umbraco-cms/backoffice/external/lit";
import type { PropertyValues } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_CURRENT_USER_CONTEXT } from "@umbraco-cms/backoffice/current-user";
import { BACKCHAT_CONTEXT } from "../global/backchat.context.token";
import type { BackChatContext } from "../global/backchat.context";
import type { ChatMessage } from "../signalR/types";
import "./chat-bubble.element";
import "./chat-input-box.element";

// Shows the messages for one channel and the box to send into it
@customElement("backchat-chat-messages")
export class BackChatChatMessagesElement extends UmbLitElement {
  @property({ type: String })
  channel = "";

  @state()
  private _messages: ChatMessage[] = [];

  @state()
  private _currentUserKey?: string;

  @query(".messages")
  private _messagesElement?: HTMLElement;

  #context?: BackChatContext;

  constructor() {
    super();

    this.consumeContext(BACKCHAT_CONTEXT, (context) => {
      this.#context = context;
      this.#observeChannel();
    });

    this.consumeContext(UMB_CURRENT_USER_CONTEXT, (context) => {
      if (!context) return;
      this.observe(context.unique, (unique) => (this._currentUserKey = unique), "_currentUserKey");
    });
  }

  override willUpdate(changed: PropertyValues) {
    if (changed.has("channel")) this.#observeChannel();
  }

  override updated(changed: PropertyValues) {
    // Keep the newest message in view
    if (changed.has("_messages") && this._messagesElement) {
      this._messagesElement.scrollTop = this._messagesElement.scrollHeight;
    }
  }

  #observeChannel() {
    if (!this.#context || !this.channel) return;

    this.#context.joinChannel(this.channel);

    // The alias replaces the previous subscription when the channel changes
    this.observe(
      this.#context.messagesOf(this.channel),
      (messages) => (this._messages = messages),
      "_messages"
    );
  }

  override render() {
    return html`
      <div class="layout">
        <div class="messages">
          ${this._messages.length === 0
            ? html`<p class="empty">${this.localize.term("backchat_empty")}</p>`
            : repeat(
                this._messages,
                (m) => m.key,
                (m) => html`<backchat-chat-bubble
                  .message=${m}
                  .isCurrentUser=${!!m.userKey && m.userKey === this._currentUserKey}
                ></backchat-chat-bubble>`
              )}
        </div>
        <backchat-chat-input-box .channel=${this.channel}></backchat-chat-input-box>
      </div>
    `;
  }

  static override styles = css`
    :host {
      display: block;
      height: 100%;
    }

    .layout {
      display: flex;
      flex-direction: column;
      gap: var(--uui-size-space-3);
      height: 100%;
    }

    .messages {
      flex: 1 1 0;
      min-height: 0;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--uui-size-space-3);
    }

    .empty {
      color: var(--uui-color-text-alt);
      margin: auto;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "backchat-chat-messages": BackChatChatMessagesElement;
  }
}
