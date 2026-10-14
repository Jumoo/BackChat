using Umbraco.Cms.Infrastructure.Migrations;

namespace BackChat.Persistence;

public class CreateChatMessagesTable : MigrationBase
{
    public CreateChatMessagesTable(IMigrationContext context) : base(context)
    {
    }

    protected override void Migrate()
    {
        if (TableExists(ChatMessageDto.TableName) is false)
        {
            Create.Table<ChatMessageDto>().Do();
        }
    }
}
