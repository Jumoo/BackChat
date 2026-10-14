using BackChat.Security;
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
    IMentionStore mentionStore,
    MentionService mentionService,
    ConversationService conversationService,
    IUserGroupService userGroupService,
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

    /// <returns>Anything the sender should know, such as people they mentioned who can't see the chat.</returns>
    public async Task<SendMessageResult> SendMessage(string channel, string message)
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

        // A group mention is close to an announcement, so it needs its own permission
        if (MentionService.Parse(chatMessage.Message).Any(m => m.Kind == "group")
            && user.Has(BackChatPermissions.MentionGroups) is false)
        {
            throw new HubException("You don't have permission to mention a whole user group.");
        }

        MentionResult mentions = await mentionService.ResolveAsync(chatMessage.Message, user, channel);

        messageStore.Add(chatMessage);
        mentionStore.Add(chatMessage, mentions.Recipients);

        // Replying means you've read the channel
        readStateStore.MarkRead(user.Key, channel, chatMessage.Date);

        await Clients.Group(GroupName(channel)).SendAsync("chat", chatMessage);

        await notifier.SendUnreadCountAsync(user.Key, channel);
        await notifier.ChannelChangedAsync(channel, user.Key);
        await notifier.SendMentionAsync(mentions.Recipients, chatMessage);

        return new SendMessageResult(mentions.Unreachable);
    }

    /// <summary>
    /// The users and groups that can be mentioned, for the picker and for showing names in messages.
    /// </summary>
    public async Task<Mentionables> GetMentionables()
    {
        await GetCurrentUserAsync();
        return await mentionService.GetMentionablesAsync();
    }

    /// <summary>
    /// The conversations for the header chat: global, the caller's direct and group
    /// conversations, and document chats with something unread.
    /// </summary>
    public async Task<IReadOnlyList<Conversation>> GetConversations()
        => await conversationService.GetConversationsAsync(await GetCurrentUserAsync());

    /// <summary>
    /// Opens a direct conversation between the caller and the given people. The same people
    /// always get the same conversation. Nothing is stored until someone sends a message.
    /// </summary>
    public async Task<Conversation> StartDirectConversation(Guid[] userKeys)
    {
        IUser user = await GetCurrentUserAsync();

        var participants = userKeys.Append(user.Key).Distinct().ToList();
        if (participants.Count < 2 || participants.Count > Channels.MaxDirectParticipants)
        {
            throw new HubException($"A conversation is between 2 and {Channels.MaxDirectParticipants} people.");
        }

        foreach (Guid key in participants)
        {
            IUser? participant = await userService.GetAsync(key);
            if (participant is null || MentionService.IsMentionable(participant) is false)
            {
                throw new HubException("One of those people can't be messaged.");
            }
        }

        string channel = Channels.Direct(participants);
        return (await conversationService.GetConversationAsync(channel))!;
    }

    /// <summary>
    /// Opens the conversation for a user group. Needs the permission to message groups.
    /// </summary>
    public async Task<Conversation> StartGroupConversation(Guid groupKey)
    {
        IUser user = await GetCurrentUserAsync();
        if (user.Has(BackChatPermissions.MessageGroups) is false)
        {
            throw new HubException("You don't have permission to message user groups.");
        }

        if (await userGroupService.GetAsync(groupKey) is null)
        {
            throw new HubException("No such user group.");
        }

        return (await conversationService.GetConversationAsync(Channels.Group(groupKey)))!;
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

    public record SendMessageResult(IReadOnlyList<string> Unreachable);

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
