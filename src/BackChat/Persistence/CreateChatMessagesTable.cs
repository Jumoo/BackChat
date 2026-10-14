using Umbraco.Cms.Infrastructure.Migrations;

namespace BackChat.Persistence;

public class CreateChatMessagesTable : AsyncMigrationBase
{
    public CreateChatMessagesTable(IMigrationContext context) : base(context)
    {
    }

    protected override Task MigrateAsync()
    {
        if (TableExists(ChatMessageDto.TableName) is false)
        {
            Create.Table<ChatMessageDto>().Do();
        }

        return Task.CompletedTask;
    }
}
