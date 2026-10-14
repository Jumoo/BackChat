import { UmbContextBase } from "@umbraco-cms/backoffice/class-api";
import type { UmbControllerHost } from "@umbraco-cms/backoffice/controller-api";
import { UMB_AUTH_CONTEXT } from "@umbraco-cms/backoffice/auth";
import { UMB_SERVER_CONTEXT } from "@umbraco-cms/backoffice/server";
import { UmbArrayState, UmbBooleanState } from "@umbraco-cms/backoffice/observable-api";
import {
  HubConnectionBuilder,
  HubConnectionState,
  HttpTransportType,
  type HubConnection,
  type IHttpConnectionOptions,
  type IRetryPolicy,
} from "@umbraco-cms/backoffice/external/signalr";
import { BACKCHAT_HUB_PATH } from "../constants";
import type { ChatMessage } from "../signalR/types";
import { BACKCHAT_CONTEXT } from "./backchat.context.token";

// Keep trying with backoff (up to 30 seconds apart) rather than giving up after a few
// attempts, so the chat comes back by itself once the server is reachable again.
const reconnectPolicy: IRetryPolicy = {
  nextRetryDelayInMilliseconds: (context) => Math.min(30_000, 1_000 * 2 ** context.previousRetryCount),
};

// One hub connection for the whole backoffice, shared by the header app, the global
// modal and every document workspace. Follows the pattern of Umbraco's own server
// event context: connect only while authorized, and use the server's SignalR settings.
export class BackChatContext extends UmbContextBase {
  #connection?: HubConnection;
  #authContext?: typeof UMB_AUTH_CONTEXT.TYPE;
  #serverContext?: typeof UMB_SERVER_CONTEXT.TYPE;
  #joined = new Set<string>();

  #messages = new UmbArrayState<ChatMessage>([], (m) => m.key);

  #isConnected = new UmbBooleanState(false);
  public readonly isConnected = this.#isConnected.asObservable();

  constructor(host: UmbControllerHost) {
    super(host, BACKCHAT_CONTEXT);

    this.consumeContext(UMB_AUTH_CONTEXT, (context) => {
      this.#authContext = context;
      this.#observeIsAuthorized();
    });

    this.consumeContext(UMB_SERVER_CONTEXT, (context) => {
      this.#serverContext = context;
      this.#observeIsAuthorized();
    });
  }

  messagesOf(channel: string) {
    return this.#messages.asObservablePart((list) => list.filter((m) => m.channel === channel));
  }

  joinChannel(channel: string) {
    if (this.#joined.has(channel)) return;
    this.#joined.add(channel);

    if (this.#connection?.state === HubConnectionState.Connected) {
      this.#join(this.#connection, channel);
    }
  }

  /**
   * Sends a message. Rejects when there is no live connection or the server refuses it,
   * so the caller can keep the text and tell the user.
   */
  async sendMessage(channel: string, text: string) {
    if (this.#connection?.state !== HubConnectionState.Connected) {
      throw new Error("Not connected");
    }

    await this.#connection.invoke("SendMessage", channel, text);
  }

  #observeIsAuthorized() {
    if (!this.#authContext || !this.#serverContext) return;

    this.observe(
      this.#authContext.isAuthorized,
      (isAuthorized) => {
        if (isAuthorized === undefined) return;

        if (isAuthorized) {
          this.#connect();
        } else {
          this.#disconnect();
        }
      },
      "_observeIsAuthorized"
    );
  }

  #connect() {
    if (this.#connection) return;

    const serverUrl = this.#serverContext?.getServerUrl();
    if (!serverUrl) return;

    // Backoffice auth is cookie based, so the token value is a placeholder, as in Umbraco's own hubs
    const options: IHttpConnectionOptions = { accessTokenFactory: () => "[redacted]" };

    if (this.#serverContext?.getServerConnection()?.getSignalRSkipNegotiation()) {
      options.skipNegotiation = true;
      options.transport = HttpTransportType.WebSockets;
    }

    const connection = new HubConnectionBuilder()
      .withUrl(`${serverUrl}${BACKCHAT_HUB_PATH}`, options)
      .withAutomaticReconnect(reconnectPolicy)
      .build();

    this.#connection = connection;

    connection.on("history", (channel: string, history: ChatMessage[]) => {
      const others = this.#messages.getValue().filter((m) => m.channel !== channel);
      this.#messages.setValue([...others, ...history]);
    });

    connection.on("chat", (message: ChatMessage) => {
      this.#messages.appendOne(message);
    });

    // Group membership is per connection, so join every channel again after a reconnect
    connection.onreconnecting(() => this.#setConnected(connection, false));
    connection.onreconnected(() => {
      this.#setConnected(connection, true);
      this.#joinAll(connection);
    });
    connection.onclose(() => this.#setConnected(connection, false));

    connection
      .start()
      .then(() => {
        this.#setConnected(connection, true);
        this.#joinAll(connection);
      })
      .catch((error) => {
        this.#setConnected(connection, false);
        console.error("BackChat: failed to connect to the chat hub", error);
      });
  }

  #disconnect() {
    const connection = this.#connection;
    this.#connection = undefined;
    this.#isConnected.setValue(false);
    connection?.stop();
  }

  // A superseded connection can still report state while it shuts down; only the active one counts
  #setConnected(connection: HubConnection, isConnected: boolean) {
    if (this.#connection === connection) {
      this.#isConnected.setValue(isConnected);
    }
  }

  #joinAll(connection: HubConnection) {
    for (const channel of this.#joined) {
      this.#join(connection, channel);
    }
  }

  #join(connection: HubConnection, channel: string) {
    connection
      .invoke("JoinChannel", channel)
      .catch((error) => console.error(`BackChat: could not join channel ${channel}`, error));
  }
}

export { BackChatContext as api };
