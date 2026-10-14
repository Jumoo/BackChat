import { css, customElement, html, nothing, property, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_CURRENT_USER_CONTEXT } from "@umbraco-cms/backoffice/current-user";
import type { ChatMessage, Mentionables } from "../signalR/types";
import { BackChatTimeOptions } from "../constants";
import { BACKCHAT_CONTEXT } from "../global/backchat.context.token";
import { parseMessage, type MessageSegment } from "../mentions/mentions";

@customElement("backchat-chat-bubble")
export class BackChatChatBubbleElement extends UmbLitElement {
  @property({ type: Object })
  message?: ChatMessage;

  // Reflected so the host can line itself up on the sender's side
  @property({ type: Boolean, reflect: true, attribute: "current-user" })
  isCurrentUser = false;

  @state()
  private _mentionables?: Mentionables;

  @state()
  private _userKey?: string;

  @state()
  private _groupKeys: string[] = [];

  constructor() {
    super();

    this.consumeContext(BACKCHAT_CONTEXT, (context) => {
      if (!context) return;
      this.observe(context.mentionables, (m) => (this._mentionables = m), "_mentionables");
    });

    this.consumeContext(UMB_CURRENT_USER_CONTEXT, (context) => {
      if (!context) return;
      this.observe(
        context.currentUser,
        (user) => {
          this._userKey = user?.unique;
          this._groupKeys = user?.userGroupUniques ?? [];
        },
        "_currentUser"
      );
    });
  }

  // A mention of you, or of a group you're in, is highlighted more strongly
  #isMe(segment: MessageSegment) {
    if (segment.kind === "user") return segment.key === this._userKey;
    if (segment.kind === "group") return !!segment.key && this._groupKeys.includes(segment.key);
    return false;
  }

  #renderSegment(segment: MessageSegment) {
    if (segment.kind === "text") return segment.text;
    return html`<span class="mention ${this.#isMe(segment) ? "me" : ""}">@${segment.name}</span>`;
  }

  override render() {
    if (!this.message) return nothing;

    return html`
      <div class="body">${parseMessage(this.message.message, this._mentionables).map((s) => this.#renderSegment(s))}</div>
      <div class="meta">
        <span class="name">${this.message.userName}</span>
        <span>${this.localize.date(this.message.date, BackChatTimeOptions)}</span>
      </div>
    `;
  }

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    :host([current-user]) {
      align-items: flex-end;
    }

    .body {
      max-width: 80%;
      padding: var(--uui-size-space-3) var(--uui-size-space-4);
      background-color: var(--uui-color-surface-alt);
      border: 1px solid var(--uui-color-border);
      border-radius: calc(var(--uui-border-radius) * 3);
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    :host([current-user]) .body {
      background-color: var(--uui-color-selected);
      border-color: var(--uui-color-selected);
      color: var(--uui-color-selected-contrast);
    }

    .meta {
      display: flex;
      gap: var(--uui-size-space-2);
      margin-top: var(--uui-size-space-1);
      color: var(--uui-color-text-alt);
      font-size: var(--uui-type-small-size);
    }

    .name {
      font-weight: 700;
    }

    .mention {
      font-weight: 700;
      color: var(--uui-color-interactive-emphasis);
    }

    :host([current-user]) .mention {
      color: inherit;
      text-decoration: underline;
    }

    .mention.me {
      padding: 0 var(--uui-size-space-1);
      border-radius: var(--uui-border-radius);
      background-color: var(--uui-color-warning);
      color: var(--uui-color-warning-contrast);
      text-decoration: none;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "backchat-chat-bubble": BackChatChatBubbleElement;
  }
}
