import { css, customElement, html, nothing, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { BACKCHAT_CONTEXT } from "../global/backchat.context.token";
import { BACKCHAT_PERMISSION_VIEW_ALL } from "../permissions/constants";
import { BACKCHAT_DASHBOARD_LIST_TYPE } from "./dashboard-list.extension";

// What needs you, in one place: a box per registered dashboard list, two to a row. Users
// with the permission can switch to everything across the site.
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

  #renderScope() {
    if (!this._canViewAll) return nothing;

    return html`<uui-button-group>
      <uui-button
        look=${this._everyone ? "secondary" : "primary"}
        label=${this.localize.term("backchat_dashboardMine")}
        @click=${() => (this._everyone = false)}
      >
        <umb-icon name="icon-user"></umb-icon> ${this.localize.term("backchat_dashboardMine")}
      </uui-button>
      <uui-button
        look=${this._everyone ? "primary" : "secondary"}
        label=${this.localize.term("backchat_dashboardEveryone")}
        @click=${() => (this._everyone = true)}
      >
        <umb-icon name="icon-globe"></umb-icon> ${this.localize.term("backchat_dashboardEveryone")}
      </uui-button>
    </uui-button-group>`;
  }

  override render() {
    return html`
      <umb-body-layout>
        <div slot="header" class="header">
          <div class="title">
            <umb-icon name="icon-chat"></umb-icon>
            <div>
              <h3>${this.localize.term("backchat_dashboardHeadline")}</h3>
              <p>
                ${this.localize.term(this._everyone ? "backchat_dashboardIntroEveryone" : "backchat_dashboardIntro")}
              </p>
            </div>
          </div>
          ${this.#renderScope()}
        </div>
        <umb-extension-slot
          class="lists"
          type=${BACKCHAT_DASHBOARD_LIST_TYPE}
          .props=${{ everyone: this._everyone }}
        ></umb-extension-slot>
      </umb-body-layout>
    `;
  }

  static override styles = css`
    :host {
      display: block;
      height: 100%;
    }

    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--uui-size-space-5);
      width: 100%;
    }

    .title {
      display: flex;
      align-items: center;
      gap: var(--uui-size-space-4);
    }

    .title umb-icon {
      font-size: var(--uui-size-8);
      color: var(--uui-color-text-alt);
    }

    h3 {
      margin: 0;
    }

    p {
      margin: 0;
      color: var(--uui-color-text-alt);
      font-size: var(--uui-type-small-size);
    }

    /* Two equal columns, and every box in a row the same height, so the grid lines up
       whatever each list holds */
    .lists {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-auto-rows: minmax(min-content, auto);
      align-items: stretch;
      gap: var(--uui-size-layout-1);
    }

    @media (max-width: 1100px) {
      .lists {
        grid-template-columns: minmax(0, 1fr);
      }
    }
  `;
}

export { BackChatCommsDashboardElement as element };

declare global {
  interface HTMLElementTagNameMap {
    "backchat-comms-dashboard": BackChatCommsDashboardElement;
  }
}
