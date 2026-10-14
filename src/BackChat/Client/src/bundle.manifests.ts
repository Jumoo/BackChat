import { manifests as globalContext } from "./global/manifest";
import { manifests as headerApps } from "./header/manifest";
import { manifests as modal } from "./modal/manifest";
import { manifests as comms } from "./comms/manifest";
import { manifests as localization } from "./localization/manifest";
import { manifests as permissions } from "./permissions/manifest";
import { manifests as confirmations } from "./confirmations/manifest";

// The bundle collates every manifest. Umbraco loads it through the bundle entry
// registered by BackChatPackageManifestReader.
export const manifests: Array<UmbExtensionManifest> = [
  ...globalContext,
  ...headerApps,
  ...modal,
  ...comms,
  ...localization,
  ...permissions,
  ...confirmations,
];
