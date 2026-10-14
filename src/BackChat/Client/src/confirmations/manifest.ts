import type { ManifestModal } from "@umbraco-cms/backoffice/modal";

const importantModal: ManifestModal = {
  type: "modal",
  alias: "BackChat.Modal.Important",
  name: "BackChat Important Message Modal",
  element: () => import("./important-modal.element"),
};

const statusModal: ManifestModal = {
  type: "modal",
  alias: "BackChat.Modal.ConfirmationStatus",
  name: "BackChat Confirmation Status Modal",
  element: () => import("./confirmation-status-modal.element"),
};

export const manifests = [importantModal, statusModal];
