using Umbraco.Cms.Infrastructure.Migrations;

namespace BackChat.Persistence;

public class CreateMentionsTable : AsyncMigrationBase
{
    public CreateMentionsTable(IMigrationContext context) : base(context)
    {
    }

    protected override Task MigrateAsync()
    {
        if (TableExists(MentionDto.TableName) is false)
        {
            Create.Table<MentionDto>().Do();
        }

        return Task.CompletedTask;
    }
}
