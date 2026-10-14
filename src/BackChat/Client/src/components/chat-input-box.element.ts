import { css, customElement, html, nothing, state, property } from "@umbraco-cms/backoffice/external/lit";
import { UmbLitElement } from "@umbraco-cms/backoffice/lit-element";
import { UMB_NOTIFICATION_CONTEXT } from "@umbraco-cms/backoffice/notification";
import { BACKCHAT_CONTEXT } from "../global/backchat.context.token";
import type { BackChatContext } from "../global/backchat.context";
import { BACKCHAT_MAX_MESSAGE_LENGTH, canAskForConfirmation } from "../constants";
import type { Mentionables } from "../signalR/types";
import { groupToken, userToken } from "../mentions/mentions";
import { BACKCHAT_PERMISSION_ANNOUNCE, BACKCHAT_PERMISSION_MENTION_GROUPS } from "../permissions/constants";

interface Suggestion {
  name: string;
  token: string;
  isGroup: boolean;
}

const MAX_SUGGESTIONS = 8;

// The "@query" being typed just before the caret, if any
const MENTION_QUERY = /(?:^|\s)@([^\s@]*)$/;

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

  @state()
  private _suggestions: Suggestion[] = [];

  @state()
  private _canAnnounce = false;

  // Ask each recipient to confirm; important also holds their screen until they do
  @state()
  private _askConfirm = false;

  @state()
  private _important = false;

  @state()
  private _active = 0;

  #context?: BackChatContext;
  #mentionables: Mentionables = { users: [], groups: [] };
  #canMentionGroups = false;

  // The box shows "@Name" while you type; each one picked from the list is swapped for its
  // token when the message is sent
  #picked = new Map<string, string>();

  // Where the "@query" being completed starts, and the textarea inside uui-textarea
  #queryStart = -1;
  #textarea?: HTMLTextAreaElement;

  constructor() {
    super();
    this.consumeContext(BACKCHAT_CONTEXT, (context) => {
      this.#context = context;
      if (!context) return;
      this.observe(context.isConnected, (connected) => (this._isConnected = connected), "_isConnected");
      this.observe(context.mentionables, (m) => (this.#mentionables = m), "_mentionables");
      this.observe(
        context.hasPermission(BACKCHAT_PERMISSION_MENTION_GROUPS),
        (allowed) => (this.#canMentionGroups = allowed),
        "_canMentionGroups"
      );
      this.observe(
        context.hasPermission(BACKCHAT_PERMISSION_ANNOUNCE),
        (allowed) => (this._canAnnounce = allowed),
        "_canAnnounce"
      );
    });
  }

  #toTokens(text: string) {
    // Longest first, so "@Sam Smith" isn't half replaced by "@Sam"
    const picked = [...this.#picked].sort(([a], [b]) => b.length - a.length);
    for (const [display, token] of picked) {
      text = text.split(display).join(token);
    }
    return text;
  }

  async #send() {
    const text = this._text.trim();
    if (!text || !this.channel || !this.#context || this._sending) return;

    // The text stays in the box until the server has the message, so nothing is lost on failure
    this._sending = true;
    try {
      const message = this.#toTokens(text);
      const result =
        this._askConfirm || this._important
          ? await this.#context.sendAnnouncement(this.channel, message, this._important)
          : await this.#context.sendMessage(this.channel, message);
      this._text = "";
      this._askConfirm = false;
      this._important = false;
      this.#picked.clear();
      this.#closeSuggestions();

      if (result?.unreachable?.length) {
        const notifications = await this.getContext(UMB_NOTIFICATION_CONTEXT);
        notifications?.peek("warning", {
          data: {
            headline: this.localize.term("backchat_mentionUnreachableHeadline"),
            message: this.localize.term("backchat_mentionUnreachable", result.unreachable.join(", ")),
          },
        });
      }
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

  #onInput(e: InputEvent) {
    this.#textarea = e.composedPath()[0] as HTMLTextAreaElement;
    this._text = this.#textarea.value;
    this.#updateSuggestions();
  }

  #updateSuggestions() {
    const textarea = this.#textarea;
    const match = textarea ? MENTION_QUERY.exec(this._text.slice(0, textarea.selectionStart)) : null;
    if (!textarea || !match) {
      this.#closeSuggestions();
      return;
    }

    const query = match[1].toLowerCase();
    this.#queryStart = textarea.selectionStart - match[1].length - 1;

    const matches = (name: string, ...more: string[]) =>
      [name, ...more].some((value) => value.toLowerCase().includes(query));

    this._suggestions = [
      ...this.#mentionables.users
        .filter((u) => matches(u.name))
        .map((u) => ({ name: u.name, token: userToken(u.key), isGroup: false })),
      ...(this.#canMentionGroups ? this.#mentionables.groups : [])
        .filter((g) => matches(g.name, g.alias))
        .map((g) => ({ name: g.name, token: groupToken(g.alias), isGroup: true })),
    ].slice(0, MAX_SUGGESTIONS);
    this._active = 0;
  }

  #closeSuggestions() {
    this._suggestions = [];
    this.#queryStart = -1;
  }

  #pick(suggestion: Suggestion) {
    const textarea = this.#textarea;
    if (!textarea || this.#queryStart < 0) return;

    const display = `@${suggestion.name}`;
    const before = this._text.slice(0, this.#queryStart);
    const after = this._text.slice(textarea.selectionStart);
    this._text = `${before}${display} ${after}`;
    this.#picked.set(display, suggestion.token);
    this.#closeSuggestions();

    const caret = before.length + display.length + 1;
    this.updateComplete.then(() => {
      textarea.focus();
      textarea.setSelectionRange(caret, caret);
    });
  }

  #onKeyDown(e: KeyboardEvent) {
    if (this._suggestions.length > 0) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          this._active = (this._active + 1) % this._suggestions.length;
          return;
        case "ArrowUp":
          e.preventDefault();
          this._active = (this._active - 1 + this._suggestions.length) % this._suggestions.length;
          return;
        case "Enter":
        case "Tab":
          e.preventDefault();
          this.#pick(this._suggestions[this._active]);
          return;
        case "Escape":
          // Stop here, so Escape closes the list rather than the modal the chat is in
          e.preventDefault();
          e.stopPropagation();
          this.#closeSuggestions();
          return;
      }
    }

    // Enter sends, Shift+Enter adds a new line
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      this.#send();
    }
  }

  #renderSuggestions() {
    if (this._suggestions.length === 0) return nothing;

    return html`
      <ul class="suggestions" role="listbox" aria-label=${this.localize.term("backchat_mentionSuggestions")}>
        ${this._suggestions.map(
          (s, i) => html`<li
            role="option"
            aria-selected=${i === this._active}
            class=${i === this._active ? "active" : ""}
            @mousedown=${(e: MouseEvent) => {
              // mousedown, so the textarea keeps focus and its caret
              e.preventDefault();
              this.#pick(s);
            }}
          >
            <uui-icon name=${s.isGroup ? "icon-users" : "icon-user"}></uui-icon>
            <span>${s.name}</span>
            ${s.isGroup ? html`<span class="kind">${this.localize.term("backchat_mentionGroup")}</span>` : nothing}
          </li>`
        )}
      </ul>
    `;
  }

  #renderAnnounceOptions() {
    if (!this._canAnnounce || !canAskForConfirmation(this.channel)) return nothing;

    return html`<div class="options">
      <uui-checkbox
        label=${this.localize.term("backchat_askConfirm")}
        ?checked=${this._askConfirm || this._important}
        ?disabled=${this._important}
        @change=${(e: Event) => (this._askConfirm = (e.target as HTMLInputElement).checked)}
      ></uui-checkbox>
      <uui-checkbox
        label=${this.localize.term("backchat_markImportant")}
        ?checked=${this._important}
        @change=${(e: Event) => (this._important = (e.target as HTMLInputElement).checked)}
      ></uui-checkbox>
    </div>`;
  }

  override render() {
    return html`
      <div class="field">
        ${this.#renderSuggestions()}
        <uui-textarea
          label=${this.localize.term("backchat_message")}
          placeholder=${this.localize.term(
            this._isConnected ? "backchat_messagePlaceholder" : "backchat_connecting"
          )}
          rows="2"
          auto-height
          maxlength=${BACKCHAT_MAX_MESSAGE_LENGTH}
          .value=${this._text}
          @input=${this.#onInput}
          @keydown=${this.#onKeyDown}
          @blur=${() => this.#closeSuggestions()}
        ></uui-textarea>
      </div>
      ${this.#renderAnnounceOptions()}
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

    .field {
      position: relative;
    }

    uui-textarea {
      display: block;
      width: 100%;
      --uui-textarea-max-height: 12em;
    }

    .suggestions {
      position: absolute;
      bottom: calc(100% + var(--uui-size-space-1));
      left: 0;
      z-index: 1;
      min-width: 240px;
      max-width: 100%;
      margin: 0;
      padding: var(--uui-size-space-1) 0;
      list-style: none;
      background-color: var(--uui-color-surface);
      border: 1px solid var(--uui-color-border);
      border-radius: var(--uui-border-radius);
      box-shadow: var(--uui-shadow-depth-3);
    }

    .suggestions li {
      display: flex;
      align-items: center;
      gap: var(--uui-size-space-2);
      padding: var(--uui-size-space-2) var(--uui-size-space-3);
      cursor: pointer;
    }

    .suggestions li.active {
      background-color: var(--uui-color-surface-emphasis);
    }

    .kind {
      margin-left: auto;
      color: var(--uui-color-text-alt);
      font-size: var(--uui-type-small-size);
    }

    .options {
      display: flex;
      flex-wrap: wrap;
      gap: var(--uui-size-space-4);
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
