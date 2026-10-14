import type { UmbLocalizationDictionary } from "@umbraco-cms/backoffice/localization-api";

// English strings for BackChat, grouped by area. Read with this.localize.term("backchat_<key>")
// in code, or "#backchat_<key>" in manifest labels.
const enUs: UmbLocalizationDictionary = {
  backchat: {
    chat: "Chat",
    // The document tab that holds the chat and, later, other comms apps
    commsTab: "Chat",
    message: "Message",
    messagePlaceholder: "Your message",
    connecting: "Connecting to chat…",
    send: "Send",
    sendHint: "Enter to send, Shift+Enter for a new line, @ to mention",
    close: "Close",
    empty: "No messages yet. Start the conversation.",
    saveToStart: "Save this document to start a chat about it.",
    sendFailedHeadline: "Message not sent",
    unreadCount: (count: number) => (count === 1 ? "1 unread message" : `${count} unread messages`),
    mentionedYou: (name: string) => `${name} mentioned you`,
    mentionUnreachableHeadline: "Not everyone was notified",
    mentionUnreachable: (names: string) => `${names} can't see this document, so they weren't notified.`,
    mentionGroup: "Group",
    mentionSuggestions: "People and groups to mention",
    permissionAnnounce: "Send important messages",
    permissionAnnounceDescription: "Send messages that ask to be confirmed, or that hold the screen until they are",
    permissionMessageGroups: "Message user groups",
    permissionMessageGroupsDescription: "Start a conversation with everyone in a user group",
    permissionMentionGroups: "Mention user groups",
    permissionMentionGroupsDescription: "Mention a whole user group in a message, notifying everyone in it",
    permissionPinNotes: "Pin notes",
    permissionPinNotesDescription: "Pin a note on a document for everyone who opens it",
    permissionManageReviews: "Manage review rules",
    permissionManageReviewsDescription: "Set the rules that give content its review dates",
    permissionViewAll: "See everything on the comms dashboard",
    permissionViewAllDescription: "See every open task and overdue review, not only your own",
    sendFailedMessage: "The chat server didn't accept the message. Your text is still in the box, so try again in a moment.",
  },
  // Heading for BackChat's permissions in the user group editor
  user: {
    permissionsEntityGroup_backchat: "BackChat",
  },
};

export default enUs;
