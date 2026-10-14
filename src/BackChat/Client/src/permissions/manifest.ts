import {
  BACKCHAT_PERMISSION_ANNOUNCE,
  BACKCHAT_PERMISSION_ENTITY_TYPE,
  BACKCHAT_PERMISSION_MANAGE_REVIEWS,
  BACKCHAT_PERMISSION_MENTION_GROUPS,
  BACKCHAT_PERMISSION_MESSAGE_GROUPS,
  BACKCHAT_PERMISSION_PIN_NOTES,
  BACKCHAT_PERMISSION_VIEW_ALL,
} from "./constants";
import { BACKCHAT_PERMISSION_CONDITION_ALIAS } from "./permission.condition";

const permission = (verb: string, key: string, weight: number): UmbExtensionManifest => ({
  type: "entityUserPermission",
  alias: `${verb}.Permission`,
  name: `BackChat ${key} Permission`,
  weight,
  forEntityTypes: [BACKCHAT_PERMISSION_ENTITY_TYPE],
  meta: {
    verbs: [verb],
    label: `#backchat_permission${key}`,
    description: `#backchat_permission${key}Description`,
  },
});

const permissionCondition: UmbExtensionManifest = {
  type: "condition",
  alias: BACKCHAT_PERMISSION_CONDITION_ALIAS,
  name: "BackChat Permission Condition",
  api: () => import("./permission.condition"),
};

// Shown in the user group editor next to Umbraco's own permissions
export const manifests: Array<UmbExtensionManifest> = [
  permissionCondition,
  permission(BACKCHAT_PERMISSION_ANNOUNCE, "Announce", 600),
  permission(BACKCHAT_PERMISSION_MESSAGE_GROUPS, "MessageGroups", 500),
  permission(BACKCHAT_PERMISSION_MENTION_GROUPS, "MentionGroups", 400),
  permission(BACKCHAT_PERMISSION_PIN_NOTES, "PinNotes", 300),
  permission(BACKCHAT_PERMISSION_MANAGE_REVIEWS, "ManageReviews", 200),
  permission(BACKCHAT_PERMISSION_VIEW_ALL, "ViewAll", 100),
];
