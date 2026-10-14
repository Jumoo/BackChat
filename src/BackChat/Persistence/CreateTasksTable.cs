using Umbraco.Cms.Infrastructure.Migrations;

namespace BackChat.Persistence;

public class CreateTasksTable : AsyncMigrationBase
{
    public CreateTasksTable(IMigrationContext context) : base(context)
    {
    }

    protected override Task MigrateAsync()
    {
        if (TableExists(TaskDto.TableName) is false)
        {
            Create.Table<TaskDto>().Do();
        }

        return Task.CompletedTask;
    }
}
