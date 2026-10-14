import { css, customElement, html, nothing, property } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import type { ChatMessage } from "../signalR/types";
import { BackChatTimeOptions } from "../constants";

@customElement("backchat-chat-bubble")
export class BackChatChatBubbleElement extends UmbLitElement {
  @property({ type: Object })
  message?: ChatMessage;

  // Reflected so the host can line itself up on the sender's side
  @property({ type: Boolean, reflect: true, attribute: "current-user" })
  isCurrentUser = false;

  override render() {
    if (!this.message) return nothing;

    return html`
      <div class="body">${this.message.message}</div>
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
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "backchat-chat-bubble": BackChatChatBubbleElement;
  }
}
