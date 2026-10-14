using BackChat.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Umbraco.Cms.Core.Actions;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Services.AuthorizationStatus;
using Umbraco.Cms.Web.Common.Authorization;
using Umbraco.Extensions;

namespace BackChat.SignalR;

[Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
public class BackChatHub(
    IUserService userService,
    IContentPermissionService contentPermissionService,
    IChatMessageStore messageStore) : Hub
{
    public const int MaxMessageLength = 2000;

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

        await Clients.Group(GroupName(channel)).SendAsync("chat", chatMessage);
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

    /// <summary>
    /// A channel is either the global channel or a document key. Document channels
    /// need browse access to the document, so a chat is only visible to users who can see it.
    /// </summary>
    /// <returns>The channel in its normalised form.</returns>
    private async Task<string> AuthorizeChannelAsync(IUser user, string channel)
    {
        if (channel == Constants.GlobalChannel)
        {
            return channel;
        }

        if (Guid.TryParse(channel, out Guid documentKey) is false)
        {
            throw new HubException("Invalid channel.");
        }

        ContentAuthorizationStatus status = await contentPermissionService.AuthorizeAccessAsync(
            user, documentKey, ActionBrowse.ActionLetter);

        if (status != ContentAuthorizationStatus.Success)
        {
            throw new HubException("You do not have access to this document.");
        }

        return documentKey.ToString();
    }
}
