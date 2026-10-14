import { css, customElement, html, nothing, state } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { umbExtensionsRegistry } from "@umbraco-cms/backoffice/extension-registry";
import { BACKCHAT_COMMS_APP_TYPE, type ManifestBackChatCommsApp } from "./comms-app.extension";
import "./comms-app-layout.element";

const isAside = (manifest: ManifestBackChatCommsApp) => manifest.meta?.area === "aside";
const isMain = (manifest: ManifestBackChatCommsApp) => !isAside(manifest);

// The document's comms tab. It only lays out the registered comms apps: a main column,
// plus a narrow side column once any app asks for one (as the Info tab does).
@customElement("backchat-comms-workspace-view")
export class BackChatCommsWorkspaceViewElement extends UmbLitElement {
  @state()
  private _hasAside = false;

  constructor() {
    super();

    this.observe(
      umbExtensionsRegistry.byType(BACKCHAT_COMMS_APP_TYPE),
      (apps) => (this._hasAside = apps.some(isAside)),
      "_observeApps"
    );
  }

  override render() {
    return html`
      <div class="layout ${this._hasAside ? "has-aside" : ""}">
        <umb-extension-slot class="column" type=${BACKCHAT_COMMS_APP_TYPE} .filter=${isMain}></umb-extension-slot>
        ${this._hasAside
          ? html`<umb-extension-slot class="column" type=${BACKCHAT_COMMS_APP_TYPE} .filter=${isAside}></umb-extension-slot>`
          : nothing}
      </div>
    `;
  }

  static override styles = css`
    :host {
      display: block;
      height: 100%;
    }

    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr);
      gap: var(--uui-size-layout-1);
      height: 100%;
      box-sizing: border-box;
      padding: var(--uui-size-layout-1);
    }

    .layout.has-aside {
      grid-template-columns: minmax(0, 1fr) 350px;
    }

    .column {
      display: flex;
      flex-direction: column;
      gap: var(--uui-size-layout-1);
      min-height: 0;
    }
  `;
}

export { BackChatCommsWorkspaceViewElement as element };

declare global {
  interface HTMLElementTagNameMap {
    "backchat-comms-workspace-view": BackChatCommsWorkspaceViewElement;
  }
}
