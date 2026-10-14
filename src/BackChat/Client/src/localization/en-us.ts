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
    sendHint: "Enter to send, Shift+Enter for a new line",
    close: "Close",
    empty: "No messages yet. Start the conversation.",
    saveToStart: "Save this document to start a chat about it.",
    sendFailedHeadline: "Message not sent",
    unreadCount: (count: number) => (count === 1 ? "1 unread message" : `${count} unread messages`),
    sendFailedMessage: "The chat server didn't accept the message. Your text is still in the box, so try again in a moment.",
  },
};

export default enUs;
