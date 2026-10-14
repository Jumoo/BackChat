import type { ManifestLocalization } from "@umbraco-cms/backoffice/localization";

const enUs: ManifestLocalization = {
  type: "localization",
  alias: "BackChat.Localization.EnUs",
  name: "BackChat English (US) Localization",
  weight: 0,
  meta: {
    culture: "en-us",
  },
  js: () => import("./en-us"),
};

export const manifests = [enUs];
