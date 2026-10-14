import { css, customElement, html, state, property } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_NOTIFICATION_CONTEXT } from "@umbraco-cms/backoffice/notification";
import { BACKCHAT_CONTEXT } from "../global/backchat.context.token";
import type { BackChatContext } from "../global/backchat.context";
import { BACKCHAT_MAX_MESSAGE_LENGTH } from "../constants";

@customElement("backchat-chat-input-box")
export class BackChatChatInputBoxElement extends UmbLitElement {
  @property({ type: String })
  channel = "";

  @state()
  private _text = "";

  @state()
  private _isConnected = false;

  @state()
  private _sending = false;

  #context?: BackChatContext;

  constructor() {
    super();
    this.consumeContext(BACKCHAT_CONTEXT, (context) => {
      this.#context = context;
      if (!context) return;
      this.observe(context.isConnected, (connected) => (this._isConnected = connected), "_isConnected");
    });
  }

  async #send() {
    const text = this._text.trim();
    if (!text || !this.channel || !this.#context || this._sending) return;

    // The text stays in the box until the server has the message, so nothing is lost on failure
    this._sending = true;
    try {
      await this.#context.sendMessage(this.channel, text);
      this._text = "";
    } catch (error) {
      console.error("BackChat: send failed", error);
      const notifications = await this.getContext(UMB_NOTIFICATION_CONTEXT);
      notifications?.peek("danger", {
        data: {
          headline: this.localize.term("backchat_sendFailedHeadline"),
          message: this.localize.term("backchat_sendFailedMessage"),
        },
      });
    } finally {
      this._sending = false;
    }
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
      <uui-textarea
        label=${this.localize.term("backchat_message")}
        placeholder=${this.localize.term(
          this._isConnected ? "backchat_messagePlaceholder" : "backchat_connecting"
        )}
        rows="2"
        auto-height
        maxlength=${BACKCHAT_MAX_MESSAGE_LENGTH}
        .value=${this._text}
        @input=${(e: Event) => (this._text = (e.target as HTMLTextAreaElement).value)}
        @keydown=${this.#onKeyDown}
      ></uui-textarea>
      <div class="actions">
        <span class="hint">${this.localize.term("backchat_sendHint")}</span>
        <uui-button
          look="primary"
          color="positive"
          label=${this.localize.term("backchat_send")}
          .state=${this._sending ? "waiting" : undefined}
          ?disabled=${!this._isConnected}
          @click=${this.#send}
        ></uui-button>
      </div>
    `;
  }

  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--uui-size-space-2);
    }

    uui-textarea {
      display: block;
      width: 100%;
      --uui-textarea-max-height: 12em;
    }

    .actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--uui-size-space-3);
    }

    .hint {
      color: var(--uui-color-text-alt);
      font-size: var(--uui-type-small-size);
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "backchat-chat-input-box": BackChatChatInputBoxElement;
  }
}
