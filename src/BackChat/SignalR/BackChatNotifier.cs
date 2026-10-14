using BackChat.Services;
using Microsoft.AspNetCore.SignalR;
using Umbraco.Cms.Core.Models.Membership;
using Umbraco.Cms.Core.Services;

namespace BackChat.SignalR;

/// <summary>
/// Sends per user updates (unread counts) to everyone signed in. Lives outside the hub so
/// anything that changes a channel can tell people about it, not only hub methods.
/// </summary>
public class BackChatNotifier(
    IHubContext<BackChatHub> hubContext,
    BackChatConnections connections,
    UnreadService unreadService,
    ChannelAccessService channelAccess,
    IUserService userService)
{
    /// <summary>
    /// Every connection of a user is in this group, so all their tabs stay in step.
    /// </summary>
    internal static string UserGroupName(Guid userKey) => $"backchat:user:{userKey}";

    public Task<IReadOnlyList<UnreadCount>> GetUnreadCountsAsync(IUser user) => unreadService.GetCountsAsync(user);

    public Task SendUnreadCountAsync(Guid userKey, string channel)
        => hubContext.Clients.Group(UserGroupName(userKey))
            .SendAsync("unreadChanged", unreadService.GetCount(userKey, channel));

    /// <summary>
    /// A channel has a new message: update the count of everyone signed in that it counts for.
    /// </summary>
    public async Task ChannelChangedAsync(string channel, Guid? senderKey)
    {
        IEnumerable<Guid> candidates = connections.Users.Where(key => key != senderKey);

        foreach (Guid userKey in unreadService.GetUsersCounting(channel, candidates))
        {
            IUser? user = await userService.GetAsync(userKey);
            if (user is null || await channelAccess.AuthorizeAsync(user, channel) is null)
            {
                continue;
            }

            await SendUnreadCountAsync(userKey, channel);
        }
    }
}
