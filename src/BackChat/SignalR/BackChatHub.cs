using BackChat.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Umbraco.Cms.Core.Security;
using Umbraco.Cms.Web.Common.Authorization;

namespace BackChat.SignalR;

[Authorize(Policy = AuthorizationPolicies.BackOfficeAccess)]
public class BackChatHub(
    IBackOfficeSecurityAccessor backOfficeSecurityAccessor,
    IChatMessageStore messageStore) : Hub
{
    public const int MaxChannelLength = 200;
    public const int MaxMessageLength = 2000;

    /// <summary>
    /// Joins a channel. The caller gets its history, then live messages for that channel.
    /// </summary>
    public async Task JoinChannel(string channel)
    {
        ValidateChannel(channel);

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(channel));

        await Clients.Caller.SendAsync("history", channel, messageStore.GetHistory(channel));
    }

    public async Task LeaveChannel(string channel)
    {
        ValidateChannel(channel);

        await Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(channel));
    }

    public async Task SendMessage(string channel, string message)
    {
        ValidateChannel(channel);

        if (string.IsNullOrWhiteSpace(message) || message.Length > MaxMessageLength)
        {
            throw new HubException($"Messages must be between 1 and {MaxMessageLength} characters.");
        }

        var user = backOfficeSecurityAccessor.BackOfficeSecurity?.CurrentUser
            ?? throw new HubException("No backoffice user.");

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

    private static void ValidateChannel(string channel)
    {
        if (string.IsNullOrWhiteSpace(channel) || channel.Length > MaxChannelLength)
        {
            throw new HubException("Invalid channel.");
        }
    }
}
