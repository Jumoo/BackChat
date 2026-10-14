import { css, customElement, html, nothing, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_DOCUMENT_WORKSPACE_CONTEXT } from "@umbraco-cms/backoffice/document";
import { UMB_NOTIFICATION_CONTEXT } from "@umbraco-cms/backoffice/notification";
import { Reviews, type ReviewState } from "../../api";
import "../comms-app-layout.element";

const DateOptions: Intl.DateTimeFormatOptions = { dateStyle: "medium" };

// When the document should next be reviewed, where that date came from, a way to mark it
// reviewed, and the reviews so far
@customElement("backchat-review-comms-app")
export class BackChatReviewCommsAppElement extends UmbLitElement {
  @state()
  private _documentKey?: string | null;

  @state()
  private _isNew?: boolean;

  @state()
  private _state?: ReviewState;

  @state()
  private _date = "";

  @state()
  private _note = "";

  @state()
  private _busy = false;

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
  }

  async #load() {
    if (!this._documentKey) return;
    try {
      const { data } = await Reviews.getReview({ path: { documentKey: this._documentKey } });
      this._state = data;
      this._date = data?.nextReview ? data.nextReview.substring(0, 10) : "";
    } catch {
      // No access, or a document the server doesn't have yet
      this._state = undefined;
    }
  }

  async #run(action: () => Promise<unknown>) {
    this._busy = true;
    try {
      await action();
      await this.#load();
    } catch (error) {
      console.error("BackChat: review change failed", error);
      const notifications = await this.getContext(UMB_NOTIFICATION_CONTEXT);
      notifications?.peek("danger", { data: { message: this.localize.term("backchat_reviewFailed") } });
    } finally {
      this._busy = false;
    }
  }

  #setDate(date: string | null) {
    const documentKey = this._documentKey;
    if (!documentKey) return;
    this.#run(() =>
      Reviews.setReviewDate({
        path: { documentKey },
        body: { date: date ? new Date(`${date}T00:00:00Z`).toISOString() : null },
      })
    );
  }

  #markReviewed() {
    const documentKey = this._documentKey;
    if (!documentKey) return;
    const note = this._note;
    this.#run(async () => {
      await Reviews.markReviewed({ path: { documentKey }, body: { note: note || null } });
      this._note = "";
    });
  }

  #renderSource(state: ReviewState) {
    if (state.setManually) return this.localize.term("backchat_reviewSetManually");
    if (state.rule) {
      return this.localize.term(
        state.rule.fromPublish ? "backchat_reviewRuleFromPublish" : "backchat_reviewRuleFromReview",
        state.rule.intervalMonths
      );
    }
    return nothing;
  }

  #renderNext(state: ReviewState) {
    if (!state.nextReview) return html`<p class="next">${this.localize.term("backchat_reviewNone")}</p>`;

    const overdue = new Date(state.nextReview) <= new Date();
    return html`<p class="next ${overdue ? "overdue" : ""}">
      ${overdue ? html`<uui-icon name="icon-alert"></uui-icon>` : nothing}
      ${this.localize.term(overdue ? "backchat_reviewOverdue" : "backchat_reviewBy", this.localize.date(state.nextReview, DateOptions))}
    </p>`;
  }

  override render() {
    const state = this._state;

    return html`
      <backchat-comms-app-layout headline="#backchat_review">
        ${this._isNew !== false || !state
          ? html`<p class="hint">${this.localize.term("backchat_saveToStart")}</p>`
          : html`
              ${this.#renderNext(state)}
              <p class="hint">${this.#renderSource(state)}</p>

              <div class="row">
                <uui-input
                  type="date"
                  label=${this.localize.term("backchat_reviewDate")}
                  .value=${this._date}
                  @change=${(e: Event) => (this._date = (e.target as HTMLInputElement).value)}
                ></uui-input>
                <uui-button
                  look="secondary"
                  label=${this.localize.term("backchat_reviewSetDate")}
                  ?disabled=${!this._date || this._busy}
                  @click=${() => this.#setDate(this._date)}
                ></uui-button>
                ${state.setManually
                  ? html`<uui-button
                      label=${this.localize.term("backchat_reviewUseRule")}
                      ?disabled=${this._busy}
                      @click=${() => this.#setDate(null)}
                    ></uui-button>`
                  : nothing}
              </div>

              <uui-textarea
                label=${this.localize.term("backchat_reviewNote")}
                placeholder=${this.localize.term("backchat_reviewNote")}
                maxlength="1000"
                .value=${this._note}
                @input=${(e: Event) => (this._note = (e.target as HTMLTextAreaElement).value)}
              ></uui-textarea>
              <uui-button
                look="primary"
                color="positive"
                label=${this.localize.term("backchat_markReviewed")}
                .state=${this._busy ? "waiting" : undefined}
                @click=${this.#markReviewed}
              ></uui-button>

              ${state.history.length
                ? html`<h4>${this.localize.term("backchat_reviewHistory")}</h4>
                    <ul>
                      ${state.history.map(
                        (h) => html`<li>
                          <span class="who">${h.reviewedByName}</span>
                          <span class="when">${this.localize.date(h.date, DateOptions)}</span>
                          ${h.note ? html`<span class="note">${h.note}</span>` : nothing}
                        </li>`
                      )}
                    </ul>`
                : nothing}
            `}
      </backchat-comms-app-layout>
    `;
  }

  static override styles = css`
    .next {
      margin: 0;
      font-weight: 700;
    }

    .next.overdue {
      color: var(--uui-color-danger-standalone);
    }

    .hint {
      margin: var(--uui-size-space-1) 0 var(--uui-size-space-3);
      color: var(--uui-color-text-alt);
      font-size: var(--uui-type-small-size);
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--uui-size-space-2);
      margin-bottom: var(--uui-size-space-3);
    }

    uui-textarea {
      width: 100%;
      margin-bottom: var(--uui-size-space-2);
    }

    h4 {
      margin: var(--uui-size-space-5) 0 var(--uui-size-space-2);
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    li {
      display: flex;
      flex-wrap: wrap;
      gap: 0 var(--uui-size-space-2);
      padding: var(--uui-size-space-2) 0;
      border-bottom: 1px solid var(--uui-color-divider);
    }

    .who {
      font-weight: 700;
    }

    .when {
      color: var(--uui-color-text-alt);
    }

    .note {
      flex-basis: 100%;
      white-space: pre-wrap;
    }
  `;
}

export { BackChatReviewCommsAppElement as element };

declare global {
  interface HTMLElementTagNameMap {
    "backchat-review-comms-app": BackChatReviewCommsAppElement;
  }
}
