import type { ManifestGlobalContext } from "@umbraco-cms/backoffice/extension-registry";

const backChatContext: ManifestGlobalContext = {
  type: "globalContext",
  alias: "BackChat.Context",
  name: "BackChat Context",
  api: () => import("./backchat.context"),
};

export const manifests = [backChatContext];
