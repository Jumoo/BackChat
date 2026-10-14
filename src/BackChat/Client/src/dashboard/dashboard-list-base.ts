import { css, html, nothing, property, state, type PropertyValues, type TemplateResult } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import "../comms/comms-app-layout.element";

export const PAGE_SIZE = 10;

/**
 * The shared shape of a dashboard list: a box with an icon, headline and count, a page of
 * rows, an empty state and a "Show more" button. A subclass loads a page and renders a row,
 * normally a uui-ref-node so the lists look like the CMS's own.
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
  protected abstract icon: string;
  protected abstract emptyText: string;

  /** Loads one page. */
  protected abstract loadPage(skip: number, take: number): Promise<{ items: T[]; total: number }>;

  protected abstract renderItem(item: T): TemplateResult;

  override willUpdate(changed: PropertyValues) {
    if (changed.has("everyone")) this.reload();
  }

  async reload() {
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

  #renderBody() {
    if (this._items.length === 0) {
      return this._loading
        ? html`<div class="state"><uui-loader></uui-loader></div>`
        : html`<div class="state">
            <umb-icon name="icon-check"></umb-icon>
            <span>${this.localize.term(this.emptyText)}</span>
          </div>`;
    }

    return html`
      <uui-ref-list>${this._items.map((item) => this.renderItem(item))}</uui-ref-list>
      ${this._items.length < this._total
        ? html`<div class="more">
            <uui-button
              look="secondary"
              label=${this.localize.term("backchat_showMore")}
              .state=${this._loading ? "waiting" : undefined}
              @click=${() => this.#load(this._items.length)}
            ></uui-button>
          </div>`
        : nothing}
    `;
  }

  override render() {
    return html`
      <backchat-comms-app-layout headline=${this.headline} icon=${this.icon} .count=${this._total}>
        ${this.#renderBody()}
      </backchat-comms-app-layout>
    `;
  }

  static override styles = css`
    :host {
      display: block;
      height: 100%;
    }

    backchat-comms-app-layout {
      height: 100%;
    }

    /* A calm, centred empty or loading state, so an empty list doesn't look broken */
    .state {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--uui-size-space-3);
      min-height: var(--uui-size-24, 96px);
      color: var(--uui-color-text-alt);
      text-align: center;
    }

    .state umb-icon {
      color: var(--uui-color-positive-standalone);
    }

    .more {
      display: flex;
      justify-content: center;
      margin-top: var(--uui-size-space-4);
    }

    /* Icon and text side by side inside a tag */
    .tag-content {
      display: inline-flex;
      align-items: center;
      gap: var(--uui-size-space-1);
      white-space: nowrap;
    }
  `;
}
