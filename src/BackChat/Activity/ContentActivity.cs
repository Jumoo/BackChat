namespace BackChat.Activity;

/// <summary>
/// The things that can happen to a document, as stored in an activity line's payload.
/// The client turns each into a localised sentence.
/// </summary>
public static class ContentActivity
{
    public const string Saved = "Saved";
    public const string Published = "Published";
    public const string Unpublished = "Unpublished";
    public const string Moved = "Moved";
    public const string Copied = "Copied";
    public const string RolledBack = "RolledBack";
    public const string Trashed = "Trashed";
    public const string Restored = "Restored";
}

/// <param name="Action">One of <see cref="ContentActivity"/>.</param>
/// <param name="Count">How many times it happened, for saves that have collapsed.</param>
public record ActivityPayload(string Action, int Count = 1);
