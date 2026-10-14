import { customElement, html } from "@umbraco-cms/backoffice/external/lit";
import { Mentions, type UnreadMention } from "../api";
import { BACKCHAT_CONTEXT } from "../global/backchat.context.token";
import type { ChatMessage, Mentionables } from "../signalR/types";
import { BackChatTimeOptions } from "../constants";
import { toPlainText } from "../mentions/mentions";
import { activityText, isActivity } from "../activity/activity";
import { BackChatDashboardListBase } from "./dashboard-list-base";
import { openChannel } from "./open-conversation";

// Mentions the user hasn't read. Always the user's own, even in the everything view.
@customElement("backchat-dashboard-mentions")
export class BackChatDashboardMentionsElement extends BackChatDashboardListBase<UnreadMention> {
  protected headline = "#backchat_dashboardMentions";
  protected emptyText = "backchat_dashboardNoMentions";

  #mentionables: Mentionables = { users: [], groups: [] };

  constructor() {
    super();
    this.consumeContext(BACKCHAT_CONTEXT, (context) => {
      if (!context) return;
      this.observe(context.mentionables, (m) => {
        this.#mentionables = m;
        this.requestUpdate();
      });
      // Reading a chat clears its mentions, so follow the unread counts
      this.observe(context.totalMentions, () => this.reload());
    });
  }

  protected async loadPage(skip: number, take: number) {
    const { data } = await Mentions.getUnreadMentions({ query: { skip, take } });
    return { items: data?.items ?? [], total: data?.total ?? 0 };
  }

  #where(mention: UnreadMention) {
    if (mention.kind === "Global") return this.localize.term("backchat_globalChannel");
    if (mention.kind === "Direct") return this.localize.term("backchat_directConversation");
    return mention.title ?? "";
  }

  protected renderItem(mention: UnreadMention) {
    const asMessage = mention as unknown as ChatMessage;
    const text = isActivity(asMessage)
      ? activityText(asMessage, (k, ...a) => this.localize.term(k, ...a))
      : `${mention.userName}: ${toPlainText(mention.message, this.#mentionables)}`;

    return html`<button class="row" @click=${() => openChannel(this, mention.channel, mention.kind, mention.title)}>
      <uui-icon name="icon-chat"></uui-icon>
      <span class="text">
        <span class="title">${this.#where(mention)}</span>
        <span class="detail">${text}</span>
        <span class="detail">${this.localize.date(mention.date, BackChatTimeOptions)}</span>
      </span>
    </button>`;
  }
}

export { BackChatDashboardMentionsElement as element };
