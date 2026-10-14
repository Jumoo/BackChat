import { UmbControllerBase } from "@umbraco-cms/backoffice/class-api";
import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import type { UmbApi } from "@umbraco-cms/backoffice/extension-api";
import { UMB_DOCUMENT_WORKSPACE_CONTEXT } from "@umbraco-cms/backoffice/document";
import { BACKCHAT_CONTEXT } from "../global/backchat.context.token";
import { BACKCHAT_COMMS_WORKSPACE_VIEW_ALIAS, formatBadgeCount } from "../constants";
import type { UnreadCount } from "../signalR/types";

const HINT_UNIQUE = "BackChat.Unread";

// Puts the document's unread count on the comms tab, using the same hints Umbraco uses
// for validation counts. Runs for the whole workspace, because the tab's own element only
// exists while the tab is open. Umbraco hides a hint on the active tab.
export class BackChatUnreadHintWorkspaceContext extends UmbControllerBase implements UmbApi {
  #workspace?: typeof UMB_DOCUMENT_WORKSPACE_CONTEXT.TYPE;
  #backChat?: typeof BACKCHAT_CONTEXT.TYPE;

  constructor(host: UmbControllerHost) {
    super(host);

    this.consumeContext(UMB_DOCUMENT_WORKSPACE_CONTEXT, (context) => {
      this.#workspace = context;
      this.#observe();
    });

    this.consumeContext(BACKCHAT_CONTEXT, (context) => {
      this.#backChat = context;
      this.#observe();
    });
  }

  #observe() {
    const workspace = this.#workspace;
    const backChat = this.#backChat;
    if (!workspace || !backChat) return;

    this.observe(
      workspace.unique,
      (unique) => {
        if (!unique) {
          this.#setHint(undefined);
          return;
        }
        this.observe(backChat.unreadOf(unique), (count) => this.#setHint(count), "_unread");
      },
      "_unique"
    );
  }

  #setHint(count: UnreadCount | undefined) {
    const hints = this.#workspace?.view.hints;
    if (!hints) return;

    if (!count || count.unread === 0) {
      hints.removeOne(HINT_UNIQUE);
      return;
    }

    hints.addOne({
      unique: HINT_UNIQUE,
      path: [BACKCHAT_COMMS_WORKSPACE_VIEW_ALIAS],
      text: formatBadgeCount(count.unread),
      color: count.mentions > 0 ? "danger" : "default",
      weight: 100,
    });
  }
}

export { BackChatUnreadHintWorkspaceContext as api };
