import { css, customElement, html, nothing, property } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";

/**
 * The box every comms app and dashboard list sits in, so they look like one system: a
 * uui-box whose header has an icon, a headline, an optional count tag, and room for actions.
 * With `fill`, the box grows to the free height of its column and its content stretches with
 * it, which the chat uses to keep its input at the bottom.
 */
@customElement("backchat-comms-app-layout")
export class BackChatCommsAppLayoutElement extends UmbLitElement {
  @property({ type: String })
  headline = "";

  @property({ type: String })
  icon = "";

  /** Shown as a tag after the headline when set, e.g. how many items a list holds. */
  @property({ type: Number })
  count?: number;

  @property({ type: Boolean, reflect: true })
  fill = false;

  override render() {
    return html`
      <uui-box>
        <div slot="headline" class="headline">
          ${this.icon ? html`<umb-icon name=${this.icon}></umb-icon>` : nothing}
          <span>${this.localize.string(this.headline)}</span>
          ${this.count ? html`<uui-tag look="secondary">${this.count}</uui-tag>` : nothing}
        </div>
        <slot name="header-actions" slot="header-actions"></slot>
        <div class="content"><slot></slot></div>
      </uui-box>
    `;
  }

  static override styles = css`
    :host {
      display: block;
    }

    uui-box {
      height: 100%;
      box-sizing: border-box;
    }

    .headline {
      display: flex;
      align-items: center;
      gap: var(--uui-size-space-3);
    }

    .headline umb-icon {
      color: var(--uui-color-text-alt);
    }

    :host([fill]) {
      flex: 1 1 auto;
      min-height: 480px;
    }

    /* uui-box puts its content in a padded block after the header. As a two row grid the
       content row takes the remaining height, so a filled box's content can stretch too. */
    :host([fill]) uui-box {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
    }

    :host([fill]) .content {
      height: 100%;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "backchat-comms-app-layout": BackChatCommsAppLayoutElement;
  }
}
