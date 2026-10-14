import { css, customElement, html, property } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";

/**
 * The box every comms app sits in, so they look alike: a uui-box with a headline and
 * room for header actions. With `fill`, the box grows to the free height of its column
 * and its content stretches with it, which the chat uses to keep its input at the bottom.
 */
@customElement("backchat-comms-app-layout")
export class BackChatCommsAppLayoutElement extends UmbLitElement {
  @property({ type: String })
  headline = "";

  @property({ type: Boolean, reflect: true })
  fill = false;

  override render() {
    return html`
      <uui-box headline=${this.localize.string(this.headline)}>
        <slot name="header-actions" slot="header-actions"></slot>
        <div class="content"><slot></slot></div>
      </uui-box>
    `;
  }

  static override styles = css`
    :host {
      display: block;
    }

    :host([fill]) {
      flex: 1 1 auto;
      min-height: 320px;
    }

    /* uui-box puts its content in a padded block after the header. As a two row grid the
       content row takes the remaining height, so a filled box's content can stretch too. */
    :host([fill]) uui-box {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      height: 100%;
      box-sizing: border-box;
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
