using Umbraco.Cms.Infrastructure.Migrations;

namespace BackChat.Persistence;

public class CreateReadStateTable : AsyncMigrationBase
{
    public CreateReadStateTable(IMigrationContext context) : base(context)
    {
    }

    protected override Task MigrateAsync()
    {
        if (TableExists(ReadStateDto.TableName) is false)
        {
            Create.Table<ReadStateDto>().Do();
        }

        return Task.CompletedTask;
    }
}
