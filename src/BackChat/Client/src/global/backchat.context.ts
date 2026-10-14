import { UmbContextBase } from "@umbraco-cms/backoffice/class-api";
import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UMB_AUTH_CONTEXT } from "@umbraco-cms/backoffice/auth";
import { UmbArrayState } from "@umbraco-cms/backoffice/observable-api";
import * as signalR from "@microsoft/signalr";
import { BACKCHAT_HUB_PATH } from "../constants";
import type { ChatMessage } from "../signalR/types";
import { BACKCHAT_CONTEXT } from "./backchat.context.token";

// One hub connection for the whole backoffice, shared by the header app,
// the global modal and every document workspace.
export class BackChatContext extends UmbContextBase {
  #connection?: signalR.HubConnection;
  #joined = new Set<string>();
  #messages = new UmbArrayState<ChatMessage>([], (m) => m.key);

  constructor(host: UmbControllerHost) {
    super(host, BACKCHAT_CONTEXT);

    this.consumeContext(UMB_AUTH_CONTEXT, (auth) => {
      if (!auth || this.#connection) return;

      this.#connection = this.#createConnection(() => auth.getLatestToken());
      this.#connection
        .start()
        .then(() => this.#rejoinChannels())
        .catch((error) => console.error("BackChat hub failed to start", error));
    });
  }

  messagesOf(channel: string) {
    return this.#messages.asObservablePart((list) =>
      list.filter((m) => m.channel === channel)
    );
  }

  joinChannel(channel: string) {
    if (this.#joined.has(channel)) return;
    this.#joined.add(channel);

    if (this.#connection?.state === signalR.HubConnectionState.Connected) {
      this.#connection.invoke("JoinChannel", channel);
    }
  }

  async sendMessage(channel: string, text: string) {
    await this.#connection?.invoke("SendMessage", channel, text);
  }

  #createConnection(getToken: () => Promise<string>) {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(BACKCHAT_HUB_PATH, { accessTokenFactory: getToken })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on("history", (channel: string, history: ChatMessage[]) => {
      const others = this.#messages.getValue().filter((m) => m.channel !== channel);
      this.#messages.setValue([...others, ...history]);
    });

    connection.on("chat", (message: ChatMessage) => {
      const current = this.#messages.getValue();
      if (current.some((m) => m.key === message.key)) return;
      this.#messages.setValue([...current, message]);
    });

    // Groups are lost when the connection drops, so join again
    connection.onreconnected(() => this.#rejoinChannels());

    return connection;
  }

  #rejoinChannels() {
    for (const channel of this.#joined) {
      this.#connection?.invoke("JoinChannel", channel);
    }
  }
}

export default BackChatContext;
