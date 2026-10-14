using Umbraco.Cms.Core.Packaging;

namespace BackChat.Persistence;

// Umbraco runs this plan once for the package and records the state, so the table is created on first run
public class BackChatMigrationPlan : PackageMigrationPlan
{
    public BackChatMigrationPlan() : base(Constants.PackageName)
    {
    }

    protected override void DefinePlan()
    {
        To<CreateChatMessagesTable>("create-chat-messages-table");
        To<CreateReadStateTable>("create-read-state-table");
        To<CreateMentionsTable>("create-mentions-table");
    }
}
