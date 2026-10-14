import { css, customElement, html, nothing, repeat, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_DOCUMENT_WORKSPACE_CONTEXT } from "@umbraco-cms/backoffice/document";
import { UMB_NOTIFICATION_CONTEXT } from "@umbraco-cms/backoffice/notification";
import { BACKCHAT_CONTEXT } from "../../global/backchat.context.token";
import type { BackChatContext } from "../../global/backchat.context";
import type { Mentionables } from "../../signalR/types";
import { Tasks, type TaskResponseModel } from "../../api";
import "../comms-app-layout.element";

interface TaskDraft {
  title: string;
  assigneeKey: string;
  dueDate: string;
}

const toDateInput = (date?: string | null) => (date ? date.substring(0, 10) : "");
const fromDateInput = (value: string) => (value ? new Date(`${value}T00:00:00Z`).toISOString() : null);

// A short to-do list for the document. Anyone who can update the document can change it;
// open tabs refresh when anyone does.
@customElement("backchat-tasks-comms-app")
export class BackChatTasksCommsAppElement extends UmbLitElement {
  @state()
  private _documentKey?: string | null;

  @state()
  private _isNew?: boolean;

  @state()
  private _tasks: TaskResponseModel[] = [];

  @state()
  private _mentionables: Mentionables = { users: [], groups: [] };

  @state()
  private _newTitle = "";

  // The task being edited, and its edits so far
  @state()
  private _editing?: string;

  @state()
  private _draft: TaskDraft = { title: "", assigneeKey: "", dueDate: "" };

  #context?: BackChatContext;

  constructor() {
    super();

    this.consumeContext(UMB_DOCUMENT_WORKSPACE_CONTEXT, (context) => {
      if (!context) return;
      this.observe(
        context.unique,
        (unique) => {
          this._documentKey = unique;
          this.#load();
        },
        "_unique"
      );
      this.observe(context.isNew, (isNew) => (this._isNew = isNew), "_isNew");
    });

    this.consumeContext(BACKCHAT_CONTEXT, (context) => {
      this.#context = context;
      if (!context) return;
      this.observe(context.mentionables, (m) => (this._mentionables = m), "_mentionables");
      this.observe(
        context.tasksChanged,
        (change) => {
          if (change && change.documentKey === this._documentKey) this.#load();
        },
        "_tasksChanged"
      );
      this.#load();
    });
  }

  get #canUse() {
    return !!this._documentKey && this._isNew === false;
  }

  async #load() {
    if (!this._documentKey || !this.#context) return;

    // Live updates come through the document's channel
    this.#context.joinChannel(this._documentKey);

    try {
      const { data } = await Tasks.getTasks({ path: { documentKey: this._documentKey } });
      this._tasks = data ?? [];
    } catch (error) {
      // No access, or a new document the server doesn't know yet
      this._tasks = [];
      console.warn("BackChat: could not load tasks", error);
    }
  }

  async #run(action: () => Promise<unknown>) {
    try {
      await action();
      await this.#load();
    } catch (error) {
      console.error("BackChat: task change failed", error);
      const notifications = await this.getContext(UMB_NOTIFICATION_CONTEXT);
      notifications?.peek("danger", { data: { message: this.localize.term("backchat_taskFailed") } });
    }
  }

  #add() {
    const title = this._newTitle.trim();
    if (!title || !this._documentKey) return;

    const documentKey = this._documentKey;
    this._newTitle = "";
    this.#run(() => Tasks.createTask({ path: { documentKey }, body: { title } }));
  }

  #update(task: TaskResponseModel, changes: Partial<TaskResponseModel>) {
    const next = { ...task, ...changes };
    return this.#run(() =>
      Tasks.updateTask({
        path: { key: task.key },
        body: {
          title: next.title,
          assigneeKey: next.assigneeKey || null,
          dueDate: next.dueDate || null,
          isComplete: next.isComplete,
        },
      })
    );
  }

  #move(index: number, offset: number) {
    const keys = this._tasks.map((t) => t.key);
    const target = index + offset;
    if (!this._documentKey || target < 0 || target >= keys.length) return;

    [keys[index], keys[target]] = [keys[target], keys[index]];
    const documentKey = this._documentKey;
    this.#run(() => Tasks.sortTasks({ path: { documentKey }, body: { keys } }));
  }

  #startEdit(task: TaskResponseModel) {
    this._editing = task.key;
    this._draft = {
      title: task.title,
      assigneeKey: task.assigneeKey ?? "",
      dueDate: toDateInput(task.dueDate),
    };
  }

  async #saveEdit(task: TaskResponseModel) {
    if (!this._draft.title.trim()) return;
    this._editing = undefined;
    await this.#update(task, {
      title: this._draft.title.trim(),
      assigneeKey: this._draft.assigneeKey || null,
      dueDate: fromDateInput(this._draft.dueDate),
    });
  }

  #userName(key?: string | null) {
    return key ? (this._mentionables.users.find((u) => u.key === key)?.name ?? "") : "";
  }

  #renderEditor(task: TaskResponseModel) {
    const options = [
      { name: this.localize.term("backchat_taskNobody"), value: "", selected: !this._draft.assigneeKey },
      ...this._mentionables.users.map((u) => ({ name: u.name, value: u.key, selected: u.key === this._draft.assigneeKey })),
    ];

    return html`
      <li class="editor">
        <uui-input
          label=${this.localize.term("backchat_taskTitle")}
          .value=${this._draft.title}
          maxlength="255"
          @input=${(e: Event) => (this._draft = { ...this._draft, title: (e.target as HTMLInputElement).value })}
        ></uui-input>
        <uui-select
          label=${this.localize.term("backchat_taskAssignee")}
          .options=${options}
          @change=${(e: Event) => (this._draft = { ...this._draft, assigneeKey: (e.target as HTMLSelectElement).value })}
        ></uui-select>
        <uui-input
          type="date"
          label=${this.localize.term("backchat_taskDue")}
          .value=${this._draft.dueDate}
          @change=${(e: Event) => (this._draft = { ...this._draft, dueDate: (e.target as HTMLInputElement).value })}
        ></uui-input>
        <div class="buttons">
          <uui-button label=${this.localize.term("backchat_cancel")} @click=${() => (this._editing = undefined)}></uui-button>
          <uui-button look="primary" label=${this.localize.term("backchat_save")} @click=${() => this.#saveEdit(task)}></uui-button>
        </div>
      </li>
    `;
  }

  #renderTask(task: TaskResponseModel, index: number) {
    if (this._editing === task.key) return this.#renderEditor(task);

    const overdue = !task.isComplete && !!task.dueDate && new Date(task.dueDate) < new Date();
    const assignee = this.#userName(task.assigneeKey);

    return html`
      <li class=${task.isComplete ? "done" : ""}>
        <!-- aria-label, not label: the title is shown beside it as the edit button -->
        <uui-checkbox
          aria-label=${task.title}
          ?checked=${task.isComplete}
          @change=${(e: Event) => this.#update(task, { isComplete: (e.target as HTMLInputElement).checked })}
        ></uui-checkbox>
        <button class="text" @click=${() => this.#startEdit(task)} title=${this.localize.term("backchat_taskEdit")}>
          <span class="title">${task.title}</span>
          ${assignee || task.dueDate
            ? html`<span class="details">
                ${task.dueDate
                  ? html`<uui-tag look=${overdue ? "primary" : "secondary"} color=${overdue ? "danger" : "default"}><span class="tag-content"><umb-icon name=${overdue ? "icon-alert" : "icon-calendar"}></umb-icon>
                      ${this.localize.date(task.dueDate, { dateStyle: "medium" })}</span></uui-tag>`
                  : nothing}
                ${assignee ? html`<span class="assignee"><umb-icon name="icon-user"></umb-icon> ${assignee}</span>` : nothing}
              </span>`
            : nothing}
        </button>
        <uui-action-bar class="row-actions">
          <uui-button compact label=${this.localize.term("backchat_moveUp")} ?disabled=${index === 0} @click=${() => this.#move(index, -1)}>
            <uui-icon name="icon-arrow-up"></uui-icon>
          </uui-button>
          <uui-button
            compact
            label=${this.localize.term("backchat_moveDown")}
            ?disabled=${index === this._tasks.length - 1}
            @click=${() => this.#move(index, 1)}
          >
            <uui-icon name="icon-arrow-down"></uui-icon>
          </uui-button>
          <uui-button
            compact
            color="danger"
            label=${this.localize.term("backchat_delete")}
            @click=${() => this.#run(() => Tasks.deleteTask({ path: { key: task.key } }))}
          >
            <uui-icon name="icon-trash"></uui-icon>
          </uui-button>
        </uui-action-bar>
      </li>
    `;
  }

  override render() {
    return html`
      <backchat-comms-app-layout
        headline="#backchat_tasks"
        icon="icon-checkbox"
        .count=${this._tasks.filter((t) => !t.isComplete).length}
      >
        ${this.#canUse
          ? html`
              ${this._tasks.length === 0
                ? html`<p class="empty"><umb-icon name="icon-check"></umb-icon> ${this.localize.term("backchat_noTasks")}</p>`
                : nothing}
              <ul>
                ${repeat(
                  this._tasks,
                  (t) => t.key,
                  (t, i) => this.#renderTask(t, i)
                )}
              </ul>
              <uui-input
                class="add"
                label=${this.localize.term("backchat_addTask")}
                placeholder=${this.localize.term("backchat_addTask")}
                maxlength="255"
                .value=${this._newTitle}
                @input=${(e: Event) => (this._newTitle = (e.target as HTMLInputElement).value)}
                @keydown=${(e: KeyboardEvent) => e.key === "Enter" && this.#add()}
              >
                <uui-button slot="append" compact label=${this.localize.term("backchat_add")} @click=${this.#add}>
                  <uui-icon name="icon-add"></uui-icon>
                </uui-button>
              </uui-input>
            `
          : html`<p class="empty">${this.localize.term("backchat_saveToStart")}</p>`}
      </backchat-comms-app-layout>
    `;
  }

  static override styles = css`
    /* Icon and text side by side inside a tag */
    .tag-content {
      display: inline-flex;
      align-items: center;
      gap: var(--uui-size-space-1);
      white-space: nowrap;
    }
    ul {
      list-style: none;
      margin: 0 0 var(--uui-size-space-3);
      padding: 0;
    }

    li {
      display: flex;
      align-items: center;
      gap: var(--uui-size-space-3);
      padding: var(--uui-size-space-3) 0;
      border-bottom: 1px solid var(--uui-color-divider);
    }

    li.editor {
      flex-direction: column;
      align-items: stretch;
    }

    .text {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      gap: var(--uui-size-space-1);
      min-width: 0;
      padding: 0;
      border: none;
      background: none;
      font: inherit;
      color: inherit;
      text-align: left;
      cursor: pointer;
    }

    .title {
      overflow-wrap: anywhere;
    }

    li.done .title {
      text-decoration: line-through;
      color: var(--uui-color-text-alt);
    }

    .details {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--uui-size-space-2);
      color: var(--uui-color-text-alt);
      font-size: var(--uui-type-small-size);
    }

    .assignee {
      display: inline-flex;
      align-items: center;
      gap: var(--uui-size-space-1);
    }

    /* Row actions stay out of the way until the row is pointed at or focused */
    .row-actions {
      opacity: 0;
      transition: opacity 120ms;
    }

    li:hover .row-actions,
    li:focus-within .row-actions {
      opacity: 1;
    }

    .buttons {
      display: flex;
      justify-content: flex-end;
      gap: var(--uui-size-space-2);
    }

    .add,
    uui-select,
    li.editor uui-input {
      width: 100%;
    }

    .empty {
      display: flex;
      align-items: center;
      gap: var(--uui-size-space-2);
      margin: 0 0 var(--uui-size-space-4);
      color: var(--uui-color-text-alt);
    }

    .empty umb-icon {
      color: var(--uui-color-positive-standalone);
    }
  `;
}

export { BackChatTasksCommsAppElement as element };

declare global {
  interface HTMLElementTagNameMap {
    "backchat-tasks-comms-app": BackChatTasksCommsAppElement;
  }
}
