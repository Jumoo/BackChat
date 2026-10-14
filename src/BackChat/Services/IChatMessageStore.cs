namespace BackChat.Services;

public interface IChatMessageStore
{
    void Add(ChatMessage message);

    /// <summary>
    /// Returns the most recent messages for a channel, oldest first.
    /// </summary>
    IReadOnlyList<ChatMessage> GetHistory(string channel);

    /// <summary>
    /// Counts the messages in a channel newer than <paramref name="since"/> that someone
    /// other than <paramref name="userKey"/> sent.
    /// </summary>
    int CountSince(string channel, DateTime? since, Guid userKey);

    /// <summary>
    /// The channels the user has posted in.
    /// </summary>
    IReadOnlyList<string> GetChannelsPostedIn(Guid userKey);

    /// <summary>
    /// The users who have posted in a channel.
    /// </summary>
    IReadOnlyList<Guid> GetPosters(string channel);
}
