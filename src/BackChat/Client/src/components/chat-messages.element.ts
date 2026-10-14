import { css, customElement, html, property, repeat, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_CURRENT_USER_CONTEXT, type UmbCurrentUserModel } from "@umbraco-cms/backoffice/current-user";
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
  private _currentUser?: UmbCurrentUserModel;

  #context?: BackChatContext;
  #subscribedChannel?: string;

  constructor() {
    super();

    this.consumeContext(BACKCHAT_CONTEXT, (context) => {
      this.#context = context;
      this.#subscribe();
    });

    this.consumeContext(UMB_CURRENT_USER_CONTEXT, (context) => {
      if (!context) return;
      this.observe(context.currentUser, (user) => (this._currentUser = user));
    });
  }

  override willUpdate(changed: Map<string, unknown>) {
    if (changed.has("channel")) this.#subscribe();
  }

  #subscribe() {
    if (!this.#context || !this.channel || this.#subscribedChannel === this.channel) return;

    this.#subscribedChannel = this.channel;
    this.#context.joinChannel(this.channel);
    this.observe(this.#context.messagesOf(this.channel), (messages) => {
      this._messages = messages;
    });
  }

  override render() {
    return html`
      <div class="layout">
        <div class="messages">
          ${repeat(
            this._messages,
            (m) => m.key,
            (m) => html`<backchat-chat-bubble
              .message=${m}
              .isCurrentUser=${this._currentUser?.name === m.userName}
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
      flex-grow: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--uui-size-space-3);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "backchat-chat-messages": BackChatChatMessagesElement;
  }
}
