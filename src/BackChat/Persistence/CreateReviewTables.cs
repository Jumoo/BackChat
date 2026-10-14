using Umbraco.Cms.Infrastructure.Migrations;

namespace BackChat.Persistence;

public class CreateReviewTables : AsyncMigrationBase
{
    public CreateReviewTables(IMigrationContext context) : base(context)
    {
    }

    protected override Task MigrateAsync()
    {
        if (TableExists(ReviewRuleDto.TableName) is false)
        {
            Create.Table<ReviewRuleDto>().Do();
        }

        if (TableExists(ReviewDto.TableName) is false)
        {
            Create.Table<ReviewDto>().Do();
        }

        if (TableExists(ReviewHistoryDto.TableName) is false)
        {
            Create.Table<ReviewHistoryDto>().Do();
        }

        return Task.CompletedTask;
    }
}
