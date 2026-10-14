using BackChat.Persistence;
using NPoco;
using Umbraco.Extensions;
using Umbraco.Cms.Infrastructure.Scoping;

namespace BackChat.Services;

public class DatabaseChatMessageStore(IScopeProvider scopeProvider) : IChatMessageStore
{
    public const int MaxHistory = 500;

    public void Add(ChatMessage message)
    {
        using IScope scope = scopeProvider.CreateScope(autoComplete: true);
        scope.Database.Insert(ChatMessageDto.From(message));
    }

    public IReadOnlyList<ChatMessage> GetHistory(string channel)
    {
        using IScope scope = scopeProvider.CreateScope(autoComplete: true);

        var sql = scope.SqlContext.Sql()
            .Select<ChatMessageDto>()
            .From<ChatMessageDto>()
            .Where<ChatMessageDto>(x => x.Channel == channel)
            .OrderByDescending<ChatMessageDto>(x => x.Date);

        // Newest first from the database, then flipped so the history reads oldest first
        var rows = scope.Database.Page<ChatMessageDto>(1, MaxHistory, sql).Items;

        return rows.Select(r => r.ToChatMessage()).Reverse().ToList();
    }
}
