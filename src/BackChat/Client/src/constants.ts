// Appended to the server URL. Matches BackChatHubRoutes on the server.
export const BACKCHAT_HUB_PATH = "/umbraco/backchathub";
export const BACKCHAT_GLOBAL_CHANNEL = "global";
export const BACKCHAT_MAX_MESSAGE_LENGTH = 2000;

export const BackChatTimeOptions: Intl.DateTimeFormatOptions = {
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
};

// Badges stop counting here, so a busy channel shows "9+" rather than a wide number
export const BACKCHAT_BADGE_MAX = 9;

export const formatBadgeCount = (count: number) =>
  count > BACKCHAT_BADGE_MAX ? `${BACKCHAT_BADGE_MAX}+` : `${count}`;

export const BACKCHAT_COMMS_WORKSPACE_VIEW_ALIAS = "BackChat.WorkspaceView.Comms";

// Channels whose readers are a list of people, so a message there can ask each to confirm.
// Matches ConfirmationService.CanAskForConfirmation on the server.
export const canAskForConfirmation = (channel: string) =>
  channel === BACKCHAT_GLOBAL_CHANNEL || channel.startsWith("dm:") || channel.startsWith("group:");
