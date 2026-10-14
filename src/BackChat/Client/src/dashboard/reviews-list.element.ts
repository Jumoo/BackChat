import { customElement, html } from "@umbraco-cms/backoffice/external/lit";
import { Reviews, type DueReview } from "../api";
import { openDocumentComms } from "../comms/open-comms";
import { BackChatDashboardListBase } from "./dashboard-list-base";

// Content due or overdue for review: what the user edited last, or everything
@customElement("backchat-dashboard-reviews")
export class BackChatDashboardReviewsElement extends BackChatDashboardListBase<DueReview> {
  protected headline = "#backchat_dashboardReviews";
  protected icon = "icon-calendar";
  protected emptyText = "backchat_dashboardNoReviews";

  protected async loadPage(skip: number, take: number) {
    const { data } = await Reviews.getDueReviews({ query: { everyone: this.everyone, skip, take } });
    return { items: data?.items ?? [], total: data?.total ?? 0 };
  }

  protected renderItem(review: DueReview) {
    return html`<uui-ref-node
      name=${review.documentName ?? ""}
      detail=${this.localize.term("backchat_reviewDueSince", this.localize.date(review.nextReview, { dateStyle: "medium" }))}
      @open=${() => openDocumentComms(review.documentKey)}
    >
      <umb-icon slot="icon" name="icon-document"></umb-icon>
      <uui-tag slot="tag" color="danger"><span class="tag-content"><umb-icon name="icon-alert"></umb-icon> ${this.localize.term("backchat_overdue")}</span></uui-tag>
    </uui-ref-node>`;
  }
}

export { BackChatDashboardReviewsElement as element };
