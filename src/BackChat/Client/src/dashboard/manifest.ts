import { BACKCHAT_DASHBOARD_LIST_TYPE, type ManifestBackChatDashboardList } from "./dashboard-list.extension";

// The comms dashboard in the Content section
const commsDashboard: UmbExtensionManifest = {
  type: "dashboard",
  alias: "BackChat.Dashboard.Comms",
  name: "BackChat Comms Dashboard",
  element: () => import("./comms-dashboard.element"),
  weight: 50,
  meta: {
    label: "#backchat_dashboard",
    pathname: "backchat-comms",
  },
  conditions: [{ alias: "Umb.Condition.SectionAlias", match: "Umb.Section.Content" }],
};

const list = (
  alias: string,
  weight: number,
  element: ManifestBackChatDashboardList["element"]
): ManifestBackChatDashboardList => ({
  type: BACKCHAT_DASHBOARD_LIST_TYPE,
  alias: `BackChat.DashboardList.${alias}`,
  name: `BackChat ${alias} Dashboard List`,
  weight,
  element,
});

// Its lists. Add new ones here (or from another package) with the same type.
export const manifests = [
  commsDashboard,
  list("Confirmations", 400, () => import("./confirmations-list.element")),
  list("Tasks", 300, () => import("./tasks-list.element")),
  list("Reviews", 200, () => import("./reviews-list.element")),
  list("Mentions", 100, () => import("./mentions-list.element")),
];
