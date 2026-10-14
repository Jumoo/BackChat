using BackChat.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Extensions;

namespace BackChat.SignalR;

[Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
public class BackChatHub(
    IUserService userService,
    ChannelAccessService channelAccess,
    IChatMessageStore messageStore,
    IReadStateStore readStateStore,
    BackChatConnections connections,
    BackChatNotifier notifier) : Hub
{
    public const int MaxMessageLength = 2000;

    public override async Task OnConnectedAsync()
    {
        IUser user = await GetCurrentUserAsync();

        connections.Add(user.Key);
        await Groups.AddToGroupAsync(Context.ConnectionId, BackChatNotifier.UserGroupName(user.Key));

        await Clients.Caller.SendAsync("unread", await notifier.GetUnreadCountsAsync(user));

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Guid? userKey = Context.User?.Identity?.GetUserKey();
        if (userKey is not null)
        {
            connections.Remove(userKey.Value);
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Joins a channel. The caller gets its history, then live messages for that channel.
    /// </summary>
    public async Task JoinChannel(string channel)
    {
        IUser user = await GetCurrentUserAsync();
        channel = await AuthorizeChannelAsync(user, channel);

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(channel));

        await Clients.Caller.SendAsync("history", channel, messageStore.GetHistory(channel));
    }

    public async Task SendMessage(string channel, string message)
    {
        if (string.IsNullOrWhiteSpace(message) || message.Length > MaxMessageLength)
        {
            throw new HubException($"Messages must be between 1 and {MaxMessageLength} characters.");
        }

        IUser user = await GetCurrentUserAsync();
        channel = await AuthorizeChannelAsync(user, channel);

        var chatMessage = new ChatMessage
        {
            Channel = channel,
            Message = message.Trim(),
            UserName = user.Name ?? user.Username,
            UserKey = user.Key,
        };

        messageStore.Add(chatMessage);

        // Replying means you've read the channel
        readStateStore.MarkRead(user.Key, channel, chatMessage.Date);

        await Clients.Group(GroupName(channel)).SendAsync("chat", chatMessage);

        await notifier.SendUnreadCountAsync(user.Key, channel);
        await notifier.ChannelChangedAsync(channel, user.Key);
    }

    /// <summary>
    /// Marks a channel read up to now. The client calls it while the chat is open and visible.
    /// Every tab the user has open gets the new count.
    /// </summary>
    public async Task MarkRead(string channel)
    {
        IUser user = await GetCurrentUserAsync();
        channel = await AuthorizeChannelAsync(user, channel);

        readStateStore.MarkRead(user.Key, channel, DateTime.UtcNow);

        await notifier.SendUnreadCountAsync(user.Key, channel);
    }

    internal static string GroupName(string channel) => $"backchat:{channel}";

    // The user comes from the connection's claims, as Umbraco's own hubs do. The
    // HttpContext-based accessors aren't reliable inside hub method calls.
    private async Task<IUser> GetCurrentUserAsync()
    {
        Guid? userKey = Context.User?.Identity?.GetUserKey();
        IUser? user = userKey is null ? null : await userService.GetAsync(userKey.Value);

        return user ?? throw new HubException("No backoffice user.");
    }

    /// <returns>The channel in its normalised form.</returns>
    private async Task<string> AuthorizeChannelAsync(IUser user, string channel)
        => await channelAccess.AuthorizeAsync(user, channel)
            ?? throw new HubException("You do not have access to this channel.");
}
