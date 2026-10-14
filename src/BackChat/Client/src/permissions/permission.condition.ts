import { UmbConditionBase } from "@umbraco-cms/backoffice/extension-registry";
import type { UmbConditionControllerArguments, UmbExtensionCondition } from "@umbraco-cms/backoffice/extension-api";
import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UMB_CURRENT_USER_CONTEXT } from "@umbraco-cms/backoffice/current-user";

export const BACKCHAT_PERMISSION_CONDITION_ALIAS = "BackChat.Condition.Permission";

export interface BackChatPermissionConditionConfig {
  alias: typeof BACKCHAT_PERMISSION_CONDITION_ALIAS;
  /** The BackChat permission the current user needs, e.g. "BackChat.ManageReviews". */
  match: string;
}

// Shows an extension only to users whose groups grant a BackChat permission. It hides what
// they can't use; the server checks the permission again on every action.
export class BackChatPermissionCondition
  extends UmbConditionBase<BackChatPermissionConditionConfig>
  implements UmbExtensionCondition
{
  constructor(host: UmbControllerHost, args: UmbConditionControllerArguments<BackChatPermissionConditionConfig>) {
    super(host, args);

    this.consumeContext(UMB_CURRENT_USER_CONTEXT, (context) => {
      if (!context) return;
      this.observe(
        context.currentUser,
        (user) => (this.permitted = !!user?.fallbackPermissions.includes(this.config.match)),
        "_permitted"
      );
    });
  }
}

export { BackChatPermissionCondition as api };

declare global {
  interface UmbExtensionConditionConfigMap {
    BackChatPermissionConditionConfig: BackChatPermissionConditionConfig;
  }
}
