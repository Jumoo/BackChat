import type { ManifestModal } from "@umbraco-cms/backoffice/modal";

const chatModal: ManifestModal = {
  type: "modal",
  alias: "BackChat.Modal",
  name: "BackChat Modal",
  js: () => import("./chat-modal.element"),
};

export const manifests = [chatModal];
