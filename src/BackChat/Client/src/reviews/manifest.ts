import { BACKCHAT_PERMISSION_MANAGE_REVIEWS } from "../permissions/constants";
import { BACKCHAT_PERMISSION_CONDITION_ALIAS } from "../permissions/permission.condition";

// The review rules screen, in the Settings section for users allowed to manage them
const reviewRulesDashboard: UmbExtensionManifest = {
  type: "dashboard",
  alias: "BackChat.Dashboard.ReviewRules",
  name: "BackChat Review Rules Dashboard",
  element: () => import("./review-rules-dashboard.element"),
  weight: -10,
  meta: {
    label: "#backchat_reviewRules",
    pathname: "backchat-review-rules",
  },
  conditions: [
    { alias: "Umb.Condition.SectionAlias", match: "Umb.Section.Settings" },
    { alias: BACKCHAT_PERMISSION_CONDITION_ALIAS, match: BACKCHAT_PERMISSION_MANAGE_REVIEWS },
  ],
};

export const manifests = [reviewRulesDashboard];
