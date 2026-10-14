import { BACKCHAT_COMMS_APP_TYPE, type ManifestBackChatCommsApp } from "./comms-app.extension";

const commsWorkspaceView: UmbExtensionManifest = {
  type: "workspaceView",
  alias: "BackChat.WorkspaceView.Comms",
  name: "BackChat Comms Workspace View",
  element: () => import("./comms-workspace-view.element"),
  weight: 4,
  meta: {
    icon: "icon-chat",
    pathname: "comms",
    label: "#backchat_commsTab",
  },
  conditions: [
    {
      alias: "Umb.Condition.WorkspaceAlias",
      match: "Umb.Workspace.Document",
    },
  ],
};

// Apps on the comms tab. Add new ones here (or from another package) with the same type.
const chatCommsApp: ManifestBackChatCommsApp = {
  type: BACKCHAT_COMMS_APP_TYPE,
  alias: "BackChat.CommsApp.Chat",
  name: "BackChat Chat Comms App",
  element: () => import("./chat/chat-comms-app.element"),
  weight: 100,
  meta: {
    area: "main",
  },
};

export const manifests = [commsWorkspaceView, chatCommsApp];
