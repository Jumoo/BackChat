namespace BackChat.Services;

public interface IChatMessageStore
{
    void Add(ChatMessage message);

    /// <summary>
    /// Returns the most recent messages for a channel, oldest first.
    /// </summary>
    IReadOnlyList<ChatMessage> GetHistory(string channel);
}
