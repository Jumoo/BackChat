using Umbraco.Cms.Core.Models.Membership;

namespace BackChat.Services;

/// <summary>A mention the user hasn't read yet, for the comms dashboard.</summary>
/// <param name="Title">The document or group name; direct conversations have none.</param>
public record UnreadMention(
    Guid MessageKey,
    string Channel,
    ChannelKind Kind,
    string? Title,
    string UserName,
    string Message,
    string? Payload,
    string Type,
    DateTime Date);

/// <summary>
/// Mentions of the user newer than when they last read each channel, in channels they can
/// still see.
/// </summary>
public class UnreadMentionService(
    IMentionStore mentionStore,
    IReadStateStore readStateStore,
    IChatMessageStore messageStore,
    ChannelAccessService channelAccess,
    ConversationService conversationService)
{
    public async Task<(IReadOnlyList<UnreadMention> Items, int Total)> GetAsync(IUser user, int skip, int take)
    {
        IReadOnlyDictionary<string, DateTime> lastRead = readStateStore.GetLastRead(user.Key);

        var unread = mentionStore.GetForUser(user.Key)
            .Where(m => lastRead.TryGetValue(m.Channel, out DateTime read) is false || m.Date > read)
            .ToList();

        var allowed = new Dictionary<string, Conversation?>();
        foreach (string channel in unread.Select(m => m.Channel).Distinct())
        {
            allowed[channel] = await channelAccess.AuthorizeAsync(user, channel) is null
                ? null
                : await conversationService.GetConversationAsync(channel);
        }

        var visible = unread.Where(m => allowed[m.Channel] is not null).ToList();
        var page = visible.Skip(skip).Take(take).ToList();
        var messages = messageStore.Get(page.Select(m => m.MessageKey)).ToDictionary(m => m.Key);

        var items = page
            .Where(m => messages.ContainsKey(m.MessageKey))
            .Select(m =>
            {
                ChatMessage message = messages[m.MessageKey];
                Conversation conversation = allowed[m.Channel]!;
                return new UnreadMention(
                    message.Key, m.Channel, conversation.Kind, conversation.Title,
                    message.UserName, message.Message, message.Payload, message.Type, message.Date);
            })
            .ToList();

        return (items, visible.Count);
    }
}
