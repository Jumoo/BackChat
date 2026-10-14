
const headerApp: UmbExtensionManifest = {
  type: "headerApp",
  alias: "BackChat.HeaderApp",
  name: "BackChat Header App",
  element: () => import("./chat-header.element"),
  weight: 19,
  meta: {
    label: "#backchat_chat",
    icon: "icon-chat",
    path: "chat",
  },
};

export const manifests = [headerApp];
