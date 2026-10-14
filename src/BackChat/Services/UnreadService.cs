using Umbraco.Cms.Core.Models.Membership;

namespace BackChat.Services;

/// <summary>
/// The unread count for one channel. Mentions are counted separately so the client can
/// make a mention stand out from general chatter.
/// </summary>
public record UnreadCount(string Channel, int Unread, int Mentions);

/// <summary>
/// Works out which channels count towards a user's unread badge, and how many messages
/// in them they haven't read.
/// </summary>
/// <remarks>
/// Counting every document chat for every user would be noise, so a document channel only
/// counts once the user has posted or been mentioned in it. The global channel always counts.
/// </remarks>
public class UnreadService(
    IChatMessageStore messageStore,
    IReadStateStore readStateStore,
    IMentionStore mentionStore,
    ChannelAccessService channelAccess)
{
    public IReadOnlyCollection<string> GetCountedChannels(Guid userKey)
    {
        var channels = new HashSet<string> { Constants.GlobalChannel };
        channels.UnionWith(messageStore.GetChannelsPostedIn(userKey));
        channels.UnionWith(mentionStore.GetChannelsMentionedIn(userKey));
        return channels;
    }

    /// <summary>
    /// Whether the channel counts for each of the given users. Returns the ones it counts for.
    /// </summary>
    public IReadOnlyCollection<Guid> GetUsersCounting(string channel, IEnumerable<Guid> userKeys)
    {
        if (channel == Constants.GlobalChannel)
        {
            return userKeys.ToList();
        }

        var counting = messageStore.GetPosters(channel).ToHashSet();
        counting.UnionWith(mentionStore.GetMentionedUsers(channel));
        return userKeys.Where(counting.Contains).ToList();
    }

    /// <summary>
    /// The counts for every channel that counts for the user and that they can still access.
    /// Channels with nothing unread are left out.
    /// </summary>
    public async Task<IReadOnlyList<UnreadCount>> GetCountsAsync(IUser user)
    {
        IReadOnlyDictionary<string, DateTime> lastRead = readStateStore.GetLastRead(user.Key);
        var counts = new List<UnreadCount>();

        foreach (string channel in GetCountedChannels(user.Key))
        {
            if (await channelAccess.AuthorizeAsync(user, channel) is null)
            {
                continue;
            }

            UnreadCount count = Count(user.Key, channel, lastRead);
            if (count.Unread > 0)
            {
                counts.Add(count);
            }
        }

        return counts;
    }

    public UnreadCount GetCount(Guid userKey, string channel)
        => Count(userKey, channel, readStateStore.GetLastRead(userKey));

    private UnreadCount Count(Guid userKey, string channel, IReadOnlyDictionary<string, DateTime> lastRead)
    {
        DateTime? since = lastRead.TryGetValue(channel, out DateTime date) ? date : null;
        return new UnreadCount(
            channel,
            messageStore.CountSince(channel, since, userKey),
            mentionStore.CountSince(userKey, channel, since));
    }
}
