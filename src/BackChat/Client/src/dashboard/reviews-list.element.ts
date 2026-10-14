import { customElement, html } from "@umbraco-cms/backoffice/external/lit";
import { Reviews, type DueReview } from "../api";
import { openDocumentComms } from "../comms/open-comms";
import { BackChatDashboardListBase } from "./dashboard-list-base";

// Content due or overdue for review: what the user edited last, or everything
@customElement("backchat-dashboard-reviews")
export class BackChatDashboardReviewsElement extends BackChatDashboardListBase<DueReview> {
  protected headline = "#backchat_dashboardReviews";
  protected emptyText = "backchat_dashboardNoReviews";

  protected async loadPage(skip: number, take: number) {
    const { data } = await Reviews.getDueReviews({ query: { everyone: this.everyone, skip, take } });
    return { items: data?.items ?? [], total: data?.total ?? 0 };
  }

  protected renderItem(review: DueReview) {
    return html`<button class="row" @click=${() => openDocumentComms(review.documentKey)}>
      <uui-icon name="icon-calendar"></uui-icon>
      <span class="text">
        <span class="title">${review.documentName}</span>
        <span class="detail overdue">
          ${this.localize.term("backchat_reviewOverdue", this.localize.date(review.nextReview, { dateStyle: "medium" }))}
        </span>
      </span>
    </button>`;
  }
}

export { BackChatDashboardReviewsElement as element };
