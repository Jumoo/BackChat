namespace BackChat.Activity;

/// <summary>
/// Which content events post a line in the document's chat. Set under <c>BackChat:Activity</c>
/// in appsettings.
/// </summary>
public class BackChatActivityOptions
{
    public const string Section = "BackChat:Activity";

    public bool Enabled { get; set; } = true;

    /// <summary>
    /// The events to post. Any of: Saved, Published, Unpublished, Moved, Copied, RolledBack,
    /// Trashed, Restored, TaskAssigned, TaskCompleted.
    /// </summary>
    public string[] Events { get; set; } =
        [
            ContentActivity.Saved,
            ContentActivity.Published,
            ContentActivity.Unpublished,
            ContentActivity.Moved,
            ContentActivity.Copied,
            ContentActivity.RolledBack,
            ContentActivity.Trashed,
            ContentActivity.Restored,
            ContentActivity.TaskAssigned,
            ContentActivity.TaskCompleted,
        ];

    /// <summary>
    /// Repeated saves by one person within this many minutes collapse into one line
    /// ("saved this 6 times").
    /// </summary>
    public int CollapseMinutes { get; set; } = 30;
}
