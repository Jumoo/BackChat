import { UmbContextToken } from "@umbraco-cms/backoffice/context-api";
import type { BackChatContext } from "./backchat.context";

export const BACKCHAT_CONTEXT = new UmbContextToken<BackChatContext>(
  "BackChat.Context"
);
