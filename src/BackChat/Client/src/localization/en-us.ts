import type { UmbLocalizationDictionary } from "@umbraco-cms/backoffice/localization-api";

// English strings for BackChat, grouped by area. Read with this.localize.term("backchat_<key>")
// in code, or "#backchat_<key>" in manifest labels.
const enUs: UmbLocalizationDictionary = {
  backchat: {
    chat: "Chat",
    message: "Message",
    messagePlaceholder: "Your message",
    send: "Send",
    close: "Close",
    saveToStart: "Save this document to start a chat about it.",
  },
};

export default enUs;
