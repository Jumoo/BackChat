using Umbraco.Cms.Infrastructure.Migrations;

namespace BackChat.Persistence;

// Lets the messages table hold activity lines as well as chat
public class AddActivity : AsyncMigrationBase
{
    public AddActivity(IMigrationContext context) : base(context)
    {
    }

    protected override Task MigrateAsync()
    {
        if (ColumnExists(ChatMessageDto.TableName, "type") is false)
        {
            AddColumn<ChatMessageDto>("type");
        }

        if (ColumnExists(ChatMessageDto.TableName, "payload") is false)
        {
            AddColumn<ChatMessageDto>("payload");
        }

        return Task.CompletedTask;
    }
}
