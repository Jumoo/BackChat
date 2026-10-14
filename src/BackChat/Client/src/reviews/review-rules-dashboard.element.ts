import { css, customElement, html, nothing, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_NOTIFICATION_CONTEXT } from "@umbraco-cms/backoffice/notification";
import { Reviews, type ReviewRule } from "../api";
import "../comms/comms-app-layout.element";

interface RuleDraft {
  id?: string;
  contentTypeKey: string;
  intervalMonths: number;
  fromPublish: boolean;
}

const emptyDraft = (): RuleDraft => ({ contentTypeKey: "", intervalMonths: 6, fromPublish: false });

// Rules that give content its review dates: one per content type, "every N months from the
// last review" or "from the last publish". In the Settings section, for users allowed to
// manage them.
@customElement("backchat-review-rules-dashboard")
export class BackChatReviewRulesDashboardElement extends UmbLitElement {
  @state()
  private _rules: ReviewRule[] = [];

  @state()
  private _draft?: RuleDraft;

  @state()
  private _busy = false;

  override connectedCallback() {
    super.connectedCallback();
    this.#load();
  }

  async #load() {
    const { data } = await Reviews.getReviewRules();
    this._rules = data ?? [];
  }

  async #save() {
    const draft = this._draft;
    if (!draft?.contentTypeKey || draft.intervalMonths < 1) return;

    const body = {
      contentTypeKey: draft.contentTypeKey,
      intervalMonths: draft.intervalMonths,
      fromPublish: draft.fromPublish,
    };

    this._busy = true;
    try {
      if (draft.id) {
        await Reviews.updateReviewRule({ path: { id: draft.id }, body });
      } else {
        await Reviews.createReviewRule({ body });
      }
      this._draft = undefined;
      await this.#load();
    } catch (error) {
      console.error("BackChat: could not save the rule", error);
      const notifications = await this.getContext(UMB_NOTIFICATION_CONTEXT);
      notifications?.peek("danger", { data: { message: this.localize.term("backchat_ruleFailed") } });
    } finally {
      this._busy = false;
    }
  }

  async #delete(rule: ReviewRule) {
    await Reviews.deleteReviewRule({ path: { id: rule.id } });
    await this.#load();
  }

  #renderEditor() {
    const draft = this._draft;
    if (!draft) return nothing;

    return html`
      <backchat-comms-app-layout headline=${draft.id ? "#backchat_editRule" : "#backchat_addRule"} icon="icon-edit">
        <umb-property-layout label=${this.localize.term("backchat_ruleContentType")} orientation="vertical">
          <umb-input-document-type
            slot="editor"
            document-types-only
            .max=${1}
            .selection=${draft.contentTypeKey ? [draft.contentTypeKey] : []}
            @change=${(e: Event) =>
              (this._draft = { ...draft, contentTypeKey: (e.target as unknown as { selection: string[] }).selection[0] ?? "" })}
          ></umb-input-document-type>
        </umb-property-layout>
        <umb-property-layout label=${this.localize.term("backchat_ruleInterval")} orientation="vertical">
          <uui-input
            slot="editor"
            type="number"
            min="1"
            max="120"
            label=${this.localize.term("backchat_ruleInterval")}
            .value=${String(draft.intervalMonths)}
            @input=${(e: Event) => (this._draft = { ...draft, intervalMonths: Number((e.target as HTMLInputElement).value) })}
          ></uui-input>
        </umb-property-layout>
        <umb-property-layout label=${this.localize.term("backchat_ruleCountFrom")} orientation="vertical">
          <uui-radio-group
            slot="editor"
            .value=${draft.fromPublish ? "publish" : "review"}
            @change=${(e: Event) => (this._draft = { ...draft, fromPublish: (e.target as HTMLInputElement).value === "publish" })}
          >
            <uui-radio value="review" label=${this.localize.term("backchat_ruleFromReview")}></uui-radio>
            <uui-radio value="publish" label=${this.localize.term("backchat_ruleFromPublish")}></uui-radio>
          </uui-radio-group>
        </umb-property-layout>
        <p class="hint">${this.localize.term("backchat_ruleHint")}</p>
        <div class="buttons">
          <uui-button label=${this.localize.term("backchat_cancel")} @click=${() => (this._draft = undefined)}></uui-button>
          <uui-button
            look="primary"
            label=${this.localize.term("backchat_save")}
            ?disabled=${!draft.contentTypeKey || draft.intervalMonths < 1}
            .state=${this._busy ? "waiting" : undefined}
            @click=${this.#save}
          ></uui-button>
        </div>
      </backchat-comms-app-layout>
    `;
  }

  override render() {
    return html`
      <backchat-comms-app-layout headline="#backchat_reviewRules" icon="icon-calendar" .count=${this._rules.length}>
        <uui-button slot="header-actions" look="secondary" label=${this.localize.term("backchat_addRule")} @click=${() => (this._draft = emptyDraft())}>
          <uui-icon name="icon-add"></uui-icon> ${this.localize.term("backchat_addRule")}
        </uui-button>
        ${this._rules.length === 0
          ? html`<p class="hint">${this.localize.term("backchat_noRules")}</p>`
          : html`<uui-table>
              <uui-table-head>
                <uui-table-head-cell>${this.localize.term("backchat_ruleContentType")}</uui-table-head-cell>
                <uui-table-head-cell>${this.localize.term("backchat_ruleEvery")}</uui-table-head-cell>
                <uui-table-head-cell></uui-table-head-cell>
              </uui-table-head>
              ${this._rules.map(
                (rule) => html`<uui-table-row>
                  <uui-table-cell>${rule.contentTypeName ?? rule.contentTypeKey}</uui-table-cell>
                  <uui-table-cell>
                    ${this.localize.term(
                      rule.fromPublish ? "backchat_reviewRuleFromPublish" : "backchat_reviewRuleFromReview",
                      rule.intervalMonths
                    )}
                  </uui-table-cell>
                  <uui-table-cell class="actions">
                    <uui-button
                      label=${this.localize.term("backchat_editRule")}
                      @click=${() =>
                        (this._draft = {
                          id: rule.id,
                          contentTypeKey: rule.contentTypeKey,
                          intervalMonths: rule.intervalMonths,
                          fromPublish: rule.fromPublish,
                        })}
                    ></uui-button>
                    <uui-button color="danger" label=${this.localize.term("backchat_delete")} @click=${() => this.#delete(rule)}></uui-button>
                  </uui-table-cell>
                </uui-table-row>`
              )}
            </uui-table>`}
      </backchat-comms-app-layout>
      ${this.#renderEditor()}
    `;
  }

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--uui-size-layout-1);
      padding: var(--uui-size-layout-1);
    }

    .hint {
      color: var(--uui-color-text-alt);
    }

    .actions {
      text-align: right;
    }

    .buttons {
      display: flex;
      justify-content: flex-end;
      gap: var(--uui-size-space-2);
    }
  `;
}

export { BackChatReviewRulesDashboardElement as element };

declare global {
  interface HTMLElementTagNameMap {
    "backchat-review-rules-dashboard": BackChatReviewRulesDashboardElement;
  }
}
