import type { ManifestElement, ManifestWithDynamicConditions } from "@umbraco-cms/backoffice/extension-api";

export const BACKCHAT_COMMS_APP_TYPE = "backChatCommsApp";

/**
 * A panel on a document's comms tab. Chat is the first one; others (tasks, review dates)
 * register with this type, pick a column, and the tab lays them out. Conditions work as
 * on any extension, so an app can limit itself to some document types.
 */
export interface ManifestBackChatCommsApp
  extends ManifestElement,
    ManifestWithDynamicConditions<UmbExtensionConditionConfig> {
  type: typeof BACKCHAT_COMMS_APP_TYPE;
  meta?: MetaBackChatCommsApp;
}

export interface MetaBackChatCommsApp {
  /** "main" (the default) for the wide column, "aside" for the narrow column beside it. */
  area?: "main" | "aside";
}

declare global {
  interface UmbExtensionManifestMap {
    backChatCommsApp: ManifestBackChatCommsApp;
  }
}
