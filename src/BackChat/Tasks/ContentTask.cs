namespace BackChat.Tasks;

/// <summary>
/// A to-do on a content item, such as "Get sign-off from legal".
/// </summary>
public class ContentTask
{
    public Guid Key { get; init; } = Guid.NewGuid();

    public Guid DocumentKey { get; init; }

    public required string Title { get; set; }

    public Guid? AssigneeKey { get; set; }

    public DateTime? DueDate { get; set; }

    public int SortOrder { get; set; }

    public Guid CreatedBy { get; init; }

    public DateTime CreatedDate { get; init; } = DateTime.UtcNow;

    public Guid? CompletedBy { get; set; }

    public DateTime? CompletedDate { get; set; }

    public bool IsComplete => CompletedDate is not null;
}
