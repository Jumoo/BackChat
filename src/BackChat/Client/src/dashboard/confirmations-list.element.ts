import { customElement, html } from "@umbraco-cms/backoffice/external/lit";
import { BACKCHAT_CONTEXT } from "../global/backchat.context.token";
import type { BackChatContext } from "../global/backchat.context";
import type { ChatMessage, Mentionables } from "../signalR/types";
import { BackChatTimeOptions } from "../constants";
import { toPlainText } from "../mentions/mentions";
import { BackChatDashboardListBase } from "./dashboard-list-base";

// Messages waiting for the user to confirm they've read them. Held by the global context,
// which already has them all, so this list pages through that rather than the API.
@customElement("backchat-dashboard-confirmations")
export class BackChatDashboardConfirmationsElement extends BackChatDashboardListBase<ChatMessage> {
  protected headline = "#backchat_dashboardConfirmations";
  protected emptyText = "backchat_dashboardNoConfirmations";

  #context?: BackChatContext;
  #pending: ChatMessage[] = [];
  #mentionables: Mentionables = { users: [], groups: [] };

  constructor() {
    super();
    this.consumeContext(BACKCHAT_CONTEXT, (context) => {
      this.#context = context;
      if (!context) return;
      this.observe(context.mentionables, (m) => (this.#mentionables = m));
      this.observe(context.pending, (pending) => {
        this.#pending = pending;
        this.reload();
      });
    });
  }

  protected async loadPage(skip: number, take: number) {
    return { items: this.#pending.slice(skip, skip + take), total: this.#pending.length };
  }

  protected renderItem(message: ChatMessage) {
    return html`<div class="row">
      <uui-icon name=${message.important ? "icon-alert" : "icon-message"}></uui-icon>
      <span class="text">
        <span class="title">${message.userName}</span>
        <span class="detail">${toPlainText(message.message, this.#mentionables)}</span>
        <span class="detail">${this.localize.date(message.date, BackChatTimeOptions)}</span>
      </span>
      <uui-button
        look="primary"
        color="positive"
        compact
        label=${this.localize.term("backchat_confirmRead")}
        @click=${() => this.#context?.confirm(message.key)}
      ></uui-button>
    </div>`;
  }
}

export { BackChatDashboardConfirmationsElement as element };
