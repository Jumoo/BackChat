import type { ManifestElement, ManifestWithDynamicConditions } from "@umbraco-cms/backoffice/extension-api";

export const BACKCHAT_DASHBOARD_LIST_TYPE = "backChatDashboardList";

/**
 * One list on the comms dashboard, such as "Your tasks". A feature adds its list by
 * registering one of these, so the dashboard itself doesn't change. The element gets an
 * `everyone` property: false for the user's own items, true for the "everything" view.
 */
export interface ManifestBackChatDashboardList
  extends ManifestElement,
    ManifestWithDynamicConditions<UmbExtensionConditionConfig> {
  type: typeof BACKCHAT_DASHBOARD_LIST_TYPE;
}

/** The property every dashboard list element takes. */
export interface BackChatDashboardListElement extends HTMLElement {
  everyone: boolean;
}

declare global {
  interface UmbExtensionManifestMap {
    backChatDashboardList: ManifestBackChatDashboardList;
  }
}
