import { css, customElement, html, state, property } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { BACKCHAT_CONTEXT } from "../global/backchat.context.token";
import type { BackChatContext } from "../global/backchat.context";

@customElement("backchat-chat-input-box")
export class BackChatChatInputBoxElement extends UmbLitElement {
  @property({ type: String })
  channel = "";

  @state()
  private _text = "";

  #context?: BackChatContext;

  constructor() {
    super();
    this.consumeContext(BACKCHAT_CONTEXT, (context) => {
      this.#context = context;
    });
  }

  async #send() {
    const text = this._text.trim();
    if (!text || !this.channel) return;

    this._text = "";
    await this.#context?.sendMessage(this.channel, text);
  }

  #onKeyDown(e: KeyboardEvent) {
    // Enter sends, Shift+Enter adds a new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.#send();
    }
  }

  override render() {
    return html`
      <div class="input">
        <uui-textarea
          label=${this.localize.term("backchat_message")}
          placeholder=${this.localize.term("backchat_messagePlaceholder")}
          rows="2"
          .value=${this._text}
          @input=${(e: Event) => (this._text = (e.target as HTMLTextAreaElement).value)}
          @keydown=${this.#onKeyDown}
        ></uui-textarea>
        <uui-button
          look="primary"
          color="positive"
          label=${this.localize.term("backchat_send")}
          @click=${this.#send}
        ></uui-button>
      </div>
    `;
  }

  static override styles = css`
    .input {
      display: flex;
      align-items: flex-start;
      gap: var(--uui-size-space-2);
    }

    uui-textarea {
      flex-grow: 1;
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "backchat-chat-input-box": BackChatChatInputBoxElement;
  }
}
