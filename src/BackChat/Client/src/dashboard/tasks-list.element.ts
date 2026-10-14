import { customElement, html, nothing } from "@umbraco-cms/backoffice/external/lit";
import { BACKCHAT_CONTEXT } from "../global/backchat.context.token";
import type { Mentionables } from "../signalR/types";
import { Tasks, type TaskResponseModel } from "../api";
import { openDocumentComms } from "../comms/open-comms";
import { BackChatDashboardListBase } from "./dashboard-list-base";

// Open tasks: the user's own, soonest due first, or everyone's in the everything view
@customElement("backchat-dashboard-tasks")
export class BackChatDashboardTasksElement extends BackChatDashboardListBase<TaskResponseModel> {
  protected headline = "#backchat_dashboardTasks";
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

  protected renderItem(task: TaskResponseModel) {
    const overdue = !!task.dueDate && new Date(task.dueDate) < new Date();
    const assignee = this.#mentionables.users.find((u) => u.key === task.assigneeKey)?.name;

    return html`<button class="row" @click=${() => openDocumentComms(task.documentKey)}>
      <uui-icon name="icon-check"></uui-icon>
      <span class="text">
        <span class="title">${task.title}</span>
        <span class="detail">
          ${task.documentName}${this.everyone && assignee ? html` · ${assignee}` : nothing}
          ${task.dueDate
            ? html` · <span class=${overdue ? "overdue" : ""}
                  >${this.localize.term("backchat_due", this.localize.date(task.dueDate, { dateStyle: "medium" }))}</span
                >`
            : nothing}
        </span>
      </span>
    </button>`;
  }
}

export { BackChatDashboardTasksElement as element };
