
const documentChatWorkspaceView: UmbExtensionManifest = {
  type: "workspaceView",
  alias: "BackChat.WorkspaceView.Document",
  name: "BackChat Document Chat",
  element: () => import("./backchat-workspace.element"),
  weight: 4,
  meta: {
    icon: "icon-chat",
    pathname: "chat",
    label: "#backchat_chat",
  },
  conditions: [
    {
      alias: "Umb.Condition.WorkspaceAlias",
      match: "Umb.Workspace.Document",
    },
  ],
};

export const manifests = [documentChatWorkspaceView];
