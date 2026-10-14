namespace BackChat.Services;

public class ChatMessage
{
    public Guid Key { get; init; } = Guid.NewGuid();

    /// <summary>
    /// The channel the message was sent to: "global" or a document key.
    /// </summary>
    public required string Channel { get; init; }

    public required string Message { get; init; }

    public required string UserName { get; init; }

    public Guid? UserKey { get; init; }

    public DateTime Date { get; init; } = DateTime.UtcNow;
}
