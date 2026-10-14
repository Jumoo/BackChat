import { css, customElement, html, nothing, property } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import type { ChatMessage } from "../signalR/types";
import { BackChatTimeOptions } from "../constants";

@customElement("backchat-chat-bubble")
export class BackChatChatBubbleElement extends UmbLitElement {
  @property({ type: Object })
  message?: ChatMessage;

  @property({ type: Boolean })
  isCurrentUser = false;

  override render() {
    if (!this.message) return nothing;

    return html`
      <div class="bubble ${this.isCurrentUser ? "current-user" : ""}">
        <div class="body">${this.message.message}</div>
        <div class="meta">
          ${this.message.userName}
          (${this.localize.date(this.message.date, BackChatTimeOptions)})
        </div>
      </div>
    `;
  }

  static override styles = css`
    .bubble {
      padding-right: 25%;
    }

    .bubble.current-user {
      padding-left: 25%;
      padding-right: 0;
    }

    .body {
      background-color: var(--uui-color-surface-alt);
      padding: var(--uui-size-space-3);
      border: 1px solid var(--uui-color-border);
      border-radius: var(--uui-border-radius);
      white-space: pre-wrap;
      word-break: break-word;
    }

    .current-user .body {
      background-color: var(--uui-color-selected);
      color: var(--uui-color-selected-contrast);
    }

    .meta {
      font-size: small;
      font-style: italic;
      color: var(--uui-color-text-alt);
      text-align: right;
      margin-top: var(--uui-size-space-1);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "backchat-chat-bubble": BackChatChatBubbleElement;
  }
}
