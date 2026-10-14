import { BACKCHAT_COMMS_APP_TYPE, type ManifestBackChatCommsApp } from "./comms-app.extension";
import { BACKCHAT_COMMS_WORKSPACE_VIEW_ALIAS } from "../constants";

const documentWorkspaceCondition = {
  alias: "Umb.Condition.WorkspaceAlias",
  match: "Umb.Workspace.Document",
};

const commsWorkspaceView: UmbExtensionManifest = {
  type: "workspaceView",
  alias: BACKCHAT_COMMS_WORKSPACE_VIEW_ALIAS,
  name: "BackChat Comms Workspace View",
  element: () => import("./comms-workspace-view.element"),
  weight: 4,
  meta: {
    icon: "icon-chat",
    pathname: "comms",
    label: "#backchat_commsTab",
  },
  conditions: [documentWorkspaceCondition],
};

// Shows the document's unread count on the comms tab
const unreadHintWorkspaceContext: UmbExtensionManifest = {
  type: "workspaceContext",
  alias: "BackChat.WorkspaceContext.UnreadHint",
  name: "BackChat Unread Hint Workspace Context",
  api: () => import("./unread-hint.workspace-context"),
  conditions: [documentWorkspaceCondition],
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

// The document's to-do list, beside the chat
const tasksCommsApp: ManifestBackChatCommsApp = {
  type: BACKCHAT_COMMS_APP_TYPE,
  alias: "BackChat.CommsApp.Tasks",
  name: "BackChat Tasks Comms App",
  element: () => import("./tasks/tasks-comms-app.element"),
  weight: 100,
  meta: {
    area: "aside",
  },
};

export const manifests = [commsWorkspaceView, unreadHintWorkspaceContext, chatCommsApp, tasksCommsApp];
