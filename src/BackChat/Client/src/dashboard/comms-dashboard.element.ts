import { css, customElement, html, nothing, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { BACKCHAT_CONTEXT } from "../global/backchat.context.token";
import { BACKCHAT_PERMISSION_VIEW_ALL } from "../permissions/constants";
import { BACKCHAT_DASHBOARD_LIST_TYPE } from "./dashboard-list.extension";

// What needs you, in one place: a box per registered dashboard list. Users with the
// permission can switch to everything across the site.
@customElement("backchat-comms-dashboard")
export class BackChatCommsDashboardElement extends UmbLitElement {
  @state()
  private _canViewAll = false;

  @state()
  private _everyone = false;

  constructor() {
    super();
    this.consumeContext(BACKCHAT_CONTEXT, (context) => {
      if (!context) return;
      this.observe(
        context.hasPermission(BACKCHAT_PERMISSION_VIEW_ALL),
        (allowed) => {
          this._canViewAll = allowed;
          if (!allowed) this._everyone = false;
        },
        "_canViewAll"
      );
    });
  }

  override render() {
    return html`
      ${this._canViewAll
        ? html`<uui-button-group class="scope">
            <uui-button
              look=${this._everyone ? "outline" : "primary"}
              label=${this.localize.term("backchat_dashboardMine")}
              @click=${() => (this._everyone = false)}
            ></uui-button>
            <uui-button
              look=${this._everyone ? "primary" : "outline"}
              label=${this.localize.term("backchat_dashboardEveryone")}
              @click=${() => (this._everyone = true)}
            ></uui-button>
          </uui-button-group>`
        : nothing}
      <umb-extension-slot
        class="lists"
        type=${BACKCHAT_DASHBOARD_LIST_TYPE}
        .props=${{ everyone: this._everyone }}
      ></umb-extension-slot>
    `;
  }

  static override styles = css`
    :host {
      display: block;
      padding: var(--uui-size-layout-1);
    }

    .scope {
      margin-bottom: var(--uui-size-layout-1);
    }

    .lists {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
      gap: var(--uui-size-layout-1);
      align-items: start;
    }
  `;
}

export { BackChatCommsDashboardElement as element };

declare global {
  interface HTMLElementTagNameMap {
    "backchat-comms-dashboard": BackChatCommsDashboardElement;
  }
}
