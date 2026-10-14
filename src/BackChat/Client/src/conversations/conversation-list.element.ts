import { css, customElement, html, nothing, repeat, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_CURRENT_USER_CONTEXT } from "@umbraco-cms/backoffice/current-user";
import { BACKCHAT_CONTEXT } from "../global/backchat.context.token";
import type { Conversation, Mentionables, UnreadCount } from "../signalR/types";
import { BackChatTimeOptions, formatBadgeCount } from "../constants";
import { toPlainText } from "../mentions/mentions";
import { conversationIcon, conversationTitle } from "./conversation-title";

export class BackChatOpenConversationEvent extends Event {
  constructor(public readonly conversation: Conversation) {
    super("open-conversation", { bubbles: true, composed: true });
  }
}

// The header chat's list: global, then the user's conversations, newest activity first
@customElement("backchat-conversation-list")
export class BackChatConversationListElement extends UmbLitElement {
  @state()
  private _conversations: Conversation[] = [];

  @state()
  private _unread: UnreadCount[] = [];

  @state()
  private _mentionables: Mentionables = { users: [], groups: [] };

  @state()
  private _currentUserKey?: string;

  constructor() {
    super();

    this.consumeContext(BACKCHAT_CONTEXT, (context) => {
      if (!context) return;
      context.loadConversations();
      this.observe(context.conversations, (c) => (this._conversations = c), "_conversations");
      this.observe(context.unread, (u) => (this._unread = u), "_unread");
      this.observe(context.mentionables, (m) => (this._mentionables = m), "_mentionables");
    });

    this.consumeContext(UMB_CURRENT_USER_CONTEXT, (context) => {
      if (!context) return;
      this.observe(context.unique, (unique) => (this._currentUserKey = unique), "_currentUserKey");
    });
  }

  #renderBadge(conversation: Conversation) {
    const count = this._unread.find((u) => u.channel === conversation.channel);
    if (!count) return nothing;

    return html`<uui-badge
      class="badge"
      color=${count.mentions > 0 ? "danger" : "default"}
      label=${this.localize.term("backchat_unreadCount", count.unread)}
      >${formatBadgeCount(count.unread)}</uui-badge
    >`;
  }

  #renderConversation(conversation: Conversation) {
    const title = conversationTitle(conversation, this._mentionables, this._currentUserKey, (k) =>
      this.localize.term(k)
    );
    const latest = conversation.latest;
    const unread = this._unread.some((u) => u.channel === conversation.channel);

    return html`
      <li>
        <button
          class=${unread ? "unread" : ""}
          @click=${() => this.dispatchEvent(new BackChatOpenConversationEvent(conversation))}
        >
          <uui-icon name=${conversationIcon(conversation)}></uui-icon>
          <span class="text">
            <span class="title">${title}</span>
            <span class="preview">
              ${latest
                ? `${latest.userName}: ${toPlainText(latest.message, this._mentionables)}`
                : this.localize.term("backchat_noMessages")}
            </span>
          </span>
          <span class="side">
            ${latest ? html`<span class="time">${this.localize.date(latest.date, BackChatTimeOptions)}</span>` : nothing}
            ${this.#renderBadge(conversation)}
          </span>
        </button>
      </li>
    `;
  }

  override render() {
    return html`<ul>
      ${repeat(
        this._conversations,
        (c) => c.channel,
        (c) => this.#renderConversation(c)
      )}
    </ul>`;
  }

  static override styles = css`
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    li + li {
      border-top: 1px solid var(--uui-color-divider);
    }

    button {
      display: flex;
      align-items: center;
      gap: var(--uui-size-space-3);
      width: 100%;
      padding: var(--uui-size-space-3) var(--uui-size-space-2);
      border: none;
      background: none;
      font: inherit;
      color: inherit;
      text-align: left;
      cursor: pointer;
      border-radius: var(--uui-border-radius);
    }

    button:hover,
    button:focus-visible {
      background-color: var(--uui-color-surface-emphasis);
    }

    uui-icon {
      flex: none;
      font-size: 1.25em;
    }

    .text {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1 1 auto;
    }

    .title,
    .preview {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .unread .title {
      font-weight: 700;
    }

    .preview,
    .time {
      color: var(--uui-color-text-alt);
      font-size: var(--uui-type-small-size);
    }

    .side {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--uui-size-space-1);
      flex: none;
    }

    .badge {
      position: static;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "backchat-conversation-list": BackChatConversationListElement;
  }
}
