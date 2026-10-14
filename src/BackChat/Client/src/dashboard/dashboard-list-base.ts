import { css, html, nothing, property, state, type PropertyValues, type TemplateResult } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import "../comms/comms-app-layout.element";

export const PAGE_SIZE = 10;

/**
 * The shared shape of a dashboard list: a box with a headline, a page of rows, an empty
 * state and a "Show more" button. Lists that span the site page through the API; a
 * subclass loads a page and renders a row.
 */
export abstract class BackChatDashboardListBase<T> extends UmbLitElement {
  @property({ type: Boolean })
  everyone = false;

  @state()
  protected _items: T[] = [];

  @state()
  protected _total = 0;

  @state()
  protected _loading = true;

  protected abstract headline: string;
  protected abstract emptyText: string;

  /** Loads one page. */
  protected abstract loadPage(skip: number, take: number): Promise<{ items: T[]; total: number }>;

  protected abstract renderItem(item: T): TemplateResult;

  override willUpdate(changed: PropertyValues) {
    if (changed.has("everyone")) this.reload();
  }

  async reload() {
    this._items = [];
    await this.#load(0);
  }

  async #load(skip: number) {
    this._loading = true;
    try {
      const { items, total } = await this.loadPage(skip, PAGE_SIZE);
      this._items = skip === 0 ? items : [...this._items, ...items];
      this._total = total;
    } catch (error) {
      console.error("BackChat: could not load a dashboard list", error);
    } finally {
      this._loading = false;
    }
  }

  override render() {
    return html`
      <backchat-comms-app-layout headline=${this.headline}>
        ${this._items.length === 0 && !this._loading ? html`<p class="empty">${this.localize.term(this.emptyText)}</p>` : nothing}
        <ul>
          ${this._items.map((item) => html`<li>${this.renderItem(item)}</li>`)}
        </ul>
        ${this._loading ? html`<uui-loader-bar></uui-loader-bar>` : nothing}
        ${this._items.length < this._total && !this._loading
          ? html`<uui-button
              look="secondary"
              label=${this.localize.term("backchat_showMore")}
              @click=${() => this.#load(this._items.length)}
            ></uui-button>`
          : nothing}
      </backchat-comms-app-layout>
    `;
  }

  static override styles = css`
    ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    li + li {
      border-top: 1px solid var(--uui-color-divider);
    }

    .row {
      display: flex;
      align-items: center;
      gap: var(--uui-size-space-3);
      width: 100%;
      padding: var(--uui-size-space-3) 0;
      border: none;
      background: none;
      font: inherit;
      color: inherit;
      text-align: left;
      cursor: pointer;
    }

    .row:hover .title {
      text-decoration: underline;
    }

    .text {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1 1 auto;
    }

    .title {
      font-weight: 700;
      overflow-wrap: anywhere;
    }

    .detail {
      color: var(--uui-color-text-alt);
      font-size: var(--uui-type-small-size);
      overflow-wrap: anywhere;
    }

    .overdue {
      color: var(--uui-color-danger-standalone);
      font-weight: 700;
    }

    .empty {
      margin: 0;
      color: var(--uui-color-text-alt);
    }

    uui-button {
      margin-top: var(--uui-size-space-3);
    }
  `;
}
