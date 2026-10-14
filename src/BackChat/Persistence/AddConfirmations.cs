using Umbraco.Cms.Infrastructure.Migrations;

namespace BackChat.Persistence;

// Adds the message flags for confirmation and important messages, and the table of who has confirmed
public class AddConfirmations : AsyncMigrationBase
{
    public AddConfirmations(IMigrationContext context) : base(context)
    {
    }

    protected override Task MigrateAsync()
    {
        if (ColumnExists(ChatMessageDto.TableName, "requiresConfirmation") is false)
        {
            AddColumn<ChatMessageDto>("requiresConfirmation");
        }

        if (ColumnExists(ChatMessageDto.TableName, "important") is false)
        {
            AddColumn<ChatMessageDto>("important");
        }

        if (TableExists(ConfirmationDto.TableName) is false)
        {
            Create.Table<ConfirmationDto>().Do();
        }

        return Task.CompletedTask;
    }
}
