import { manifests as globalContext } from "./global/manifest";
import { manifests as headerApps } from "./header/manifest";
import { manifests as modal } from "./modal/manifest";
import { manifests as workspaceViews } from "./content/manifest";
import { manifests as localization } from "./localization/manifest";

export * from "./components/index";

// The bundle collates every manifest. Umbraco loads it through the bundle entry
// registered by BackChatPackageManifestReader.
export const manifests: Array<UmbExtensionManifest> = [
  ...globalContext,
  ...headerApps,
  ...modal,
  ...workspaceViews,
  ...localization,
];
