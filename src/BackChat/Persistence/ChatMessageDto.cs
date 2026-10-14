using BackChat.Services;
using NPoco;
using Umbraco.Cms.Infrastructure.Persistence.DatabaseAnnotations;

namespace BackChat.Persistence;

[TableName(TableName)]
[PrimaryKey("id", AutoIncrement = false)]
[ExplicitColumns]
public class ChatMessageDto
{
    public const string TableName = "BackChatMessages";

    [Column("id")]
    [PrimaryKeyColumn(AutoIncrement = false)]
    public Guid Id { get; set; }

    // History is read by channel, newest first
    [Column("channel")]
    [Length(200)]
    [Index(IndexTypes.NonClustered, Name = "IX_" + TableName + "_channel_date", ForColumns = "channel,date")]
    public string Channel { get; set; } = string.Empty;

    [Column("message")]
    [Length(2000)]
    public string Message { get; set; } = string.Empty;

    [Column("userName")]
    [Length(255)]
    public string UserName { get; set; } = string.Empty;

    [Column("userKey")]
    [NullSetting]
    public Guid? UserKey { get; set; }

    [Column("date")]
    public DateTime Date { get; set; }

    [Column("requiresConfirmation")]
    [Constraint(Default = "0")]
    public bool RequiresConfirmation { get; set; }

    [Column("important")]
    [Constraint(Default = "0")]
    public bool Important { get; set; }

    public static ChatMessageDto From(ChatMessage message) => new()
    {
        Id = message.Key,
        Channel = message.Channel,
        Message = message.Message,
        UserName = message.UserName,
        UserKey = message.UserKey,
        Date = message.Date,
        RequiresConfirmation = message.RequiresConfirmation,
        Important = message.Important,
    };

    public ChatMessage ToChatMessage() => new()
    {
        Key = Id,
        Channel = Channel,
        Message = Message,
        UserName = UserName,
        UserKey = UserKey,
        Date = DateTime.SpecifyKind(Date, DateTimeKind.Utc),
        RequiresConfirmation = RequiresConfirmation,
        Important = Important,
    };
}
