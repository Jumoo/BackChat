import { customElement, html, nothing } from "@umbraco-cms/backoffice/external/lit";
import { BACKCHAT_CONTEXT } from "../global/backchat.context.token";
import type { Mentionables } from "../signalR/types";
import { Tasks, type TaskResponseModel } from "../api";
import { openDocumentComms } from "../comms/open-comms";
import { BackChatDashboardListBase } from "./dashboard-list-base";

const DateOptions: Intl.DateTimeFormatOptions = { dateStyle: "medium" };

// Open tasks: the user's own, soonest due first, or everyone's in the everything view
@customElement("backchat-dashboard-tasks")
export class BackChatDashboardTasksElement extends BackChatDashboardListBase<TaskResponseModel> {
  protected headline = "#backchat_dashboardTasks";
  protected icon = "icon-checkbox";
  protected emptyText = "backchat_dashboardNoTasks";

  #mentionables: Mentionables = { users: [], groups: [] };

  constructor() {
    super();
    this.consumeContext(BACKCHAT_CONTEXT, (context) => {
      if (!context) return;
      this.observe(context.mentionables, (m) => {
        this.#mentionables = m;
        this.requestUpdate();
      });
      // A task changing anywhere can change this list
      this.observe(context.tasksChanged, (change) => change && this.reload());
    });
  }

  protected async loadPage(skip: number, take: number) {
    const { data } = await Tasks.getOpenTasks({ query: { everyone: this.everyone, skip, take } });
    return { items: data?.items ?? [], total: data?.total ?? 0 };
  }

  #detail(task: TaskResponseModel) {
    const assignee = this.everyone ? this.#mentionables.users.find((u) => u.key === task.assigneeKey)?.name : undefined;
    return [task.documentName, assignee].filter(Boolean).join(" · ");
  }

  protected renderItem(task: TaskResponseModel) {
    const overdue = !!task.dueDate && new Date(task.dueDate) < new Date();

    return html`<uui-ref-node name=${task.title} detail=${this.#detail(task)} @open=${() => openDocumentComms(task.documentKey)}>
      <umb-icon slot="icon" name="icon-checkbox-empty"></umb-icon>
      ${task.dueDate
        ? html`<uui-tag slot="tag" look=${overdue ? "primary" : "secondary"} color=${overdue ? "danger" : "default"}><span class="tag-content">${overdue ? html`<umb-icon name="icon-alert"></umb-icon>` : html`<umb-icon name="icon-calendar"></umb-icon>`}
            ${this.localize.date(task.dueDate, DateOptions)}</span></uui-tag>`
        : nothing}
    </uui-ref-node>`;
  }
}

export { BackChatDashboardTasksElement as element };
